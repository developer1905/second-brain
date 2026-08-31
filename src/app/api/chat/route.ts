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

// POST /api/chat — Intelligent Neural Brain Chatbot Response
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, content } = body as { sessionId: string; content: string };

    if (!sessionId || !content?.trim()) {
      return NextResponse.json({ error: 'sessionId and content required' }, { status: 400 });
    }

    const q = content.trim();

    // 1. Save user message
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: q },
    });

    // 2. Fetch context across all models
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
        take: 5,
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
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    let aiReply = '';

    // 3. Try Gemini API if a valid key is provided
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (geminiKey && geminiKey.startsWith('AIzaSy')) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Sen Second Brain AI botisan. O'zbek tilida javob ber. Savol: ${q}` }] }],
            }),
          }
        );
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          aiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch (e) {
        console.error('Gemini API call failed:', e);
      }
    }

    // 4. Neural Synthesizer Engine (fallback when API key is unavailable or fails)
    if (!aiReply) {
      const parts: string[] = [];

      if (matchingNotes.length > 0) {
        parts.push(`📝 **Neyron Qaydlar (${matchingNotes.length} ta):**\n` + matchingNotes.map(n => `• **${n.title}**\n  _${n.content.slice(0, 100).replace(/\n/g, ' ')}..._`).join('\n'));
      }
      if (matchingProjects.length > 0) {
        parts.push(`🎯 **Loyihalar (${matchingProjects.length} ta):**\n` + matchingProjects.map(p => `• **${p.name}** (Progress: ${p.progress}%): ${p.description}`).join('\n'));
      }
      if (matchingAreas.length > 0) {
        parts.push(`🌍 **Sohalar (${matchingAreas.length} ta):**\n` + matchingAreas.map(a => `• **${a.name}**: ${a.description}`).join('\n'));
      }
      if (matchingBooks.length > 0) {
        parts.push(`📚 **Kitoblar (${matchingBooks.length} ta):**\n` + matchingBooks.map(b => `• **${b.title}** (${b.author}): ${b.summary}`).join('\n'));
      }
      if (matchingTelegrams.length > 0) {
        parts.push(`📱 **Telegram Manbalar (${matchingTelegrams.length} ta):**\n` + matchingTelegrams.map(t => `• [${t.chatName}]: _"${t.text.slice(0, 100)}..."_`).join('\n'));
      }

      if (parts.length > 0) {
        aiReply = `🤖 **Second Brain AI Analiz va Javob:**\n\nSizning ikkinchi miyangizdan **"${q}"** bo'yicha quyidagi bog'liq ma'lumotlar va sinapslar topildi:\n\n` + parts.join('\n\n') + `\n\n💡 **Neyron Xulosa:** Ushbu manbalar bilimlaringiz bazasidan avtomatik bog'landi va xulosalandi.`;
      } else {
        // Fetch general stats for general greeting / broad questions
        const [totalNotes, totalProjects, totalTelegrams] = await Promise.all([
          prisma.note.count(),
          prisma.project.count(),
          prisma.telegramMessage.count(),
        ]);

        if (lowerQ.includes('salom') || lowerQ.includes('kim') || lowerQ.includes('nima')) {
          aiReply = `Salom! 👋 Men **Second Brain AI** — sizning shaxsiy neyron bilimlar bazangiz yordamchisiman.\n\nHozirda ikkinchi miyangizda:\n• 📝 **${totalNotes} ta** qayd va eslatma\n• 🎯 **${totalProjects} ta** loyiha\n• 📱 **${totalTelegrams.toLocaleString()} ta** Telegram manbalar saqlangan.\n\nMenga xohlagan savolingizni bering (masalan: *"Loyihalarim"*, *"Kitoblar"*, *"Telegram xabarlar"*)!`;
        } else {
          aiReply = `🤖 **Second Brain AI Yordamchisi:**\n\nSizning **"${q}"** so'rovingiz bo mezon topilmadi. Biroq bilimlar bazangizda **${totalNotes} ta** qayd, **${totalProjects} ta** loyiha va **${totalTelegrams.toLocaleString()} ta** Telegram xabar mavjud.\n\n💡 **Tavsiya:** Qidiruv so'zingizni aniqroq kiritib ko'ring (masalan: *"Loyiha"*, *"Telegram"*, *"Resurs"*, *"Plan"*)!`;
        }
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

// DELETE /api/chat?sessionId=xxx — delete entire session
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  await prisma.chatMessage.deleteMany({ where: { sessionId } });
  return NextResponse.json({ ok: true });
}
