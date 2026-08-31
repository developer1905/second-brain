import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Savol matni kiritilmadi" }, { status: 400 });
    }

    const q = prompt.toLowerCase().trim();

    // 1. Search database context across Notes, Books, Projects, and Telegram Messages
    const [notes, books, projects, telegrams] = await Promise.all([
      prisma.note.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
            { tags: { contains: q } },
          ],
        },
        take: 5,
      }),
      prisma.book.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { summary: { contains: q } },
          ],
        },
        take: 5,
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
          ],
        },
        take: 5,
      }),
      prisma.telegramMessage.findMany({
        where: {
          text: { contains: q },
        },
        take: 8,
      }),
    ]);

    // 2. Synthesize AI Response
    let contextSummary = [];
    if (notes.length > 0) {
      contextSummary.push(`🧠 **Neyron Qaydlar (${notes.length} ta):**\n` + notes.map(n => `- **${n.title}**: ${n.content.slice(0, 100)}...`).join('\n'));
    }
    if (projects.length > 0) {
      contextSummary.push(`🎯 **Loyihalar (${projects.length} ta):**\n` + projects.map(p => `- **${p.name}** (Progress: ${p.progress}%): ${p.description}`).join('\n'));
    }
    if (books.length > 0) {
      contextSummary.push(`📚 **Kitoblar (${books.length} ta):**\n` + books.map(b => `- **${b.title}** (${b.author}): ${b.summary}`).join('\n'));
    }
    if (telegrams.length > 0) {
      contextSummary.push(`📱 **Telegram Manbalar (${telegrams.length} ta):**\n` + telegrams.map(t => `- [${t.chatName}]: ${t.text.slice(0, 120)}...`).join('\n'));
    }

    let answer = '';
    if (contextSummary.length === 0) {
      answer = `Miyangizdan "${prompt}" so'rovi bo'yicha to'g'ridan-to'g mezon topilmadi. Biroq neyron tarmoq ma'lumotlar bazasida 70,000+ Telegram manbalari va P.A.R.A qaydlaringiz mavjud. Qidiruv kalit so'zini o'zgartirib ko'ring (masalan: "AI", "Kitob", "Loyiha", "Grok").`;
    } else {
      answer = `### 🤖 Neyron Brain AI Analizi:\n\n` +
        `Sizning ikkinchi miyangizdan **"${prompt}"** so'rovi bo'yicha quyidagi bog'liq ma'lumotlar va sinapslar topildi:\n\n` +
        contextSummary.join('\n\n') +
        `\n\n💡 **Xulosa & Neyron Tavsiya:** Ushbu manbalar asosida loyihalar va qaydlar o'rtasida sinaptik ulanish hosil qilindi.`;
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
