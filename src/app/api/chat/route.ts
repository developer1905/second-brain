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
    const lowerQuery = userQuery.toLowerCase();

    // Check if Telegram context or personal analysis is requested
    const needsTelegramContext =
      lowerQuery.includes('telegram') ||
      lowerQuery.includes('tahlil') ||
      lowerQuery.includes('analiz') ||
      lowerQuery.includes('shaxsim') ||
      lowerQuery.includes('qayd') ||
      lowerQuery.includes('baza') ||
      lowerQuery.includes('eslatma') ||
      lowerQuery.includes('hisobot') ||
      lowerQuery.includes('nima yozganman');

    let telegramContext = '';
    if (needsTelegramContext) {
      const [recentTgMsgs, tgNotes] = await Promise.all([
        prisma.telegramMessage.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          select: { fromName: true, text: true, createdAt: true, paraCategory: true },
        }),
        prisma.note.findMany({
          where: { sourceType: 'TELEGRAM' },
          take: 30,
          orderBy: { createdAt: 'desc' },
          select: { title: true, content: true, paraCategory: true },
        }),
      ]);

      const tgList = recentTgMsgs.map((m) => `[${m.fromName}]: ${m.text.slice(0, 100)}`).join('\n');
      const noteList = tgNotes.map((n) => `[${n.paraCategory}] ${n.title}: ${n.content.slice(0, 100)}`).join('\n');

      if (tgList || noteList) {
        telegramContext = `
=== FOYDALANUVCHINING TELEGRAM VA SECOND BRAIN MA'LUMOTLARI ===
${tgList ? `--- So'nggi Telegram Xabarlari (${recentTgMsgs.length} ta) ---\n${tgList}` : ''}
${noteList ? `--- Telegram Qaydlari (${tgNotes.length} ta) ---\n${noteList}` : ''}
`;
      }
    }

    // Save user message to database
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: userQuery },
    });

    let systemMsg = "Siz Second Brain AI yordamchisiz. O'zbek tilida erkin, samimiy, intellektual va aniq javob bering.";
    if (needsTelegramContext && telegramContext) {
      systemMsg = `Siz Second Brain AI yordamchisiz. Foydalanuvchining Telegram va bazaviy ma'lumotlari quyida keltirilgan. Savolga ushbu real ma'lumotlar asosida aniq va tartibli javob bering:\n\n${telegramContext}`;
    }

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

    // 3. Gemini Fallback
    if (!aiReply) {
      const geminiKey = cleanUserKey.startsWith('AIzaSy') ? cleanUserKey : getGeminiApiKey();
      if (geminiKey) {
        try {
          const contents = [
            { role: 'user', parts: [{ text: systemMsg }] },
            ...history.slice(-6).map((h) => ({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.content }],
            })),
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
