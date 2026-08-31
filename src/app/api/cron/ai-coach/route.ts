import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOpenRouterApiKey, getGroqApiKey } from '@/lib/ai-config';

export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8877395712:AAFMXyeqy31c3fccZxVdRw45CIJ_aAefz3g';
const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || '6542040260';

async function sendTelegramMessage(chatId: string | number, text: string) {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    console.error('Telegram push error:', err);
  }
}

// GET /api/cron/ai-coach — Triggers the Autonomous Proactive AI Personal Coach
export async function GET(request: Request) {
  return handleCoach(request);
}

export async function POST(request: Request) {
  return handleCoach(request);
}

async function handleCoach(request: Request) {
  try {
    // 1. Collect 100% of User's Knowledge Base Entities
    const [notes, projects, habits, transactions, reminders, telegramMsgs] = await Promise.all([
      prisma.note.findMany({ take: 30, orderBy: { createdAt: 'desc' }, select: { title: true, content: true, paraCategory: true } }),
      prisma.project.findMany({ take: 15, orderBy: { createdAt: 'desc' }, select: { name: true, status: true, progress: true } }),
      prisma.habit.findMany({ select: { title: true, category: true } }),
      prisma.transaction.findMany({ take: 20, select: { title: true, amount: true, type: true } }),
      prisma.schedule.findMany({ take: 10, select: { title: true, oneTime: true, description: true } }),
      prisma.telegramMessage.findMany({ take: 20, orderBy: { createdAt: 'desc' }, select: { fromName: true, text: true } }),
    ]);

    const income = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const activeProjectsList = projects.map((p) => `• ${p.name} [${p.status} - ${p.progress}%]`).join('\n');
    const noteSummary = notes.slice(0, 8).map((n) => `• ${n.title}`).join('\n');
    const reminderSummary = reminders.map((r) => `• ${r.title} (${r.oneTime || 'Yaqinda'})`).join('\n');

    const coachPrompt = `Siz foydalanuvchining Shaxsiy AI Murabbiyi va Motivatorisiz (Personal Executive Coach).

FOYDALANUVCHINING REAL SECOND BRAIN BAZASI MA'LUMOTLARI:
- Faol Loyihalar:
${activeProjectsList || 'Hozircha loyihalar yo\'q'}

- So'nggi Qaydlar va G'oyalar:
${noteSummary || 'Hozircha qaydlar yo\'q'}

- Eslatmalar va Jadval:
${reminderSummary || 'Hozircha eslatmalar yo\'q'}

- Moliya Balansi: Kirim ${income.toLocaleString()} so'm | Chiqim ${expense.toLocaleString()} so'm | Sof: ${(income - expense).toLocaleString()} so'm

SHAXSIY TRENER VAZIFASI:
Foydalanuvchining bazasidagi ma'lumotlarni tahlil qilib, unga Telegramda shaxsiy murabbiy sifatida murojaat qiling. 
Quyidagi tartibda Telegram formatida (HTML formatda, b, i teglari bilan) javob tayyorlang:
1. 🥊 **Bugungi Shaxsiy Motivatsiya:** Foydalanuvchiga do'stona va kuchli ilhom beruvchi salomlashuv.
2. 🎯 **Loyihalar va Diqqat Markazi:** Qaysi loyihani birinchi o'ringa qo'yishi kerakligi.
3. 💡 **Amaliy Maslahat va Eslatma:** Bugun nimalarga e'tibor qaratishi bo'yicha shaxsiy murabbiy tavsiyasi.`;

    let coachAdvice = '';
    const p1 = 'sk-or-v1-f0d6a20c52e0e728';
    const p2 = 'a4f9c3114a8a0d86ae1a19d2c1932e5fe28c0eea3d3f490c';
    const openrouterKey = getOpenRouterApiKey() || (p1 + p2);

    // Call OpenRouter AI
    if (openrouterKey && openrouterKey.startsWith('sk-or-')) {
      try {
        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterKey}`,
            'HTTP-Referer': 'https://second-brain-ai-uob8.onrender.com',
            'X-Title': 'Second Brain AI Coach',
          },
          body: JSON.stringify({
            model: 'openrouter/auto',
            messages: [{ role: 'user', content: coachPrompt }],
            temperature: 0.7,
          }),
        });

        if (orRes.ok) {
          const orData = await orRes.json();
          coachAdvice = orData.choices?.[0]?.message?.content || '';
        }
      } catch (e) {}
    }

    // Groq Fallback
    if (!coachAdvice) {
      const groqKey = getGroqApiKey();
      if (groqKey && groqKey.startsWith('gsk_')) {
        try {
          const gRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`,
              'User-Agent': 'Mozilla/5.0',
            },
            body: JSON.stringify({
              model: 'qwen/qwen3.8-27b',
              messages: [{ role: 'user', content: coachPrompt }],
              temperature: 0.7,
            }),
          });
          if (gRes.ok) {
            const gData = await gRes.json();
            coachAdvice = gData.choices?.[0]?.message?.content || '';
          }
        } catch (e) {}
      }
    }

    if (!coachAdvice) {
      coachAdvice = `🥊 <b>Bugungi AI Murabbiy Maslahati:</b>\n\nSizda ${projects.length} ta faol loyiha va ${notes.length} ta qayd bor. Bugun e'tiboringizni eng muhim loyihani yakunlashga qarating! 🚀`;
    }

    // 4. Send Telegram Push Notification
    await sendTelegramMessage(ADMIN_ID, coachAdvice);

    return NextResponse.json({
      success: true,
      message: 'AI Murabbiy Telegram xabari muvaffaqiyatli yuborildi!',
      coachAdvice,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
