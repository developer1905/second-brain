import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL || 'https://second-brain-ai.vercel.app';
const ADMIN_TG  = process.env.TELEGRAM_ADMIN_ID   || '6542040260';

// ── Smart PARA Parser ─────────────────────────────────────────────────────────
const PREFIXES: Record<string, [string, string]> = {
  '📌': ['PROJECT', 'Loyiha'], '🎯': ['PROJECT', 'Vazifa'], '🚀': ['PROJECT', 'Loyiha'],
  'loyiha:': ['PROJECT', 'Loyiha'], 'project:': ['PROJECT', 'Loyiha'],
  'vazifa:': ['PROJECT', 'Vazifa'], 'task:': ['PROJECT', 'Vazifa'],
  '🌍': ['AREA', 'Soha'], 'soha:': ['AREA', 'Soha'], 'area:': ['AREA', 'Soha'],
  '💡': ['RESOURCE', 'Goya'], '📚': ['RESOURCE', 'Kitob'], '🔗': ['RESOURCE', 'Havola'],
  '📖': ['RESOURCE', 'Resurs'], "g'oya:": ['RESOURCE', 'Goya'], 'goya:': ['RESOURCE', 'Goya'],
  'idea:': ['RESOURCE', 'Goya'], 'kitob:': ['RESOURCE', 'Kitob'], 'book:': ['RESOURCE', 'Kitob'],
  'url:': ['RESOURCE', 'Havola'], 'link:': ['RESOURCE', 'Havola'],
  'resurs:': ['RESOURCE', 'Resurs'], 'resource:': ['RESOURCE', 'Resurs'],
  '📝': ['RESOURCE', 'Eslatma'], 'eslatma:': ['RESOURCE', 'Eslatma'], 'note:': ['RESOURCE', 'Eslatma'],
  '💰': ['RESOURCE', 'Moliya'], 'kirim:': ['RESOURCE', 'Kirim'], 'chiqim:': ['RESOURCE', 'Chiqim'],
};

function parseMessage(text: string): [string, string, string] {
  const lower = text.toLowerCase().trim();
  for (const [prefix, [cat, tag]] of Object.entries(PREFIXES)) {
    if (lower.startsWith(prefix.toLowerCase())) {
      const clean = text.slice(prefix.length).trim();
      return [cat, tag, clean || text];
    }
  }
  return ['RESOURCE', 'Eslatma', text];
}

// ── Telegram API helper ───────────────────────────────────────────────────────
async function sendTelegram(chatId: number | string, text: string, extra?: object) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...extra,
    }),
  }).catch(() => {});
}

