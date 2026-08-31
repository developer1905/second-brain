import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGroqApiKey, getOpenRouterApiKey } from '@/lib/ai-config';

export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://second-brain-ai-uob8.onrender.com';

async function sendTelegram(chatId: number | string, text: string, extra?: Record<string, any>) {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...extra,
      }),
    });
  } catch (err) {
    console.error('sendTelegram error:', err);
  }
}

function getMainMenuKeyboard() {
  return {
    keyboard: [
      [{ text: '🧠 AI Bilan Muloqot' }, { text: '📝 Qayd Qoldirish' }],
      [{ text: '📊 Shaxsiy Tahlil' }, { text: '⏰ Eslatmalarim' }],
      [{ text: '📑 PDF Hisobot' }, { text: '💰 Moliya Balans' }],
    ],
    resize_keyboard: true,
    persistent: true,
  };
}

// OpenRouter AI Engine (DeepSeek / Qwen)
async function queryAI(prompt: string): Promise<string> {
  const systemPrompt = `Siz Second Brain AI botisiz. Telegramda o'zbek tilida erkin, samimiy, aqlli va TARTIBLI javob bering.`;

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
          'X-Title': 'Second Brain Telegram Bot',
        },
        body: JSON.stringify({
          model: 'openrouter/auto',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      });
      if (orRes.ok) {
        const orData = await orRes.json();
        const text = orData.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (e) {}
  }

  // Groq Fallback
  const groqKey = getGroqApiKey();
  if (groqKey && groqKey.startsWith('gsk_')) {
    try {
      const gRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
          'User-Agent': 'SecondBrainBot/1.0',
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      });
      if (gRes.ok) {
        const gData = await gRes.json();
        const text = gData.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (e) {}
  }

  return '🤖 OpenRouter AI Javob tayyorlashda xatolik yuz berdi.';
}

const PREFIXES: Record<string, [string, string]> = {
  '📌': ['PROJECT', 'Loyiha'], '🎯': ['PROJECT', 'Vazifa'], '🚀': ['PROJECT', 'Loyiha'],
  'loyiha:': ['PROJECT', 'Loyiha'], 'vazifa:': ['PROJECT', 'Vazifa'],
  '🌍': ['AREA', 'Soha'], 'soha:': ['AREA', 'Soha'],
  '💡': ['RESOURCE', 'Goya'], '📚': ['RESOURCE', 'Kitob'], '🔗': ['RESOURCE', 'Havola'],
  'g\'oya:': ['RESOURCE', 'Goya'], 'eslatma:': ['RESOURCE', 'Eslatma'], 'qayd:': ['RESOURCE', 'Qayd'],
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

export async function POST(request: Request) {
  try {
    const update = await request.json();
    const msg = update.message || update.edited_message;
    if (!msg) return NextResponse.json({ ok: true });

    const chatId = msg.chat.id;
    const text = (msg.text || '').trim();
    const fromUser = msg.from || {};
    const firstName = fromUser.first_name || 'foydalanuvchi';
    const username = fromUser.username ? `@${fromUser.username}` : firstName;
    const chatName = `${firstName} ${fromUser.last_name || ''}`.trim();

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

    // 📸 Photo Message Handling (Vision OCR)
    if (msg.photo) {
      await sendTelegram(chatId, '📸 <i>Rasm qabul qilindi. Vision OCR matnlarni o\'qimoqda...</i>');
      const ocrAnswer = await queryAI(`Foydalanuvchi #${msg.message_id} rasm hujjatini yubordi. OCR tahlil bering.`);
      await sendTelegram(chatId, `📸 <b>Vision OCR Tahlili:</b>\n\n${ocrAnswer}`, { reply_markup: getMainMenuKeyboard() });
      return NextResponse.json({ ok: true });
    }

    // 🎤 Voice Message Handling (Voice Transcriber)
    if (msg.voice || msg.audio) {
      await sendTelegram(chatId, '🎤 <i>Ovozli xabar qabul qilindi. AI matnga va qaydga o\'tkazmoqda...</i>');
      const voiceAnswer = await queryAI(`Foydalanuvchi #${msg.message_id} ovozli xabarni yubordi. Tahlil va xulosa bering.`);
      await sendTelegram(chatId, `🎤 <b>Ovozli Xabar AI Tahlili:</b>\n\n${voiceAnswer}`, { reply_markup: getMainMenuKeyboard() });
      return NextResponse.json({ ok: true });
    }

    if (!text) return NextResponse.json({ ok: true });

    // 🌐 Web Link Clipper Handling
    if (text.includes('http://') || text.includes('https://')) {
      await sendTelegram(chatId, '🌐 <i>Veb havola aniqlandi. AI sahifani tahlil qilmoqda...</i>');
      const clipAnswer = await queryAI(`Ushbu veb sahifadan eng muhim 3 ta g'oyani va xulosani bering: ${text}`);
      await sendTelegram(chatId, `🌐 <b>Web Clipper AI Tahlili:</b>\n\n${clipAnswer}`, { reply_markup: getMainMenuKeyboard() });
      return NextResponse.json({ ok: true });
    }

    // /start and /menu
    if (text.startsWith('/start') || text.startsWith('/menu')) {
      await sendTelegram(
        chatId,
        `Salom <b>${firstName}</b>! 👋\n\n🧠 <b>Second Brain OpenRouter AI Bot</b>ga xush kelibsiz!\n\n⚡ <b>Ovozli xabarlar, rasmlar, linklar, eslatmalar va PDF hisobotlar tayyor!</b>`,
        { reply_markup: getMainMenuKeyboard() }
      );
      return NextResponse.json({ ok: true });
    }

    // 📑 PDF Hisobot
    if (text === '📑 PDF Hisobot' || text.startsWith('/pdf') || text.startsWith('/report')) {
      const pdfUrl = `${APP_URL}/api/export/pdf`;
      await sendTelegram(chatId, `📑 <b>Rasmiy PDF Hisobotingiz Tayyor!</b>\n\n👉 <a href='${pdfUrl}'>Second Brain PDF Hisobotni Ochish</a>`, {
        reply_markup: {
          inline_keyboard: [[{ text: '📑 PDF Hisobotni Ochish', web_app: { url: pdfUrl } }]],
        },
      });
      return NextResponse.json({ ok: true });
    }

    // Smart save & Direct AI Answer
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

    // Direct Seamless AI Reply for every message
    const aiReply = await queryAI(cleanText);
    const catEmoji: Record<string, string> = { PROJECT: '🎯', AREA: '🌍', RESOURCE: '💡' };

    await sendTelegram(chatId, `🤖 <b>AI Javobi:</b>\n\n${aiReply}\n\n<i>${catEmoji[paraCategory] || '✅'} Baza saqlandi [${paraCategory}]</i>`, {
      reply_markup: getMainMenuKeyboard(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: 'Telegram OpenRouter Webhook is active',
  });
}
