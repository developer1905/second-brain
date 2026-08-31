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

    // 2. OpenRouter API Call (DeepSeek R1 / ChatGPT 4o / Llama 3)
    const openrouterKey = userApiKey?.trim() || process.env.OPENROUTER_API_KEY || '';

    if (openrouterKey && openrouterKey.startsWith('sk-or-')) {
      try {
        const messagesPayload = [
          {
            role: 'system',
            content: `Siz OpenRouter va Second Brain AI yordamchisiz. O'zbek tilida erkin, samimiy, intellektual va do'stona muloqot qiling. Hech qanday shablon yoki statistika qo'shmang.`,
          },
          ...history.slice(-8).map((h) => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.content,
          })),
          { role: 'user', content: userQuery },
        ];

        const openrouterModels = ['openrouter/auto', 'deepseek/deepseek-r1:free', 'meta-llama/llama-3.3-70b-instruct:free'];

        for (const model of openrouterModels) {
          try {
            const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openrouterKey}`,
              },
              body: JSON.stringify({
                model,
                messages: messagesPayload,
                temperature: 0.7,
                max_tokens: 1500,
              }),
            });

            if (orRes.ok) {
              const orData = await orRes.json();
              const text = orData.choices?.[0]?.message?.content;
              if (text) {
                aiReply = text;
                break;
              }
            }
          } catch (e) {
            console.warn(`OpenRouter call failed for ${model}:`, e);
          }
        }
      } catch (orErr) {
        console.error('OpenRouter API error:', orErr);
      }
    }

    // 3. Fallback: Google Gemini API
    if (!aiReply) {
      const geminiKey = process.env.GEMINI_API_KEY || '';
      if (geminiKey) {
        try {
          const contents = [
            { role: 'user', parts: [{ text: "Siz AI yordamchisiz. O'zbek tilida erkin javob bering." }] },
            { role: 'user', parts: [{ text: userQuery }] },
          ];

          const gRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents }),
            }
          );

          if (gRes.ok) {
            const gData = await gRes.json();
            aiReply = gData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          }
        } catch (e) {
          console.error('Gemini fallback error:', e);
        }
      }
    }

    if (!aiReply) {
      aiReply = `Salom! Men OpenRouter AI suhbatdoshingizman. Qanday yordam bera olaman? 😊`;
    }

    // Save assistant reply
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
