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

    // Save user message to database
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: userQuery },
    });

    let aiReply = '';

    const geminiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY || 'AIzaSyBDqKK1Ki3PElFylbqKLXz_gTuhLrA50zk';

    if (geminiKey) {
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: "Siz Google Gemini AI yordamchisiz. O'zbek tilida erkin, samimiy va intellektual yozishib muloqot qiling. Hech qanday shablon yoki statistika qo'shmang.",
            },
          ],
        },
        ...history.slice(-6).map((h) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        })),
        { role: 'user', parts: [{ text: userQuery }] },
      ];

      const geminiModels = ['gemini-flash-latest', 'gemini-pro-latest', 'gemini-2.5-flash'];

      for (const model of geminiModels) {
        try {
          const gRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents }),
            }
          );

          if (gRes.ok) {
            const gData = await gRes.json();
            const text = gData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              aiReply = text;
              break;
            }
          }
        } catch (e) {
          console.warn(`Gemini call failed for ${model}:`, e);
        }
      }
    }

    if (!aiReply) {
      aiReply = `Salom! Men Gemini AI suhbatdoshingizman. Savolingizni bemalol berishingiz mumkin. 😊`;
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
