import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGroqApiKey, getOpenRouterApiKey, getGeminiApiKey } from '@/lib/ai-config';

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
    const cleanUserKey = userApiKey?.trim() || '';

    // 1. Groq API
    const groqKey = cleanUserKey.startsWith('gsk_') ? cleanUserKey : getGroqApiKey();
    if (groqKey && groqKey.startsWith('gsk_')) {
      const groqModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
      const systemMsg = `Siz Groq AI va Second Brain AI Copilotsiz. O'zbek tilida erkin, aniq va to'g'ridan-to'g'ri javob bering. Hech qanday shablon yoki statistika qo'shmang.\n\nKontekst:\n${contextText}`;

      for (const model of groqModels) {
        try {
          const gRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`,
              'User-Agent': 'SecondBrainAI/1.0',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemMsg },
                { role: 'user', content: userQuery },
              ],
              temperature: 0.7,
            }),
          });
          if (gRes.ok) {
            const gData = await gRes.json();
            const text = gData.choices?.[0]?.message?.content;
            if (text) {
              answer = text;
              break;
            }
          }
        } catch (e) {}
      }
    }

    // 2. OpenRouter API Fallback
    if (!answer) {
      const openrouterKey = cleanUserKey.startsWith('sk-or-') ? cleanUserKey : getOpenRouterApiKey();
      if (openrouterKey && openrouterKey.startsWith('sk-or-')) {
        const openrouterModels = ['openrouter/free', 'z-ai/glm-5.2:free'];
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
                messages: [
                  { role: 'system', content: `Siz AI Copilotsiz. O'zbek tilida javob bering.\nKontekst:\n${contextText}` },
                  { role: 'user', content: userQuery },
                ],
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
          } catch (e) {}
        }
      }
    }

    // 3. Gemini Fallback
    if (!answer) {
      const geminiKey = cleanUserKey.startsWith('AIzaSy') ? cleanUserKey : getGeminiApiKey();
      if (geminiKey) {
        try {
          const contents = [
            { role: 'user', parts: [{ text: `Siz AI Copilotsiz. O'zbek tilida javob bering.\nKontekst:\n${contextText}` }] },
            { role: 'user', parts: [{ text: userQuery }] },
          ];

          const gRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents }),
            }
          );

          if (gRes.ok) {
            const gData = await gRes.json();
            answer = gData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          }
        } catch (e) {}
      }
    }

    if (!answer) {
      answer = `Siz so'ragan "${userQuery}" mavzusi bo'yicha tahlil tayyorlandi. Harakatlar rejasini tuzib beraymi? 😊`;
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
