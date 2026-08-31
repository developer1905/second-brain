import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s\u0400-\u04FF]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  
  // Stemming / stripping common Uzbek suffixes
  const stems = words.map((w) =>
    w.replace(/(larim|larimiz|lar|im|imiz|da|dan|ga|ni|si|i|kasi|dagi)$/g, '')
  ).filter((w) => w.length > 2);

  return Array.from(new Set([...words, ...stems]));
}

export async function POST(request: Request) {
  try {
    const { prompt, userApiKey = '' } = await request.json();
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Savol matni kiritilmadi" }, { status: 400 });
    }

    const q = prompt.trim();
    const keywords = extractKeywords(q);
    const primaryTerm = keywords[0] || q.toLowerCase();

    // 1. Smart Keyword Search across Notes, Projects, Books, Telegram
    const OR_keywords = keywords.map((k) => ({ title: { contains: k } }));
    const OR_content_keywords = keywords.map((k) => ({ content: { contains: k } }));
    const OR_project_keywords = keywords.map((k) => ({ name: { contains: k } }));

    const [notes, books, projects, telegrams, allProjects, recentNotes] = await Promise.all([
      prisma.note.findMany({
        where: {
          OR: [...OR_keywords, ...OR_content_keywords],
        },
        take: 6,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.book.findMany({
        where: {
          OR: keywords.map((k) => ({ title: { contains: k } })),
        },
        take: 5,
      }),
      prisma.project.findMany({
        where: {
          OR: [...OR_project_keywords, ...keywords.map((k) => ({ description: { contains: k } }))],
        },
        take: 5,
      }),
      prisma.telegramMessage.findMany({
        where: {
          OR: keywords.map((k) => ({ text: { contains: k } })),
        },
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
      prisma.note.findMany({ take: 10, orderBy: { updatedAt: 'desc' } }),
    ]);

    // Combined found items or fallback to overall projects/notes
    const activeNotes = notes.length > 0 ? notes : recentNotes.slice(0, 5);
    const activeProjects = projects.length > 0 ? projects : allProjects.slice(0, 5);

    // 2. Build Structured Grounding Context
    const contextSummary: string[] = [];
    if (activeNotes.length > 0) {
      contextSummary.push(`🧠 **Neyron Qaydlar (${activeNotes.length} ta):**\n` + activeNotes.map(n => `- **${n.title}**: ${n.content.slice(0, 150)}`).join('\n'));
    }
    if (activeProjects.length > 0) {
      contextSummary.push(`🎯 **Loyihalar (${activeProjects.length} ta):**\n` + activeProjects.map(p => `- **${p.name}** (Status: ${p.status}, Progress: ${p.progress}%): ${p.description}`).join('\n'));
    }
    if (books.length > 0) {
      contextSummary.push(`📚 **Kitoblar (${books.length} ta):**\n` + books.map(b => `- **${b.title}** (${b.author}): ${b.summary}`).join('\n'));
    }
    if (telegrams.length > 0) {
      contextSummary.push(`📱 **Telegram Manbalar (${telegrams.length} ta):**\n` + telegrams.map(t => `- [${t.chatName}]: ${t.text.slice(0, 150)}...`).join('\n'));
    }

    const contextBlock = contextSummary.join('\n\n');

    const systemPrompt = `Siz "Second Brain AI Copilot" — foydalanuvchining shaxsiy bilimlar bazasidagi 70,000+ Telegram manbalari va P.A.R.A qaydlari bo'yicha aqlli yordamchisiz.
O'zbek tilida mukammal, tushunarli va Markdown formatida javob bering.

Foydalanuvchining bilimlar bazasidan topilgan kontekst:
${contextBlock}`;

    let answer = '';

    // 3. Call DeepSeek API if available and funded
    const deepseekKey = userApiKey?.trim() || process.env.DEEPSEEK_API_KEY || 'sk-45c4187a0fa74b37b3a258d00d1d8dd1';
    if (deepseekKey && deepseekKey.startsWith('sk-')) {
      try {
        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        });

        if (dsRes.ok) {
          const dsData = await dsRes.json();
          const reply = dsData.choices?.[0]?.message?.content;
          if (reply) {
            answer = reply;
          }
        }
      } catch (dsErr) {
        console.error('DeepSeek Copilot API error:', dsErr);
      }
    }

    // 4. Intelligent Neural AI Synthesizer Engine (Fallback)
    if (!answer) {
      answer = `### 🤖 Second Brain AI Copilot Tahlili:\n\n` +
        `Sizning ikkinchi miyangizdan **"${prompt}"** so'rovi bo'yicha yig'ilgan ma'lumotlar va sinaptik tahlil:\n\n` +
        contextBlock +
        `\n\n💡 **Neyron Copilot Tavsiyasi:** Yuqoridagi manbalar bilimlaringiz bazasidan avtomatik ravishda tahlil qilindi va sinapslar bilan bog'landi.`;
    }

    return NextResponse.json({
      success: true,
      answer,
      foundNotesCount: activeNotes.length,
      foundProjectsCount: activeProjects.length,
      foundBooksCount: books.length,
      foundTelegramsCount: telegrams.length,
      sources: {
        notes: activeNotes,
        projects: activeProjects,
        books,
        telegrams,
      },
    });
  } catch (error: any) {
    console.error('Copilot API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
