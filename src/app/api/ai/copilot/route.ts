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

    // Check if self-analysis or context is requested
    const isSelfAnalysis =
      lowerQuery.includes('analiz') ||
      lowerQuery.includes('tahlil') ||
      lowerQuery.includes('shaxsim') ||
      lowerQuery.includes('xarakter') ||
      lowerQuery.includes('profil') ||
      lowerQuery.includes('haqimda') ||
      lowerQuery.includes('kuchli tomon') ||
      lowerQuery.includes('kimman');

    const needsContext =
      isSelfAnalysis ||
      lowerQuery.includes('telegram') ||
      lowerQuery.includes('qayd') ||
      lowerQuery.includes('loyiha') ||
      lowerQuery.includes('baza') ||
      lowerQuery.includes('eslatma') ||
      lowerQuery.includes('miya') ||
      lowerQuery.includes('hisobot');

    let contextText = '';
    let notes: any[] = [];
    let projects: any[] = [];
    let telegrams: any[] = [];

    if (isSelfAnalysis) {
      // Gather comprehensive statistics across all database entities
      const [
        allNotes,
        allProjects,
        allAreas,
        allHabits,
        allTx,
        allBooks,
        allRepos,
        recentTelegrams,
      ] = await Promise.all([
        prisma.note.findMany({ select: { title: true, paraCategory: true, tags: true }, take: 15 }),
        prisma.project.findMany({ select: { name: true, status: true, progress: true, description: true }, take: 10 }),
        prisma.area.findMany({ select: { name: true }, take: 5 }),
        prisma.habit.findMany({ select: { title: true, streakCount: true }, take: 10 }),
        prisma.transaction.findMany({ select: { type: true, amount: true, category: true }, take: 20 }),
        prisma.book.findMany({ select: { title: true, author: true }, take: 5 }),
        prisma.githubRepo.findMany({ select: { name: true, language: true }, take: 5 }),
        prisma.telegramMessage.findMany({ take: 20, orderBy: { createdAt: 'desc' }, select: { text: true, fromName: true } }),
      ]);

      const noteCategories = allNotes.map((n) => `${n.paraCategory}: ${n.title}`).join(', ');
      const projectSummary = allProjects.map((p) => `${p.name} (${p.status}, ${p.progress}%)`).join(', ');
      const habitSummary = allHabits.map((h) => `${h.title} (${h.streakCount} streak)`).join(', ');
      const bookSummary = allBooks.map((b) => `"${b.title}" - ${b.author}`).join(', ');
      const repoSummary = allRepos.map((r) => `${r.name} (${r.language})`).join(', ');

      contextText = `
=== FOYDALANUVCHINING SECOND BRAIN TIZIMIDAGI MA'LUMOTLARI ===
- Qaydlar va G'oyalar (Jami ${allNotes.length}+): ${noteCategories}
- Loyihalar (Jami ${allProjects.length}): ${projectSummary}
- Sohalar: ${allAreas.map((a) => a.name).join(', ')}
- Odatlar: ${habitSummary}
- O'qilgan Kitoblar: ${bookSummary}
- GitHub Kod Loyihalari: ${repoSummary}
- So'nggi Telegram Xabarlari: ${recentTelegrams.map((t) => t.text.slice(0, 80)).join(' | ')}
`;
    } else if (needsContext) {
      const keywords = lowerQuery
        .replace(/[^\w\s\u0400-\u04FF]/g, ' ')
        .split(/\s+/)
        .filter((w: string) => w.length > 2);

      const OR_terms = keywords.length > 0 ? keywords.map((k: string) => ({ title: { contains: k } })) : [];

      [notes, projects, telegrams] = await Promise.all([
        keywords.length > 0 ? prisma.note.findMany({ where: { OR: OR_terms }, take: 3 }) : [],
        keywords.length > 0 ? prisma.project.findMany({ where: { OR: keywords.map((k: string) => ({ name: { contains: k } })) }, take: 3 }) : [],
        keywords.length > 0 ? prisma.telegramMessage.findMany({ where: { OR: keywords.map((k: string) => ({ text: { contains: k } })) }, take: 3 }) : [],
      ]);

      contextText = [
        notes.map((n) => `Qayd [${n.title}]: ${n.content.slice(0, 150)}`).join('\n'),
        projects.map((p) => `Loyiha [${p.name}]: ${p.description}`).join('\n'),
        telegrams.map((t) => `Telegram [${t.fromName}]: ${t.text.slice(0, 150)}`).join('\n'),
      ].filter(Boolean).join('\n');
    }

    let systemPrompt = `Siz aqlli AI yordamchisiz (ChatGPT / Gemini muqobili). O'zbek tilida erkin, samimiy, aniq va to'g'ridan-to'g'ri javob bering.`;

    if (isSelfAnalysis) {
      systemPrompt = `Siz Second Brain AI Psixolog va Produktivlik Tahlilchisiz. Foydalanuvchining barcha qaydlari, loyihalari, odatlari, kitoblari va telegram manbalari asosida uning shaxsiyatini, diqqat markazini va o'sish nuqtalarini chuqur tahlil qiling.\n\nTahlil Formati:\n1. 🎯 **Asosiy Diqqat Markazingiz va Qiziqishlaringiz**\n2. ⚡ **Ishchanlik va Produktivlik Natijalaringiz**\n3. 🧠 **Neyron Bilimlar Bazangiz Tahlili**\n4. 💡 **Kuchli Tomonlaringiz va O'sish Nuqtalaringiz**\n\nQuyidagi real ma'lumotlar asosida tahlil qiling:\n${contextText}`;
    } else if (needsContext && contextText) {
      systemPrompt = `Siz Second Brain AI Copilotsiz. O'zbek tilida erkin, aniq va to'g'ridan-to'g'ri javob bering. Foydalanuvchi so'roviga tegishli quyidagi bazaviy ma'lumotlardan foydalanishingiz mumkin:\n\n${contextText}`;
    }

    let answer = '';
    const cleanUserKey = userApiKey?.trim() || '';

    // 1. Groq API
    const groqKey = cleanUserKey.startsWith('gsk_') ? cleanUserKey : getGroqApiKey();
    if (groqKey && groqKey.startsWith('gsk_')) {
      const groqModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];

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
                { role: 'system', content: systemPrompt },
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
                  { role: 'system', content: systemPrompt },
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
            { role: 'user', parts: [{ text: systemPrompt }] },
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
      answer = `Siz so'ragan shaxsiy tahlilingiz tayyorlandi. Tizimingizda ${notes.length} ta qayd, ${projects.length} ta loyiha bor. Qaysi yo'nalish bo'yicha chuqurroq tahlil kerak? 😊`;
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
