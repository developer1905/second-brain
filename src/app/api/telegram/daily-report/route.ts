import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_ID   = process.env.TELEGRAM_ADMIN_ID  || '';
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL || 'https://second-brain-ai.vercel.app';

// ── Build report data ─────────────────────────────────────────────────────────
async function buildDailyReport() {
  const now   = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const [
    todayNotes,
    totalNotes,
    activeProjects,
    completedProjects,
    habitLogs,
    totalHabits,
    transactions,
    weekNotes,
  ] = await Promise.all([
    prisma.note.count({ where: { createdAt: { gte: new Date(today) } } }),
    prisma.note.count(),
    prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.project.count({ where: { status: 'DONE' } }),
    prisma.habitLog.findMany({ where: { date: today, completed: true } }),
    prisma.habit.count(),
    prisma.transaction.findMany({ where: { date: today }, select: { type: true, amount: true, category: true } }),
    prisma.note.count({ where: { createdAt: { gte: weekAgo } } }),
  ]);

  const income  = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  return {
    today,
    todayNotes,
    totalNotes,
    activeProjects,
    completedProjects,
    habitsCompleted: habitLogs.length,
    totalHabits,
    income,
    expense,
    balance,
    weekNotes,
    txCount: transactions.length,
  };
}

// ── Format report message ─────────────────────────────────────────────────────
function formatReport(data: Awaited<ReturnType<typeof buildDailyReport>>, type: 'daily' | 'stats' = 'daily'): string {
  const habitPct = data.totalHabits > 0 ? Math.round((data.habitsCompleted / data.totalHabits) * 100) : 0;
  const habitBar = '█'.repeat(Math.floor(habitPct / 10)) + '░'.repeat(10 - Math.floor(habitPct / 10));

  if (type === 'stats') {
    return (
      `📊 <b>Umumiy Statistika</b>\n\n` +
      `📝 Jami eslatmalar: <b>${data.totalNotes}</b>\n` +
      `🗓 Bu hafta: <b>${data.weekNotes}</b>\n` +
      `🎯 Faol loyihalar: <b>${data.activeProjects}</b>\n` +
      `✅ Tugallangan: <b>${data.completedProjects}</b>\n` +
      `🏃 Jami odatlar: <b>${data.totalHabits}</b>`
    );
  }

  return (
    `🌙 <b>Kunlik Hisobot — ${data.today}</b>\n\n` +

    `📝 <b>Eslatmalar</b>\n` +
    `  Bugun qo'shildi: <b>${data.todayNotes}</b>\n` +
    `  Jami: ${data.totalNotes}\n\n` +

    `🎯 <b>Loyihalar</b>\n` +
    `  Faol: <b>${data.activeProjects}</b>\n` +
    `  Tugallangan: ${data.completedProjects}\n\n` +

    `🏃 <b>Odatlar</b>\n` +
    `  Bajarildi: <b>${data.habitsCompleted}/${data.totalHabits}</b> (${habitPct}%)\n` +
    `  <code>${habitBar}</code>\n\n` +

    `💰 <b>Moliya (bugun)</b>\n` +
    (data.txCount > 0
      ? `  Kirim: +<b>${data.income.toLocaleString()} so'm</b>\n  Chiqim: -<b>${data.expense.toLocaleString()} so'm</b>\n  Balans: <b>${data.balance >= 0 ? '+' : ''}${data.balance.toLocaleString()} so'm</b>`
      : `  Bugun tranzaksiyalar yo'q`) +

    `\n\n<i>Second Brain AI tomonidan avtomatik yuborildi 🤖</i>`
  );
}

// ── GET: Return report data as JSON ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const type = (req.nextUrl.searchParams.get('type') || 'daily') as 'daily' | 'stats';
    const data = await buildDailyReport();
    const message = formatReport(data, type);
    return NextResponse.json({ ok: true, data, message });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// ── POST: Send report to Telegram ─────────────────────────────────────────────
// Body: { chatId?: string, type?: 'daily' | 'stats' }
// If no chatId provided, sends to ADMIN_ID
export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'BOT_TOKEN not configured' }, { status: 500 });
    }

    const body     = await req.json().catch(() => ({}));
    const chatId   = body.chatId || ADMIN_ID;
    const type     = body.type || 'daily';

    if (!chatId) {
      return NextResponse.json({ ok: false, error: 'chatId or TELEGRAM_ADMIN_ID required' }, { status: 400 });
    }

    const data    = await buildDailyReport();
    const message = formatReport(data, type);

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Second Brain Mini App', web_app: { url: APP_URL } }],
            [{ text: '🌐 Saytni ochish', url: APP_URL }],
          ],
        },
      }),
    });

    const tgData = await tgRes.json();
    if (!tgData.ok) {
      return NextResponse.json({ ok: false, error: tgData.description }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sent: true, chatId, reportType: type, data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
