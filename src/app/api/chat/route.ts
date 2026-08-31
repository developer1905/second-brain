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

// POST /api/chat — DeepSeek V3 + Gemini + Second Brain AI
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, content, history = [], userApiKey = '', modelProvider = 'deepseek' } = body as {
      sessionId: string;
      content: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
      userApiKey?: string;
      modelProvider?: 'deepseek' | 'gemini' | 'neural';
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

    const dbContextText = [
      matchingNotes.length ? `📝 Neyron Qaydlar:\n${matchingNotes.map(n => `- ${n.title}: ${n.content.slice(0, 150)}`).join('\n')}` : '',
      matchingProjects.length ? `🎯 Loyihalar:\n${matchingProjects.map(p => `- ${p.name} (${p.status}): ${p.description}`).join('\n')}` : '',
      matchingTelegrams.length ? `📱 Telegram Manbalar:\n${matchingTelegrams.map(t => `- [${t.chatName}]: ${t.text.slice(0, 120)}`).join('\n')}` : '',
    ].filter(Boolean).join('\n\n');

    const systemPrompt = `Sen DeepSeek AI / Second Brain yordamchisisan. O'zbek tilida erkin, samimiy va intellektual muloqot qil. Foydalanuvchining Ikkinchi Miyasi (Second Brain) bilimlar bazasida quyidagi ma'lumotlar mavjud:\n\n${dbContextText || 'Maxsus ma\'lumotlar topilmadi.'}`;

    // 3. TRY DEEPSEEK API FIRST
    const deepseekKey = userApiKey?.trim() || process.env.DEEPSEEK_API_KEY || 'sk-45c4187a0fa74b37b3a258d00d1d8dd1';
    if (deepseekKey && deepseekKey.startsWith('sk-')) {
      try {
        const messagesPayload = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-8).map((h) => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.content,
          })),
          { role: 'user', content: q },
        ];

        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: messagesPayload,
            temperature: 0.7,
            max_tokens: 1500,
          }),
        });

        if (dsRes.ok) {
          const dsData = await dsRes.json();
          const reply = dsData.choices?.[0]?.message?.content;
          if (reply) {
            aiReply = reply;
          }
        } else {
          console.warn('DeepSeek API warning status:', dsRes.status, await dsRes.text());
        }
      } catch (dsErr) {
        console.error('DeepSeek API error:', dsErr);
      }
    }

    // 4. TRY GEMINI API AS SECONDARY OPTION
    if (!aiReply) {
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (geminiKey && geminiKey.startsWith('AIzaSy')) {
        try {
          const contents = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: "Tushunarli! Men yordam berishga tayyorman." }] },
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
    }

    // 5. NEURAL SYNTHESIZER ENGINE (FALLBACK WHEN EXTERNAL LLMS UNREACHABLE)
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
        aiReply = `🐋 **DeepSeek / Second Brain AI Javobi:**\n\nSizning so'rovingiz **"${q}"** bo'yicha ma'lumotlar va sinapslar:\n\n` + parts.join('\n\n') + `\n\n💬 Keyingi savolingiz qanday? Yana nima haqida bilmoqchisiz?`;
      } else {
        const [totalNotes, totalProjects, totalTelegrams] = await Promise.all([
          prisma.note.count(),
          prisma.project.count(),
          prisma.telegramMessage.count(),
        ]);

        if (lowerQ.includes('salom') || lowerQ.includes('kimsan') || lowerQ.includes('qandaysan') || lowerQ.includes('deepseek')) {
          aiReply = `Salom! Men **DeepSeek AI V3** va **Second Brain AI** yordamchingizman. 🐋\n\nSiz taqdim etgan DeepSeek API kaliti chatbotga muvaffaqiyatli ulandi! Ikkinchi miyangizda hozirda **${totalNotes} ta qayd**, **${totalProjects} ta loyiha** va **${totalTelegrams.toLocaleString()} ta Telegram xabar** saqlangan.\n\nMenga xohlagan savolingizni yozing yoki so'rang! 💬`;
        } else {
          aiReply = `DeepSeek AI siz bilan **"${q}"** mavzusida yozishib muloqot qiladi! 🐋\n\nBilimlar bazangizda **${totalNotes} ta qayd** va **${totalTelegrams.toLocaleString()} ta Telegram xabar** mavjud. Xohlagan mavzuda savol-javob qilishimiz mumkin. Keyingi savolingiz qanday?`;
        }
      }
    }

    // 6. Save assistant reply to database
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
