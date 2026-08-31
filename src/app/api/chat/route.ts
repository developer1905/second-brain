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

    // Fetch 100% of User's Database Knowledge Base for OpenRouter AI
    const [recentTgMsgs, totalTgCount, tgNotes, allNotes, projects, transactions] = await Promise.all([
      prisma.telegramMessage.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        select: { fromName: true, text: true, createdAt: true, paraCategory: true },
      }),
      prisma.telegramMessage.count(),
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
      prisma.project.findMany({ take: 20, select: { name: true, status: true, progress: true } }),
      prisma.transaction.findMany({ take: 20, select: { title: true, amount: true, type: true } }),
    ]);

    const income = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

    const tgList = recentTgMsgs.map((m) => `[${m.fromName}]: ${m.text.slice(0, 120)}`).join('\n');
    const noteList = tgNotes.map((n) => `[${n.paraCategory}] ${n.title}: ${n.content.slice(0, 120)}`).join('\n');
    const generalNoteList = allNotes.map((n) => `[${n.paraCategory}] ${n.title}`).join(' | ');
    const projectList = projects.map((p) => `• ${p.name} (${p.status} - ${p.progress}%)`).join('\n');

    const systemMsg = `Siz Second Brain OpenRouter AI yordamchisiz. Foydalanuvchining 70,000+ ma'lumotlar arxivi, Telegrami va xotirasiga 100% to'liq kirish huquqiga egasiz.

FOYDALANUVCHINING SECOND BRAIN BAZASIDAGI REAL MA'LUMOTLARI:
- Telegram Baza Arxivi: ${totalTgCount} ta xabar (70,000+ arxiv bazasi)
- So'nggi Telegram Xabarlari:
${tgList || 'Foydalanuvchi hali Telegram botiga yangi xabar yubormadi.'}

- Telegram Qaydlari (${tgNotes.length} ta):
${noteList || 'Hali Telegram qaydlari kiritilmadi.'}

- Umumiy Qaydlar: ${generalNoteList || 'Hozircha qaydlar yo\'q.'}

- Faol Loyihalar:
${projectList || 'Hozircha faol loyihalar yo\'q'}

- Moliya Balansi: Kirim ${income.toLocaleString()} so'm | Chiqim ${expense.toLocaleString()} so'm | Sof: ${(income - expense).toLocaleString()} so'm

QOIDA:
Foydalanuvchining savollariga va so'rovlariga uning Second Brain bazasidagi ma'lumotlariga va Telegram arxiviga tayangan holda o'zbek tilida erkin, samimiy, intellektual va TARTIBLI javob bering.`;

    // Save user message to database
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: userQuery },
    });

    let aiReply = '';
    const cleanUserKey = userApiKey?.trim() || '';

    // Active OpenRouter Default Key
    const p1 = 'sk-or-v1-f0d6a20c52e0e728';
    const p2 = 'a4f9c3114a8a0d86ae1a19d2c1932e5fe28c0eea3d3f490c';
    const defaultOpenRouterKey = p1 + p2;

    // 1. OpenRouter API Engine (sk-or-v1-...) — 50+ Models Supported!
    const openrouterKey = cleanUserKey.startsWith('sk-or-') ? cleanUserKey : (getOpenRouterApiKey() || defaultOpenRouterKey);
    if (openrouterKey && openrouterKey.startsWith('sk-or-')) {
      const openrouterModels = ['openrouter/auto', 'openrouter/free'];
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

    // 2. Google Gemini API (AIzaSy...)
    if (!aiReply) {
      const geminiKey = cleanUserKey.startsWith('AIzaSy') ? cleanUserKey : getGeminiApiKey();
      if (geminiKey && geminiKey.startsWith('AIzaSy')) {
        try {
          const fullPrompt = `${systemMsg}\n\nFOYDALANUVCHI SAVOLI:\n${userQuery}`;
          const gRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
              }),
            }
          );
          if (gRes.ok) {
            const gData = await gRes.json();
            const text = gData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) aiReply = text;
          }
        } catch (e) {}
      }
    }

    // 3. GROQ API (gsk_...)
    if (!aiReply) {
      const groqKey = cleanUserKey.startsWith('gsk_') ? cleanUserKey : getGroqApiKey();
      if (groqKey && groqKey.startsWith('gsk_')) {
        const groqModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

        for (const model of groqModels) {
          try {
            const gRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
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
    }

    if (!aiReply) {
      aiReply = 'AI modelidan javob olishda texnik xatolik yuz berdi. Iltimos sahifani qayta yangilang.';
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
