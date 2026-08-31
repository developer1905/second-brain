import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN || '';
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL || 'https://second-brain-ai-uob8.onrender.com';
const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBDqKK1Ki3PElFylbqKLXz_gTuhLrA50zk';

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

async function queryGemini(prompt: string): Promise<string> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_KEY}`;
    const payload = {
      contents: [
        { role: 'user', parts: [{ text: "Siz Telegram bot yordamchisiz. O'zbek tilida erkin, samimiy va javob bering." }] },
        { role: 'user', parts: [{ text: prompt }] },
      ],
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
  } catch (e) {
    console.error('Gemini webhook query error:', e);
  }
  return '';
}

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
    if (!update.message) return NextResponse.json({ ok: true });

    const msg        = update.message;
    const chatId     = msg.chat.id;
    const text       = (msg.text || '').trim();
    const fromUser   = msg.from || {};
    const firstName  = fromUser.first_name || 'foydalanuvchi';
    const username   = fromUser.username ? `@${fromUser.username}` : firstName;
    const chatName   = `${firstName} ${fromUser.last_name || ''}`.trim();

    if (!text) return NextResponse.json({ ok: true });

    let userId: string | null = null;
    try {
      const tgEmail = `tg_${String(fromUser.id)}@telegram.local`;
      const user = await prisma.user.findFirst({ where: { email: tgEmail }, select: { id: true } });
      if (user) userId = user.id;
      else {
        const admin = await prisma.user.findFirst({ where: { isAdmin: true }, select: { id: true } });
        if (admin) userId = admin.id;
      }
    } catch {}

    // /start
    if (text.startsWith('/start')) {
      await sendTelegram(chatId,
        `Salom <b>${firstName}</b>! 👋\n\n🧠 <b>Second Brain AI Bot</b>\n\n🤖 <b>AI Bilan Chatlashish:</b>\n<code>/ai [savolingiz]</code> — Google Gemini AI bilan gaplashish\n\n<b>Buyruqlar:</b>\n/report — Bugungi hisobot\n/stats — Statistika\n/help — Qo'llanma`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🧠 Second Brain Mini App', web_app: { url: APP_URL } }],
              [{ text: '💬 Gemini Web Chat', web_app: { url: `${APP_URL}/chat` } }],
            ],
          },
        }
      );
      return NextResponse.json({ ok: true });
    }

    // /ai command
    if (text.startsWith('/ai') || text.startsWith('/gemini')) {
      const parts = text.split(' ', 1);
      const prompt = text.slice(parts[0].length).trim();
      if (!prompt) {
        await sendTelegram(chatId, "🤖 <code>/ai [savolingiz]</code> deb yozing.\nMasalan: <code>/ai Python o'rganish bo'yicha maslahat ber</code>");
        return NextResponse.json({ ok: true });
      }

      await sendTelegram(chatId, "⏳ <i>Gemini AI o'ylamoqda...</i>");
      const aiReply = await queryGemini(prompt);
      await sendTelegram(chatId, `🤖 <b>Gemini AI:</b>\n\n${aiReply || 'Javob tayyorlashda xatolik.'}`, {
        reply_markup: { inline_keyboard: [[{ text: '💬 Web Chatda Ochish', web_app: { url: `${APP_URL}/chat` } }]] },
      });
      return NextResponse.json({ ok: true });
    }

    // Smart save
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
    } catch (e) {}

    if (text.endsWith('?') || text.length > 20) {
      const aiReply = await queryGemini(cleanText);
      if (aiReply) {
        await sendTelegram(chatId, `🤖 <b>Gemini AI:</b>\n\n${aiReply}`);
        return NextResponse.json({ ok: true });
      }
    }

    const catEmoji: Record<string, string> = { PROJECT: '🎯', AREA: '🌍', RESOURCE: '💡' };
    await sendTelegram(chatId, `✅ <b>Saqlandi!</b> ${catEmoji[paraCategory] || '📝'} [${paraCategory}] ${cleanText.slice(0, 50)}`);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: 'Telegram Gemini Webhook is active',
  });
}
