import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { prompt, userApiKey = '' } = await request.json();
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Savol matni kiritilmadi" }, { status: 400 });
    }

    const userQuery = prompt.trim();

    // 1. Context retrieval for grounding
    const lowerQuery = userQuery.toLowerCase();
    const keywords = lowerQuery
      .replace(/[^\w\s\u0400-\u04FF]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 2);

    const OR_terms = keywords.length > 0 ? keywords.map((k: string) => ({ title: { contains: k } })) : [];

    const [notes, projects, telegrams] = await Promise.all([
      keywords.length > 0 ? prisma.note.findMany({ where: { OR: OR_terms }, take: 4 }) : [],
      keywords.length > 0 ? prisma.project.findMany({ where: { OR: keywords.map((k: string) => ({ name: { contains: k } })) }, take: 3 }) : [],
      keywords.length > 0 ? prisma.telegramMessage.findMany({ where: { OR: keywords.map((k: string) => ({ text: { contains: k } })) }, take: 3 }) : [],
    ]);

    const contextText = [
      notes.map((n) => `${n.title}: ${n.content.slice(0, 150)}`).join('\n'),
      projects.map((p) => `${p.name}: ${p.description}`).join('\n'),
      telegrams.map((t) => `${t.text.slice(0, 150)}`).join('\n'),
    ].filter(Boolean).join('\n');

    let answer = '';

    // 2. Direct DeepSeek V3 API Call
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
              {
                role: 'system',
                content: `Siz DeepSeek AI modelisiz. O'zbek tilida erkin, aniq va to'g'ridan-to'g'ri javob bering. Hech qanday keraksiz sarlavha, statistika yoki shablon ishlatmang. Javobni faqat savolga mos bering.\n\nKontekst: ${contextText}`,
              },
              { role: 'user', content: userQuery },
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
        console.error('DeepSeek API call error:', dsErr);
      }
    }

    // 3. Fallback: Pure direct answer without any template garbage or stats
    if (!answer) {
      if (contextText) {
        answer = contextText;
      } else {
        answer = `DeepSeek API kalitida balans yetarli emas (402 Payment Required). platform.deepseek.com saytida balansni to'ldiring yoki to'g'ri API kalit kiriting.`;
      }
    }

    return NextResponse.json({
      success: true,
      answer,
      sources: {
        notes,
        projects,
        telegrams,
      },
    });
  } catch (error: any) {
    console.error('Copilot API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
