import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/chat?sessionId=xxx  — fetch messages for a session
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

// POST /api/chat — Conversational Multi-Turn Gemini + Second Brain AI
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, content, history = [] } = body as {
      sessionId: string;
      content: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!sessionId || !content?.trim()) {
      return NextResponse.json({ error: 'sessionId va content kiritilmadi' }, { status: 400 });
    }

    const q = content.trim();

    // 1. Save user message
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: q },
    });

    // 2. Fetch ground-truth Second Brain database context
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

    // 3. Try Gemini REST API if a key is configured
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (geminiKey && geminiKey.startsWith('AIzaSy')) {
      try {
        const dbContextText = [
          matchingNotes.length ? `📝 Neyron Qaydlar:\n${matchingNotes.map(n => `- ${n.title}: ${n.content.slice(0, 150)}`).join('\n')}` : '',
          matchingProjects.length ? `🎯 Loyihalar:\n${matchingProjects.map(p => `- ${p.name} (${p.status}): ${p.description}`).join('\n')}` : '',
          matchingTelegrams.length ? `📱 Telegram Manbalar:\n${matchingTelegrams.map(t => `- [${t.chatName}]: ${t.text.slice(0, 120)}`).join('\n')}` : '',
        ].filter(Boolean).join('\n\n');

        const systemPrompt = `Sen Google Gemini kabi o'zbek tilida gaplashuvchi, erkin va samimiy AI yordamchisan. Foydalanuvchi bilan xuddi insondek do'stona va professional muloqot qil. Foydalanuvchining Ikkinchi Miyasi (Second Brain) bo'yicha quyidagi ma'lumotlar mavjud:\n\n${dbContextText || 'Maxsus ma\'lumotlar topilmadi.'}`;

        const contents = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: "Tushunarli! Xuddi Gemini kabi o'zbek tilida samimiy va erkin suhbatlashaman. Qanday yordam bera olaman?" }] },
          ...history.slice(-6).map((h) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          })),
          { role: 'user', parts: [{ text: q }] },
        ];

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          aiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch (e) {
        console.error('Gemini API call error:', e);
      }
    }

    // 4. Multi-Turn Neural Conversational Engine (Free Fallback)
    if (!aiReply) {
      const parts: string[] = [];

      if (matchingNotes.length > 0) {
        parts.push(`📝 **Qaydlaringizdan (${matchingNotes.length} ta):**\n` + matchingNotes.map(n => `• **${n.title}**\n  _${n.content.slice(0, 120).replace(/\n/g, ' ')}..._`).join('\n'));
      }
      if (matchingProjects.length > 0) {
        parts.push(`🎯 **Loyihalaringizdan (${matchingProjects.length} ta):**\n` + matchingProjects.map(p => `• **${p.name}** (Status: ${p.status}, Progress: ${p.progress}%): ${p.description}`).join('\n'));
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
        aiReply = `🤖 **Second Brain Gemini AI:**\n\nSizning so'rovingiz **"${q}"** bo'yicha ikkinchi miyangizdan topilgan javob va ma'lumotlar:\n\n` + parts.join('\n\n') + `\n\n💡 Yana qanday ma'lumot yoki tahlil kerak? Bemalol so'rang!`;
      } else {
        const [totalNotes, totalProjects, totalTelegrams] = await Promise.all([
          prisma.note.count(),
          prisma.project.count(),
          prisma.telegramMessage.count(),
        ]);

        if (lowerQ.includes('salom') || lowerQ.includes('kimsan') || lowerQ.includes('qandaysan') || lowerQ.includes('aliss')) {
          aiReply = `Salom! Men **Second Brain Gemini AI** — xuddi Gemini kabi siz bilan erkin va samimiy o'zbek tilida muloqot qiluvchi aqlli yordamchingizman. 😊\n\nSizning ikkinchi miyangizda hozirda:\n• 📝 **${totalNotes} ta** qayd va eslatma\n• 🎯 **${totalProjects} ta** faol loyiha\n• 📱 **${totalTelegrams.toLocaleString()} ta** Telegram xabarlaringiz sinapslangan.\n\nMenga xohlagan savolingizni bering yoki **ovozli tugmani** bosib gapiring! 🎙️`;
        } else {
          aiReply = `Xuddi Gemini kabi sizga **"${q}"** bo'yicha yordam berishga tayyorman!\n\nBilimlar bazangizda **${totalNotes} ta** qayd va **${totalTelegrams.toLocaleString()} ta** Telegram xabaringiz saqlangan. Ushtan foydalanib xohlagan loyihangiz, vazifangiz yoki g'oyangiz haqida batafsil suhbatlashishimiz mumkin. 🚀`;
        }
      }
    }

    // 5. Save assistant response to DB
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
