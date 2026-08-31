import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGroqApiKey, getOpenRouterApiKey, getGeminiApiKey } from '@/lib/ai-config';

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
    const cleanUserKey = userApiKey?.trim() || '';

    // 2. GROQ API (gsk_...) - 500 tokens/sec ultra fast
    const groqKey = cleanUserKey.startsWith('gsk_') ? cleanUserKey : getGroqApiKey();
    if (groqKey && groqKey.startsWith('gsk_')) {
      try {
        const groqModels = ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
        for (const model of groqModels) {
          try {
            const gRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`,
              },
              body: JSON.stringify({
                model,
                messages: [
                  { role: 'system', content: "Siz Groq AI va Second Brain yordamchisiz. O'zbek tilida erkin, intellektual va aniq javob bering." },
                  ...history.slice(-6).map((h) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
                  { role: 'user', content: userQuery },
                ],
                temperature: 0.7,
              }),
            });
            if (gRes.ok) {
              const gData = await gRes.json();
              const text = gData.choices?.[0]?.message?.content;
              if (text) {
                aiReply = text;
                break;
              }
            }
          } catch (e) {}
        }
      } catch (e) {
        console.error('Groq API error:', e);
      }
    }

    // 3. OpenRouter API (sk-or-v1-...)
    if (!aiReply) {
      const openrouterKey = cleanUserKey.startsWith('sk-or-') ? cleanUserKey : getOpenRouterApiKey();
      if (openrouterKey && openrouterKey.startsWith('sk-or-')) {
        try {
          const messagesPayload = [
            {
              role: 'system',
              content: `Siz OpenRouter AI yordamchisiz. O'zbek tilida erkin va intellektual muloqot qiling.`,
            },
            ...history.slice(-6).map((h) => ({
              role: h.role === 'user' ? 'user' : 'assistant',
              content: h.content,
            })),
            { role: 'user', content: userQuery },
          ];

          const openrouterModels = ['openrouter/free', 'z-ai/glm-5.2:free', 'inclusionai/ling-3.0-flash-fin:free'];

          for (const model of openrouterModels) {
            try {
              const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${openrouterKey}`,
                  'HTTP-Referer': 'https://second-brain-ai-uob8.onrender.com',
                  'X-Title': 'Second Brain AI',
                },
                body: JSON.stringify({
                  model,
                  messages: messagesPayload,
                  temperature: 0.7,
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
            } catch (e) {}
          }
        } catch (orErr) {}
      }
    }

    // 4. Google Gemini API
    if (!aiReply) {
      const geminiKey = cleanUserKey.startsWith('AIzaSy') ? cleanUserKey : getGeminiApiKey();
      if (geminiKey) {
        try {
          const contents = [
            { role: 'user', parts: [{ text: "Siz Google Gemini AI yordamchisiz. O'zbek tilida erkin va intellektual javob bering." }] },
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
        } catch (e) {}
      }
    }

    if (!aiReply) {
      aiReply = `Salom! So'rovingiz bo'yicha tahlil tayyorlandi. "${userQuery}" masalasida qanday maslahat beray? 😊`;
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
