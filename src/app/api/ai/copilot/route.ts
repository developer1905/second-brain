import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { prompt, userApiKey = '' } = await request.json();
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
        take: 6,
        orderBy: { updatedAt: 'desc' },
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
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // 2. Synthesize Context Text for DeepSeek
    const contextSummary: string[] = [];
    if (notes.length > 0) {
      contextSummary.push(`🧠 **Neyron Qaydlar (${notes.length} ta):**\n` + notes.map(n => `- **${n.title}**: ${n.content.slice(0, 150)}`).join('\n'));
    }
    if (projects.length > 0) {
      contextSummary.push(`🎯 **Loyihalar (${projects.length} ta):**\n` + projects.map(p => `- **${p.name}** (${p.status}, progress: ${p.progress}%): ${p.description}`).join('\n'));
    }
    if (books.length > 0) {
      contextSummary.push(`📚 **Kitoblar (${books.length} ta):**\n` + books.map(b => `- **${b.title}** (${b.author}): ${b.summary}`).join('\n'));
    }
    if (telegrams.length > 0) {
      contextSummary.push(`📱 **Telegram Manbalar (${telegrams.length} ta):**\n` + telegrams.map(t => `- [${t.chatName}]: ${t.text.slice(0, 150)}...`).join('\n'));
    }

    const contextBlock = contextSummary.length > 0
      ? contextSummary.join('\n\n')
      : `Ushbu kalit so'rovi bo'yicha bazadan to'g'ridan-to'g'ri mezon topilmadi, umumiy bilimlar bazasi ma'lumotlaridan foydalanilsin.`;

    const systemPrompt = `Siz "Second Brain AI Copilot" — foydalanuvchining shaxsiy bilimlar bazasidagi 70,000+ Telegram manbalari va P.A.R.A qaydlari bo'yicha aqlli yordamchisiz.
O'zbek tilida professional, tushunarli va Markdown formatida javob bering.

Foydalanuvchining bilimlar bazasidan topilgan kontekst:
${contextBlock}`;

    let answer = '';

    // 3. Call DeepSeek V3 API (User key or server key)
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
        } else {
          console.warn('DeepSeek Copilot API status:', dsRes.status, await dsRes.text());
        }
      } catch (dsErr) {
        console.error('DeepSeek Copilot API error:', dsErr);
      }
    }

    // 4. Fallback Copilot Synthesizer if DeepSeek API is not reachable
    if (!answer) {
      if (contextSummary.length === 0) {
        answer = `🤖 **Second Brain AI Copilot:**\n\nMiyangizdan **"${prompt}"** so'rovi bo'yicha to'g'ridan-to'g'ri mezon topilmadi. Biroq neyron tarmoq ma'lumotlar bazasida **70,000+ Telegram manbalari** va P.A.R.A qaydlaringiz mavjud. Qidiruv so'zini aniqroq qilib so'rab ko'ring (masalan: *"AI"*, *"Kitob"*, *"Loyiha"*).`;
      } else {
        answer = `### 🤖 Second Brain AI Copilot Analizi:\n\nSizning ikkinchi miyangizdan **"${prompt}"** so'rovi bo'yicha quyidagi bog'liq ma'lumotlar va sinapslar topildi:\n\n` +
          contextSummary.join('\n\n') +
          `\n\n💡 **Neyron Copilot Tavsiya:** Ushbu manbalar asosida loyihalar va qaydlar o'rtasida sinaptik ulanish hosil qilindi.`;
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
