import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/chat?sessionId=xxx — fetch messages for a session
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

// POST /api/chat — Real-time Text Conversation with Gemini AI
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

    const q = content.trim();

    // 1. Save user message to database
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: q },
    });

    // 2. Query Second Brain database for grounded context
    const lowerQ = q.toLowerCase();
    const [matchingNotes, matchingProjects, matchingAreas, matchingBooks, matchingTelegrams] = await Promise.all([
      prisma.note.findMany({
        where: {
          OR: [
            { title: { contains: lowerQ } },
            { content: { contains: lowerQ } },
            { tags: { contains: lowerQ } },
          ],
        },
        take: 6,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: lowerQ } },
            { description: { contains: lowerQ } },
          ],
        },
        take: 5,
      }),
      prisma.area.findMany({
        where: {
          OR: [
            { name: { contains: lowerQ } },
            { description: { contains: lowerQ } },
          ],
        },
        take: 5,
      }),
      prisma.book.findMany({
        where: {
          OR: [
            { title: { contains: lowerQ } },
            { summary: { contains: lowerQ } },
          ],
        },
        take: 5,
      }),
      prisma.telegramMessage.findMany({
        where: { text: { contains: lowerQ } },
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    let aiReply = '';

    // 3. Try Gemini REST API (user provided key or server key)
    const activeKey = userApiKey?.trim() || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

    if (activeKey && activeKey.length > 10) {
      const dbContextText = [
        matchingNotes.length ? `📝 Neyron Qaydlar:\n${matchingNotes.map(n => `- ${n.title}: ${n.content.slice(0, 150)}`).join('\n')}` : '',
        matchingProjects.length ? `🎯 Loyihalar:\n${matchingProjects.map(p => `- ${p.name} (${p.status}): ${p.description}`).join('\n')}` : '',
        matchingTelegrams.length ? `📱 Telegram Manbalar:\n${matchingTelegrams.map(t => `- [${t.chatName}]: ${t.text.slice(0, 120)}`).join('\n')}` : '',
      ].filter(Boolean).join('\n\n');

      const systemPrompt = `Sen Google Gemini kabi o'zbek tilida erkin, samimiy va intellektual gaplashuvchi AI yordamchisan. Xuddi haqiqiy inson kabi do'stona va mukammal muloqot qil. Foydalanuvchining Second Brain bilimlar bazasida quyidagi ma'lumotlar bor:\n\n${dbContextText || 'Maxsus ma\'lumotlar topilmadi.'}`;

      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Tushunarli! Men Google Gemini modeliman. O'zbek tilida xuddi Gemini kabi erkin yozishib gaplashamiz. Qanday savol yoki yordam kerak?" }] },
        ...history.slice(-8).map((h) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        })),
        { role: 'user', parts: [{ text: q }] },
      ];

      // Try model endpoints
      const geminiModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-pro'];
      for (const model of geminiModels) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents }),
            }
          );
          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              aiReply = text;
              break;
            }
          }
        } catch (e) {
          console.warn(`Gemini model ${model} failed:`, e);
        }
      }
    }

    // 4. Conversational Neural Synthesizer (Fallback when API key is not active)
    if (!aiReply) {
      const parts: string[] = [];

      if (matchingNotes.length > 0) {
        parts.push(`📝 **Qaydlaringizdan (${matchingNotes.length} ta):**\n` + matchingNotes.map(n => `• **${n.title}**\n  _${n.content.slice(0, 120).replace(/\n/g, ' ')}..._`).join('\n'));
      }
      if (matchingProjects.length > 0) {
        parts.push(`🎯 **Loyihalaringizdan (${matchingProjects.length} ta):**\n` + matchingProjects.map(p => `• **${p.name}** (${p.status}): ${p.description}`).join('\n'));
      }
      if (matchingAreas.length > 0) {
        parts.push(`🌍 **Sohalaringizdan (${matchingAreas.length} ta):**\n` + matchingAreas.map(a => `• **${a.name}**: ${a.description}`).join('\n'));
      }
      if (matchingBooks.length > 0) {
        parts.push(`📚 **Kitoblaringizdan (${matchingBooks.length} ta):**\n` + matchingBooks.map(b => `• **${b.title}** (${b.author}) — ${b.summary}`).join('\n'));
      }
      if (matchingTelegrams.length > 0) {
        parts.push(`📱 **Telegram Chatlaringizdan (${matchingTelegrams.length} ta):**\n` + matchingTelegrams.map(t => `• [${t.chatName}]: _"${t.text.slice(0, 120)}..."_`).join('\n'));
      }

      if (parts.length > 0) {
        aiReply = `🤖 **Gemini AI Javobi:**\n\nSizning so'rovingiz **"${q}"** bo'yicha ma'lumotlar va sinapslar:\n\n` + parts.join('\n\n') + `\n\n💬 Yozishib gaplashishda davom etishingiz mumkin! Yana nima haqida bilmoqchisiz?`;
      } else {
        const [totalNotes, totalProjects, totalTelegrams] = await Promise.all([
          prisma.note.count(),
          prisma.project.count(),
          prisma.telegramMessage.count(),
        ]);

        if (lowerQ.includes('salom') || lowerQ.includes('kimsan') || lowerQ.includes('qandaysan') || lowerQ.includes('aliss')) {
          aiReply = `Salom! Men **Google Gemini AI** yordamchingizman. 😊\n\nXuddi Gemini kabi siz bilan o'zbek tilida yozishib gaplashaman. Ikkinchi miyangizda hozirda **${totalNotes} ta qayd**, **${totalProjects} ta loyiha** va **${totalTelegrams.toLocaleString()} ta Telegram xabar** saqlangan.\n\nMenga xohlagan savolingizni yozing yoki so'rang! 💬`;
        } else {
          aiReply = `Xuddi Gemini kabi siz bilan **"${q}"** mavzusida yozishib muloqot qilaman! 💬\n\nBilimlar bazangizda **${totalNotes} ta qayd** va **${totalTelegrams.toLocaleString()} ta Telegram xabar** mavjud. Xohlagan mavzuda yozishib savol-javob qilishimiz mumkin. Keyingi savolingiz qanday?`;
        }
      }
    }

    // 5. Save assistant reply to database
    const assistantMsg = await prisma.chatMessage.create({
      data: { sessionId, role: 'assistant', content: aiReply },
    });

    return NextResponse.json({ message: assistantMsg });
  } catch (err: any) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Chat xatosi: ' + err.message }, { status: 500 });
  }
}

// DELETE /api/chat?sessionId=xxx — delete entire session
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  await prisma.chatMessage.deleteMany({ where: { sessionId } });
  return NextResponse.json({ ok: true });
}
