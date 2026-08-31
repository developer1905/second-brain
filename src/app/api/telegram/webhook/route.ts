import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGroqApiKey, getGeminiApiKey } from '@/lib/ai-config';

export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL || 'https://second-brain-ai-uob8.onrender.com';

async function sendTelegram(chatId: number | string, text: string, extra: Record<string, any> = {}) {
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

// Pure Groq Cloud AI Engine (Llama 3.3 70B)
async function queryAI(prompt: string): Promise<string> {
  const systemPrompt = `Siz Second Brain AI botisiz. Telegramda o'zbek tilida erkin, samimiy, aqlli va TARTIBLI javob bering.`;

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
          model: 'llama-3.3-70b-versatile',
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

  return '🤖 Groq AI Javob tayyorlashda xatolik yuz berdi.';
}

const PREFIXES: Record<string, [string, string]> = {
  '📌': ['PROJECT', 'Loyiha'], '🎯': ['PROJECT', 'Vazifa'], '🚀': ['PROJECT', 'Loyiha'],
  'loyiha:': ['PROJECT', 'Loyiha'], 'project:': ['PROJECT', 'Loyiha'],
  '🌍': ['AREA', 'Soha'], 'soha:': ['AREA', 'Soha'],
  '💡': ['RESOURCE', 'Goya'], '📚': ['RESOURCE', 'Kitob'], '📖': ['RESOURCE', 'Resurs'],
  'g\'oya:': ['RESOURCE', 'Goya'], 'kitob:': ['RESOURCE', 'Kitob'],
  '📝': ['RESOURCE', 'Eslatma'], 'eslatma:': ['RESOURCE', 'Eslatma'], 'qayd:': ['RESOURCE', 'Qayd'],
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
    if (!msg || !msg.text) return NextResponse.json({ ok: true });

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
        `Salom <b>${firstName}</b>! 👋\n\n🤖 <b>Second Brain AI Chatbot</b>\n\n💡 Shunchaki xohlagan savolingizni yozing — AI darhol muloqot qiladi va bazaga saqlaydi!`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🧠 Second Brain Mini App', web_app: { url: APP_URL } }],
              [{ text: '💬 AI Web Chat', web_app: { url: `${APP_URL}/chat` } }],
            ],
          },
        }
      );
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
      reply_markup: {
        inline_keyboard: [
          [{ text: '💬 Web Chatda Ochish', web_app: { url: `${APP_URL}/chat` } }],
          [{ text: '🧠 Second Brain Mini App', web_app: { url: APP_URL } }],
        ],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: 'Telegram Gemini & Groq Webhook is active',
  });
}
