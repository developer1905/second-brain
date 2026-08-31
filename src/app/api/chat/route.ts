import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const sessionsMap = new Map<string, typeof messages[0]>();
    messages.forEach((m) => {
      if (!sessionsMap.has(m.sessionId)) sessionsMap.set(m.sessionId, m);
    });
    return NextResponse.json(Array.from(sessionsMap.values()));
  }

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, content, history = [], userApiKey = '' } = body as {
      sessionId: string;
      content: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
      userApiKey?: string;
    };

    if (!sessionId || !content?.trim()) {
      return NextResponse.json({ error: 'sessionId va content kiritilmadi' }, { status: 400 });
    }

    const userQuery = content.trim();

    // 1. Save user message to database
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: userQuery },
    });

    let aiReply = '';

    // 2. Direct DeepSeek V3 API Call
    const deepseekKey = userApiKey?.trim() || process.env.DEEPSEEK_API_KEY || 'sk-45c4187a0fa74b37b3a258d00d1d8dd1';
    if (deepseekKey && deepseekKey.startsWith('sk-')) {
      try {
        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: `Siz DeepSeek AI modelisiz. O'zbek tilida to'g'ridan-to'g'ri, aniq va erkin javob bering. Hech qanday shablon, sarlavha yoki statistika qo'shmang.`,
              },
              ...history.slice(-8).map((h) => ({
                role: h.role === 'user' ? 'user' : 'assistant',
                content: h.content,
              })),
              { role: 'user', content: userQuery },
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        });

        if (dsRes.ok) {
          const dsData = await dsRes.json();
          const reply = dsData.choices?.[0]?.message?.content;
          if (reply) {
            aiReply = reply;
          }
        }
      } catch (dsErr) {
        console.error('DeepSeek API error:', dsErr);
      }
    }

    // 3. Clean Direct Fallback Message (No fluff or template blocks)
    if (!aiReply) {
      aiReply = `DeepSeek API kalitida balans yetarli emas (HTTP 402 Payment Required). platform.deepseek.com saytida balansni to'ldiring yoki to'g'ri API kalit kiriting.`;
    }

    // 4. Save assistant reply to database
    const assistantMsg = await prisma.chatMessage.create({
      data: { sessionId, role: 'assistant', content: aiReply },
    });

    return NextResponse.json({ message: assistantMsg });
  } catch (err: any) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Chat xatosi: ' + err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  await prisma.chatMessage.deleteMany({ where: { sessionId } });
  return NextResponse.json({ ok: true });
}
