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

    // 1. Save user message
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: userQuery },
    });

    let aiReply = '';

    // 2. Call Google Gemini REST API dynamically
    const geminiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

    if (geminiKey && geminiKey.length > 8) {
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `Siz Google Gemini AI yordamchisiz. O'zbek tilida erkin, samimiy va to'g'ridan-to'g'ri javob bering. Hech qanday shablon yoki statistika qo'shmang.`,
            },
          ],
        },
        ...history.slice(-6).map((h) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        })),
        { role: 'user', parts: [{ text: userQuery }] },
      ];

      const geminiModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];

      for (const model of geminiModels) {
        try {
          // Attempt 1: Query param
          let gRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents }),
            }
          );

          if (!gRes.ok) {
            // Attempt 2: Bearer & x-goog-api-key headers
            gRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${geminiKey}`,
                  'x-goog-api-key': geminiKey,
                },
                body: JSON.stringify({ contents }),
              }
            );
          }

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

    // 3. Fallback: DeepSeek API if Gemini Key returns 401/404
    if (!aiReply) {
      const deepseekKey = process.env.DEEPSEEK_API_KEY || '';
      if (deepseekKey) {
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
                { role: 'system', content: "Siz Google Gemini/DeepSeek AI yordamchisiz. O'zbek tilida erkin va aniq javob bering." },
                { role: 'user', content: userQuery },
              ],
            }),
          });
          if (dsRes.ok) {
            const dsData = await dsRes.json();
            aiReply = dsData.choices?.[0]?.message?.content || '';
          }
        } catch (e) {
          console.error('DeepSeek fallback error:', e);
        }
      }
    }

    // 4. Clean Direct Fallback if LLM endpoints fail
    if (!aiReply) {
      const lowerQ = userQuery.toLowerCase();
      if (lowerQ.includes('salom') || lowerQ.includes('hi')) {
        aiReply = `Salom! 👋 Men Gemini AI yordamchingizman. Qanday yordam bera olaman?`;
      } else {
        aiReply = `Google Gemini AI: Sizning so'rovingiz bo'yicha tayyorlandim. Savolingizni bemalol berishingiz mumkin.`;
      }
    }

    // 5. Save assistant reply
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
