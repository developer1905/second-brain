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

    const openrouterKey = userApiKey?.trim() || process.env.OPENROUTER_API_KEY || '';
    if (openrouterKey && openrouterKey.startsWith('sk-or-')) {
      const openrouterModels = ['openrouter/free', 'z-ai/glm-5.2:free', 'inclusionai/ling-3.0-flash-fin:free'];
      const messagesPayload = [
        {
          role: 'system',
          content: `Siz OpenRouter va Second Brain AI Copilotsiz. O'zbek tilida erkin, aniq va to'g'ridan-to'g'ri javob bering. Hech qanday shablon yoki statistika qo'shmang.\n\nKontekst:\n${contextText}`,
        },
        { role: 'user', content: userQuery },
      ];

      for (const model of openrouterModels) {
        try {
          const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openrouterKey}`,
              'HTTP-Referer': 'https://second-brain-ai-uob8.onrender.com',
              'X-Title': 'Second Brain AI',
            },
            body: JSON.stringify({
              model,
              messages: messagesPayload,
              temperature: 0.7,
            }),
          });

          if (orRes.ok) {
            const orData = await orRes.json();
            const text = orData.choices?.[0]?.message?.content;
            if (text) {
              answer = text;
              break;
            }
          }
        } catch (e) {
          console.warn(`OpenRouter Copilot failed for ${model}:`, e);
        }
      }
    }

    if (!answer) {
      answer = `Assalomu aleykum! Men OpenRouter AI Copilot yordamchingizman. Savolingizni bemalol berishingiz mumkin. 😊`;
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
