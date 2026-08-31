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

    // Always fetch recent Telegram messages & notes to ensure 100% full context access
    const [recentTgMsgs, tgNotes, allNotes] = await Promise.all([
      prisma.telegramMessage.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        select: { fromName: true, text: true, createdAt: true, paraCategory: true },
      }),
      prisma.note.findMany({
        where: { sourceType: 'TELEGRAM' },
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: { title: true, content: true, paraCategory: true },
      }),
      prisma.note.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
        select: { title: true, content: true, paraCategory: true },
      }),
    ]);

    const tgList = recentTgMsgs.map((m) => `[${m.fromName}]: ${m.text.slice(0, 120)}`).join('\n');
    const noteList = tgNotes.map((n) => `[${n.paraCategory}] ${n.title}: ${n.content.slice(0, 120)}`).join('\n');
    const generalNoteList = allNotes.map((n) => `[${n.paraCategory}] ${n.title}`).join(' | ');

    const systemMsg = `Siz Second Brain AI yordamchisiz. Foydalanuvchining Telegram va Second Brain xotira bazasi bilan 100% bog'langansiz.

FOYDALANUVCHINING SECOND BRAIN BAZASIDAGI REAL MA'LUMOTLARI:
- Telegram Xabarlari Soni: ${recentTgMsgs.length} ta
- So'nggi Telegram Xabarlari:
${tgList || 'Foydalanuvchi hali Telegram botiga yangi xabar yubormadi.'}

- Telegram Qaydlari (${tgNotes.length} ta):
${noteList || 'Foydalanuvchi hali Telegram qaydlarini kiritmadi.'}

- Umumiy Qaydlar: ${generalNoteList || 'Hozircha qaydlar yo\'q.'}

QOIDA:
Agar Telegram xabarlari 0 ta bo'lsa: "Tizimda Telegram ulangan, lekin hali botimizga (@secondbrainn7_bot) yangi xabar yuborilmadi. Botga 1 ta bo'lsa ham xabar yuborsangiz, uni darhol shu yerda o'qib tahlil qilaman!" deb javob bering.`;

    // Save user message to database
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: userQuery },
    });

    let aiReply = '';
    const cleanUserKey = userApiKey?.trim() || '';

    // 1. GROQ API (gsk_...) - High Speed GPT-OSS & Qwen Engine
    const groqKey = cleanUserKey.startsWith('gsk_') ? cleanUserKey : getGroqApiKey();
    if (groqKey && groqKey.startsWith('gsk_')) {
      const groqModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];

      for (const model of groqModels) {
        try {
          const gRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`,
              'User-Agent': 'SecondBrainAI/1.0',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemMsg },
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
    }

    // 2. OpenRouter API Fallback
    if (!aiReply) {
      const openrouterKey = cleanUserKey.startsWith('sk-or-') ? cleanUserKey : getOpenRouterApiKey();
      if (openrouterKey && openrouterKey.startsWith('sk-or-')) {
        const openrouterModels = ['openrouter/free', 'z-ai/glm-5.2:free'];
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
                messages: [
                  { role: 'system', content: systemMsg },
                  ...history.slice(-6).map((h) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
                  { role: 'user', content: userQuery },
                ],
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
      }
    }

    // 3. Gemini Fallback with official system_instruction parameter
    if (!aiReply) {
      const geminiKey = cleanUserKey.startsWith('AIzaSy') ? cleanUserKey : getGeminiApiKey();
      if (geminiKey) {
        try {
          const payload = {
            system_instruction: {
              parts: [{ text: systemMsg }],
            },
            contents: [
              ...history.slice(-6).map((h) => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }],
              })),
              { role: 'user', parts: [{ text: userQuery }] },
            ],
          };

          const gRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
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
      aiReply = 'Javob berishda texnik xatolik yuz berdi.';
    }

    // Save assistant reply to database
    await prisma.chatMessage.create({
      data: { sessionId, role: 'assistant', content: aiReply },
    });

    return NextResponse.json({ reply: aiReply });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