export async function POST(request: Request) {
  try {
    const update = await request.json();

    if (!update.message) {
      return NextResponse.json({ ok: true });
    }

    const msg        = update.message;
    const chatId     = msg.chat.id;
    const text       = (msg.text || '').trim();
    const fromUser   = msg.from || {};
    const firstName  = fromUser.first_name || 'foydalanuvchi';
    const username   = fromUser.username ? `@${fromUser.username}` : firstName;
    const chatName   = `${firstName} ${fromUser.last_name || ''}`.trim();

    if (!text) {
      return NextResponse.json({ ok: true });
    }

    // ── Find or resolve admin user ────────────────────────────────────────────
    let userId: string | null = null;
    try {
      const tgEmail = `tg_${String(fromUser.id)}@telegram.local`;
      const user = await prisma.user.findFirst({ where: { email: tgEmail }, select: { id: true } });
      if (user) userId = user.id;
      else {
        // fallback: first admin user
        const admin = await prisma.user.findFirst({ where: { isAdmin: true }, select: { id: true } });
        if (admin) userId = admin.id;
      }
    } catch {}

    // ── /start ────────────────────────────────────────────────────────────────
    if (text.startsWith('/start')) {
      await sendTelegram(chatId,
        `Salom <b>${firstName}</b>! 👋\n\n🧠 <b>Second Brain AI</b> — O'zbek tili Neural Knowledge System\n\n<b>Buyruqlar:</b>\n📌 <code>Loyiha: [matn]</code> → PROJECT\n💡 <code>G'oya: [matn]</code> → RESOURCE\n📝 <code>Oddiy matn</code> → Eslatma\n🎯 <code>Vazifa: [matn]</code> → Vazifa\n📚 <code>Kitob: [matn]</code> → Kitob\n💰 <code>Kirim: [summa]</code> → Moliya\n\n/report — Kunlik hisobot\n/stats — Statistika\n/help — To'liq qo'llanma`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🧠 Second Brain Mini App', web_app: { url: APP_URL } }],
              [{ text: '🌐 Saytni brauzerda ochish', url: APP_URL }],
            ],
          },
        }
      );
      return NextResponse.json({ ok: true });
    }

    // ── /help ─────────────────────────────────────────────────────────────────
    if (text.startsWith('/help')) {
      await sendTelegram(chatId,
        `ℹ️ <b>Yordam &amp; Qo'llanma</b>\n\n<b>Buyruqlar:</b>\n/start — Xush kelibsiz\n/help — Shu yordam\n/report — Bugungi hisobot\n/stats — Umumiy statistika\n\n<b>Smart saqlash:</b>\n📌 <code>Loyiha: [nom]</code> → PROJECT\n🎯 <code>Vazifa: [nom]</code> → Vazifa\n💡 <code>G'oya: [matn]</code> → RESOURCE\n📚 <code>Kitob: [nom]</code> → Kitob\n🔗 <code>URL: [link]</code> → Havola\n📝 <code>Eslatma: [matn]</code> → Note\n🌍 <code>Soha: [nom]</code> → AREA\n💰 <code>Kirim: [summa]</code> → Moliya\n\nPrefix ishlatmasangiz → Eslatma sifatida saqlanadi ✅`
      );
      return NextResponse.json({ ok: true });
    }

    // ── /report ───────────────────────────────────────────────────────────────
    if (text.startsWith('/report')) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [notes, projects, habits, transactions] = await Promise.all([
          prisma.note.count({ where: { createdAt: { gte: new Date(today) } } }),
          prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
          prisma.habitLog.count({ where: { date: today, completed: true } }),
          prisma.transaction.findMany({
            where: { date: today },
            select: { type: true, amount: true },
          }),
        ]);
        const income  = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

        await sendTelegram(chatId,
          `📊 <b>Bugungi Hisobot (${today})</b>\n\n` +
          `📝 Yangi eslatmalar: <b>${notes}</b>\n` +
          `🎯 Faol loyihalar: <b>${projects}</b>\n` +
          `🏃 Bajarilgan odatlar: <b>${habits}</b>\n` +
          `💰 Kirim: <b>${income.toLocaleString()} so'm</b>\n` +
          `💸 Chiqim: <b>${expense.toLocaleString()} so'm</b>\n` +
          `📈 Balans: <b>${(income - expense).toLocaleString()} so'm</b>`,
          { reply_markup: { inline_keyboard: [[{ text: '📱 Second Brain', web_app: { url: APP_URL } }]] } }
        );
      } catch (e: any) {
        await sendTelegram(chatId, `⚠️ Hisobot olishda xatolik: ${e.message}`);
      }
      return NextResponse.json({ ok: true });
    }

    // ── /stats ────────────────────────────────────────────────────────────────
    if (text.startsWith('/stats')) {
      try {
        const [noteCount, projectCount, habitCount, txCount] = await Promise.all([
          prisma.note.count(),
          prisma.project.count(),
          prisma.habit.count(),
          prisma.transaction.count(),
        ]);
        await sendTelegram(chatId,
          `📈 <b>Umumiy Statistika</b>\n\n` +
          `📝 Jami eslatmalar: <b>${noteCount}</b>\n` +
          `🎯 Jami loyihalar: <b>${projectCount}</b>\n` +
          `🏃 Jami odatlar: <b>${habitCount}</b>\n` +
          `💰 Jami tranzaksiyalar: <b>${txCount}</b>`
        );
      } catch (e: any) {
        await sendTelegram(chatId, `⚠️ Statistika olishda xatolik: ${e.message}`);
      }
      return NextResponse.json({ ok: true });
    }

    // ── Smart save regular message ────────────────────────────────────────────
    const [paraCategory, tag, cleanText] = parseMessage(text);

    try {
      await prisma.telegramMessage.create({
        data: {
          telegramId: msg.message_id ? BigInt(msg.message_id) : null,
          chatName,
          fromName: username,
          isOutgoing: false,
          text: cleanText,
          date: new Date(msg.date * 1000).toISOString(),
          mediaType: 'text',
          paraCategory,
          ...(userId ? { userId } : {}),
        },
      });

      // Also save as Note
      await prisma.note.create({
        data: {
          title: cleanText.slice(0, 80) || `Telegram qayd #${msg.message_id}`,
          content: cleanText,
          paraCategory,
          sourceType: 'TELEGRAM',
          tags: `Telegram,${tag},${username}`,
          ...(userId ? { userId } : {}),
        },
      });
    } catch (dbErr: any) {
      console.error('Webhook DB save error:', dbErr);
    }

    const catEmoji: Record<string, string> = { PROJECT: '🎯', AREA: '🌍', RESOURCE: '💡' };
    const preview = cleanText.slice(0, 60) + (cleanText.length > 60 ? '...' : '');
    await sendTelegram(chatId,
      `✅ <b>Saqlandi!</b>\n\n${catEmoji[paraCategory] || '📝'} <b>Kategoriya:</b> ${paraCategory} [${tag}]\n📝 <b>Matn:</b> ${preview}`,
      { reply_markup: { inline_keyboard: [[{ text: '🧠 Second Brain', web_app: { url: APP_URL } }]] } }
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Telegram Webhook error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: 'Telegram Webhook listener is running',
    bot_token_set: !!BOT_TOKEN,
    app_url: APP_URL,
  });
}
