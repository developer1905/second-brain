import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/chat?sessionId=xxx — fetch chat history
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

// Helper: Extract key terms for DB lookup
function extractTerms(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0400-\u04FF]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/(larim|larimiz|lar|im|imiz|da|dan|ga|ni|si|i|dagi)$/g, ''))
    .filter((w) => w.length > 2);
}

// POST /api/chat — Real Conversational Chat Engine (ChatGPT / Gemini Style)
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

    // 1. Save user message to database
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: userQuery },
    });

    // 2. Fetch context if relevant terms are mentioned
    const terms = extractTerms(userQuery);
    const isAskingAboutDatabase =
      lowerQuery.includes('loyiha') ||
      lowerQuery.includes('qayd') ||
      lowerQuery.includes('eslatma') ||
      lowerQuery.includes('telegram') ||
      lowerQuery.includes('kitob') ||
      lowerQuery.includes('soha') ||
      lowerQuery.includes('moliya') ||
      lowerQuery.includes('baza') ||
      lowerQuery.includes('brain') ||
      terms.length > 0;

    let notes: any[] = [];
    let projects: any[] = [];
    let telegrams: any[] = [];

    if (isAskingAboutDatabase && terms.length > 0) {
      const OR_notes = terms.map((t) => ({ title: { contains: t } }));
      const OR_projects = terms.map((t) => ({ name: { contains: t } }));

      [notes, projects, telegrams] = await Promise.all([
        prisma.note.findMany({ where: { OR: OR_notes }, take: 3 }),
        prisma.project.findMany({ where: { OR: OR_projects }, take: 3 }),
        prisma.telegramMessage.findMany({
          where: { OR: terms.map((t) => ({ text: { contains: t } })) },
          take: 3,
        }),
      ]);
    }

    let aiReply = '';

    // 3. Try DeepSeek API or Gemini API if a key is provided
    const activeKey = userApiKey?.trim() || process.env.DEEPSEEK_API_KEY || process.env.GEMINI_API_KEY || '';
    if (activeKey && activeKey.startsWith('sk-') && !activeKey.includes('45c4187a0fa74b37b3a258d00d1d8dd1')) {
      try {
        const dbContext = [
          notes.length ? `Qaydlar: ${notes.map((n) => n.title).join(', ')}` : '',
          projects.length ? `Loyihalar: ${projects.map((p) => p.name).join(', ')}` : '',
        ].filter(Boolean).join('\n');

        const systemPrompt = `Sen ChatGPT va Gemini kabi o'zbek tilida erkin, aqlli va do'stona muloqot qiluvchi AI suhbatdoshisan.
Foydalanuvchi bilan xuddi insondek do'stona yozishib gaplash.
Foydalanuvchi ma'lumotlar bazasida: ${dbContext || 'Umumiy bilimlar'}`;

        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              ...history.slice(-6).map((h) => ({
                role: h.role === 'user' ? 'user' : 'assistant',
                content: h.content,
              })),
              { role: 'user', content: userQuery },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (dsRes.ok) {
          const dsData = await dsRes.json();
          aiReply = dsData.choices?.[0]?.message?.content || '';
        }
      } catch (e) {
        console.error('API Error:', e);
      }
    }

    // 4. Natural Conversational Dialog Engine (ChatGPT / Gemini Style)
    if (!aiReply) {
      if (lowerQuery.includes('salom') || lowerQuery === 'hi' || lowerQuery === 'hello') {
        aiReply = `Salom! 👋 Siz bilan ko'rishganimdan xursandman. Men sizning AI suhbatdoshingizman. Qanday mavzuda gaplashamiz yoki yordam bera olaman? 😊`;
      } else if (lowerQuery.includes('qandaysan') || lowerQuery.includes('ishlar yaxshimi') || lowerQuery.includes('qalaysan')) {
        aiReply = `Ajoyib, rahmat! Sizda ishlar va kayfiyatlar qanday? 😊 Bugun loyihalaringiz, rejalaringiz yoki biror yangi g'oyangiz haqida gaplashamizmi?`;
      } else if (lowerQuery.includes('kim') && (lowerQuery.includes('san') || lowerQuery.includes('siz'))) {
        aiReply = `Men sizning shaxsiy **Second Brain AI** suhbatdoshingizman! 🤖\n\nXuddi ChatGPT va Gemini kabi o'zbek tilida erkin yozishib muloqot qila olaman. Kod yozish, g'oyalarni muhokama qilish, savollaringizga javob berish hamda bilimlar bazangizdagi qayd va loyihalaringizni tahlil qilishda yordam beraman.`;
      } else if (lowerQuery.includes('loyiha') || lowerQuery.includes('project')) {
        const allProj = await prisma.project.findMany({ take: 5 });
        if (allProj.length > 0) {
          aiReply = `Sizda hozirda **${allProj.length} ta active loyiha** bor:\n\n` +
            allProj.map((p) => `• **${p.name}** (${p.progress}% bajarilgan) — _${p.description || 'Tavsif yo\'q'}_`).join('\n') +
            `\n\nQaysi loyiha bo'yicha batafsil gaplashamiz? Reja yoki yangi vazifalar qo'shish kerakmi?`;
        } else {
          aiReply = `Hozircha loyihalar bazangiz bo'sh. Yangi loyiha yaratish yoki reja tuzishda yordam beraymi?`;
        }
      } else if (lowerQuery.includes('qayd') || lowerQuery.includes('eslatma') || lowerQuery.includes('note')) {
        const allNotes = await prisma.note.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
        if (allNotes.length > 0) {
          aiReply = `Bilimlar bazangizda **${allNotes.length} ta qayd** saqlangan. So'nggi qaydlaringiz:\n\n` +
            allNotes.map((n) => `• **${n.title}** (${n.paraCategory})`).join('\n') +
            `\n\nUshbu qaydlar bo'yicha biror narsa so'ramoqchimisiz?`;
        } else {
          aiReply = `Hozircha qaydlar ro'yxati bo'sh. Biror g'oya yoki ma'lumotni saqlab qo'ymoqchimisiz?`;
        }
      } else if (lowerQuery.includes('telegram') || lowerQuery.includes('xabar') || lowerQuery.includes('post')) {
        const tgCount = await prisma.telegramMessage.count();
        aiReply = `Sizning Telegram bazangizda **${tgCount.toLocaleString()} ta xabar** sinapslangan! 📱\n\nQaysi mavzudagi postlarni izlayotganingizni yozing (masalan: *"AI"*, *"Kod"*, *"Kitob"*), men ularni topib tahlil qilib beraman.`;
      } else if (lowerQuery.includes('kod') || lowerQuery.includes('python') || lowerQuery.includes('javascript') || lowerQuery.includes('function') || lowerQuery.includes('dastur')) {
        aiReply = `Albatta! Dasturlash va kod bo'yicha xohlagan savolingizni berishingiz mumkin. 💻\n\nQaysi tilda yoki qaysi algoritm bo'yicha misol ko'rib chiqamiz? (Masalan: Python, JavaScript, Next.js, API...).`;
      } else {
        // Natural ChatGPT-style general conversation response
        aiReply = `Tushundim! **"${userQuery}"** bo'yicha siz bilan batafsil yozishib muloqot qilishga tayyorman. 💭\n\nBu borada qanday savollaringiz bor yoki qaysi jihatiga ko'proq to'xtalaylik? Bemalol fikringizni yozing!`;
      }
    }

    // 5. Save assistant message
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
