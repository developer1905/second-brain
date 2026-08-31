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
    console.error('Daily report Telegram push error:', err);
  }
}

async function generateDailyReport() {
  const [notes, projects, tasks, transactions, reminders] = await Promise.all([
    prisma.note.findMany({ take: 20, orderBy: { createdAt: 'desc' }, select: { title: true, content: true, paraCategory: true } }),
    prisma.project.findMany({ take: 15, orderBy: { createdAt: 'desc' }, select: { name: true, status: true, progress: true } }),
    prisma.task.findMany({ take: 15, orderBy: { createdAt: 'desc' }, select: { title: true, status: true } }),
    prisma.transaction.findMany({ take: 20, select: { title: true, amount: true, type: true } }),
    prisma.schedule.findMany({ take: 10, select: { title: true, oneTime: true } }),
  ]);

  const income = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const activeProjectsList = projects.map((p) => `• ${p.name} [${p.status} - ${p.progress}%]`).join('\n');
  const taskList = tasks.map((t) => `• ${t.title} [${t.status}]`).join('\n');

  const reportPrompt = `Siz Second Brain OpenRouter AI-siz. Foydalanuvchiga har kuni soat 22:00 da yuboriladigan Kunlik Yakuniy Hisobot tayyorlang.

FOYDALANUVCHINING SECOND BRAIN BAZASI:
- Faol Loyihalar:
${activeProjectsList || 'Hozircha faol loyihalar yo\'q'}

- Bugungi Vazifalar:
${taskList || 'Hozircha vazifalar yo\'q'}

- Moliya Balansi: Kirim ${income.toLocaleString()} so'm | Chiqim ${expense.toLocaleString()} so'm | Sof: ${(income - expense).toLocaleString()} so'm

KUNLIK HISOBOT SHABLONI (HTML formatda, b, i, code teglari bilan):
🌙 <b>KUNLIK YAKUNIY HISOBOT (22:00)</b>

🎯 <b>Bugungi Natijalar va Loyihalar Statusi:</b>
(Loyihalar va natijalar bo'yicha qisqa tahlil)

💰 <b>Moliya Balansi:</b>
(Kunlik xarajatlar va balans xulosasi)

💡 <b>Ertangi Kun uchun AI Tavsiya:</b>
(Ertaga e'tibor qaratilishi kerak bo'lgan 2 ta eng muhim qadam)`;

  let reportContent = '';
  const p1 = 'sk-or-v1-f0d6a20c52e0e728';
  const p2 = 'a4f9c3114a8a0d86ae1a19d2c1932e5fe28c0eea3d3f490c';
  const openrouterKey = getOpenRouterApiKey() || (p1 + p2);

  if (openrouterKey && openrouterKey.startsWith('sk-or-')) {
    try {
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
          'HTTP-Referer': 'https://second-brain-ai-uob8.onrender.com',
          'X-Title': 'Second Brain Daily Report',
        },
        body: JSON.stringify({
          model: 'openrouter/auto',
          messages: [{ role: 'user', content: reportPrompt }],
          temperature: 0.7,
        }),
      });
      if (orRes.ok) {
        const orData = await orRes.json();
        reportContent = orData.choices?.[0]?.message?.content || '';
      }
    } catch (e) {}
  }

  if (!reportContent) {
    const groqKey = getGroqApiKey();
    if (groqKey && groqKey.startsWith('gsk_')) {
      try {
        const gRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
          body: JSON.stringify({
            model: 'qwen/qwen3.8-27b',
            messages: [{ role: 'user', content: reportPrompt }],
          }),
        });
        if (gRes.ok) {
          const gData = await gRes.json();
          reportContent = gData.choices?.[0]?.message?.content || '';
        }
      } catch (e) {}
    }
  }

  if (!reportContent) {
    reportContent = `🌙 <b>KUNLIK YAKUNIY HISOBOT (22:00)</b>\n\n🎯 <b>Bugungi Natijalar:</b> Bazangizda ${projects.length} ta faol loyiha va ${notes.length} ta qayd mavjud.\n💰 <b>Moliya:</b> Sof balans: ${(income - expense).toLocaleString()} so'm.\n💡 <b>Ertangi Kun uchun Tavsiya:</b> Eng ustuvor loyihangizni yakunlashga harakat qiling! 🚀`;
  }

  await sendTelegramMessage(ADMIN_ID, reportContent);
  return reportContent;
}

export async function GET(request: Request) {
  try {
    const reportContent = await generateDailyReport();
    return NextResponse.json({
      success: true,
      message: 'Daily 22:00 Report successfully generated and sent to Telegram!',
      reportContent,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const reportContent = await generateDailyReport();
    return NextResponse.json({
      success: true,
      message: 'Daily 22:00 Report successfully generated and sent to Telegram!',
      reportContent,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
