import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function extractTerms(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0400-\u04FF]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/(larim|larimiz|lar|im|imiz|da|dan|ga|ni|si|i|dagi)$/g, ''))
    .filter((w) => w.length > 2);
}

export async function POST(request: Request) {
  try {
    const { prompt, userApiKey = '' } = await request.json();
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Savol matni kiritilmadi" }, { status: 400 });
    }

    const userQuery = prompt.trim();
    const lowerQuery = userQuery.toLowerCase();
    const terms = extractTerms(userQuery);

    // 1. Search database context across Notes, Books, Projects, and Telegram
    let notes: any[] = [];
    let projects: any[] = [];
    let books: any[] = [];
    let telegrams: any[] = [];

    if (terms.length > 0) {
      [notes, books, projects, telegrams] = await Promise.all([
        prisma.note.findMany({
          where: { OR: terms.map((t) => ({ title: { contains: t } })) },
          take: 5,
        }),
        prisma.book.findMany({
          where: { OR: terms.map((t) => ({ title: { contains: t } })) },
          take: 5,
        }),
        prisma.project.findMany({
          where: { OR: terms.map((t) => ({ name: { contains: t } })) },
          take: 5,
        }),
        prisma.telegramMessage.findMany({
          where: { OR: terms.map((t) => ({ text: { contains: t } })) },
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
      ]);
    }

    let answer = '';

    // 2. Try DeepSeek / Gemini API if user has active API key
    const activeKey = userApiKey?.trim() || process.env.DEEPSEEK_API_KEY || '';
    if (activeKey && activeKey.startsWith('sk-') && !activeKey.includes('45c4187a0fa74b37b3a258d00d1d8dd1')) {
      try {
        const systemPrompt = `Siz ChatGPT va Gemini kabi o'zbek tilida erkin va intellektual muloqot qiluvchi AI Copilotsiz. Foydalanuvchining savoliga haqiqiy inson kabi samimiy va javob bering.`;

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
              { role: 'user', content: userQuery },
            ],
            temperature: 0.7,
            max_tokens: 1200,
          }),
        });

        if (dsRes.ok) {
          const dsData = await dsRes.json();
          const reply = dsData.choices?.[0]?.message?.content;
          if (reply) answer = reply;
        }
      } catch (e) {
        console.error('DeepSeek API error:', e);
      }
    }

    // 3. Conversational Response Synthesizer Engine (Natural ChatGPT / Gemini Dialog)
    if (!answer) {
      if (lowerQuery.includes('salom') || lowerQuery === 'hi' || lowerQuery === 'hello') {
        answer = `Salom! 👋 Siz bilan yozishib muloqot qilishdan xursandman. Men sizning AI Brain Copilot yordamchingizman. Qanday mavzuda gaplashamiz yoki yordam beray? 😊`;
      } else if (lowerQuery.includes('qandaysan') || lowerQuery.includes('qalaysan') || lowerQuery.includes('ishlar')) {
        answer = `Ajoyib, rahmat! Sizda kayfiyatlar va loyihalar qanday ketmoqda? 🚀 Bugun nima ustida ishlayapsiz?`;
      } else if (lowerQuery.includes('loyiha') || lowerQuery.includes('project')) {
        const projList = await prisma.project.findMany({ take: 5 });
        answer = `Sizda hozirda **${projList.length} ta active loyiha** mavjud:\n\n` +
          projList.map(p => `• **${p.name}** (${p.progress}% bajarilgan) — _${p.description || 'Status: ' + p.status}_`).join('\n') +
          `\n\nQaysi loyiha bo'yicha rejalashtirish yoki maslahat kerak?`;
      } else if (lowerQuery.includes('qayd') || lowerQuery.includes('eslatma')) {
        const noteList = await prisma.note.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
        answer = `Ikkinchi miyangizda saqlangan so'nggi qaydlar:\n\n` +
          noteList.map(n => `• **${n.title}** (${n.paraCategory})`).join('\n') +
          `\n\nUshbu qaydlaringiz bo'yicha biror fikr yoki savolingiz bormi?`;
      } else if (notes.length > 0 || projects.length > 0 || telegrams.length > 0) {
        const parts: string[] = [];
        if (notes.length > 0) parts.push(`📝 **Qaydlaringizdan:**\n` + notes.map(n => `• **${n.title}**: ${n.content.slice(0, 100)}...`).join('\n'));
        if (projects.length > 0) parts.push(`🎯 **Loyihalaringizdan:**\n` + projects.map(p => `• **${p.name}**: ${p.description}`).join('\n'));
        if (telegrams.length > 0) parts.push(`📱 **Telegram Manbalaringizdan:**\n` + telegrams.map(t => `• [${t.chatName}]: ${t.text.slice(0, 100)}...`).join('\n'));

        answer = `Sizning **"${userQuery}"** so'rovingiz bo'yicha bilimlar bazangizdan topilgan ma'lumotlar:\n\n` + parts.join('\n\n') + `\n\n💡 Bu haqda yana qanday fikr bildirishimni yoki yozishib davom etishimizni xohlaysiz?`;
      } else {
        answer = `Tushundim! **"${userQuery}"** mavzusi bo'yicha siz bilan xuddi ChatGPT kabi erkin yozishib muloqot qilishga tayyorman. 💭\n\nBu borada fikringiz qanday yoki qaysi savolingizga batafsil to'xtalaylik?`;
      }
    }

    return NextResponse.json({
      success: true,
      answer,
      foundNotesCount: notes.length,
      foundProjectsCount: projects.length,
      foundBooksCount: books.length,
      foundTelegramsCount: telegrams.length,
      sources: {
        notes,
        projects,
        books,
        telegrams,
      },
    });
  } catch (error: any) {
    console.error('Copilot API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
