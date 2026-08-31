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

    // Google Gemini API call
    const geminiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
    if (geminiKey && geminiKey.length > 8) {
      const geminiModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `Siz Google Gemini AI yordamchisiz. O'zbek tilida erkin, aniq va to'g'ridan-to'g'ri javob bering. Hech qanday shablon yoki statistika qo'shmang.\n\nKontekst:\n${contextText}`,
            },
          ],
        },
        { role: 'user', parts: [{ text: userQuery }] },
      ];

      for (const model of geminiModels) {
        try {
          let gRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents }),
            }
          );

          if (!gRes.ok) {
            gRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${geminiKey}`,
                  'x-goog-api-key': geminiKey,
                },
                body: JSON.stringify({ contents }),
              }
            );
          }

          if (gRes.ok) {
            const gData = await gRes.json();
            const text = gData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              answer = text;
              break;
            }
          }
        } catch (e) {
          console.warn(`Gemini Copilot failed for ${model}:`, e);
        }
      }
    }

    if (!answer) {
      if (contextText) {
        answer = contextText;
      } else {
        answer = `Salom! Men sizning Gemini AI yordamchingizman. Savolingizni bemalol berishingiz mumkin.`;
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
