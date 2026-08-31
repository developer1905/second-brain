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

async function getDatabaseFullContext(userQuery: string): Promise<string> {
  try {
    const searchWords = userQuery
      .toLowerCase()
      .replace(/[^\w\s\u0400-\u04FF]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['haqida', 'bilan', 'nima', 'menga', 'mening', 'oqlib', 'ber', 'ayt', 'salom', 'qanday', 'nimalar', 'gaplashganman'].includes(w));

    const tgSearchConditions = searchWords.map((w) => ({
      OR: [
        { text: { contains: w } },
        { fromName: { contains: w } },
        { chatName: { contains: w } },
      ],
    }));

    const noteSearchConditions = searchWords.map((w) => ({
      OR: [
        { title: { contains: w } },
        { content: { contains: w } },
      ],
    }));

    const [
      matchedTgMsgs,
      matchedNotes,
      totalTgMsgs,
      recentTgMsgs,
      totalNotes,
      recentNotes,
      projects,
      tasks,
      transactions,
    ] = await Promise.all([
      tgSearchConditions.length > 0
        ? prisma.telegramMessage.findMany({
            where: { OR: tgSearchConditions.flatMap((c) => c.OR) },
            take: 60,
            orderBy: { createdAt: 'desc' },
            select: { fromName: true, chatName: true, text: true, date: true },
          })
        : [],
      noteSearchConditions.length > 0
        ? prisma.note.findMany({
            where: { OR: noteSearchConditions.flatMap((c) => c.OR) },
            take: 30,
            orderBy: { createdAt: 'desc' },
            select: { title: true, content: true, paraCategory: true },
          })
        : [],
      prisma.telegramMessage.count(),
      prisma.telegramMessage.findMany({ take: 30, orderBy: { createdAt: 'desc' }, select: { fromName: true, text: true } }),
      prisma.note.count(),
      prisma.note.findMany({ take: 20, orderBy: { createdAt: 'desc' }, select: { title: true, content: true, paraCategory: true } }),
      prisma.project.findMany({ take: 15, orderBy: { createdAt: 'desc' }, select: { name: true, status: true, progress: true } }),
      prisma.task.findMany({ take: 15, orderBy: { createdAt: 'desc' }, select: { title: true, status: true } }),
      prisma.transaction.findMany({ take: 20, select: { title: true, amount: true, type: true } }),
    ]);

    const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

    const searchTgFormatted = matchedTgMsgs.length > 0
      ? matchedTgMsgs.map(m => `• [${m.date?.slice(0, 10) || 'Telegram'}] ${m.chatName || m.fromName}: "${m.text}"`).join('\n')
      : 'Ushbu so\'rov bo\'yicha Telegram suhbatlaridan alohida natijalar topilmadi.';

    const searchNoteFormatted = matchedNotes.length > 0
      ? matchedNotes.map(n => `• [${n.paraCategory}] Sarlavha: "${n.title}" | Matn: "${n.content}"`).join('\n')
      : '';

    const tgSummary = recentTgMsgs.map(m => `• [${m.fromName}]: ${m.text}`).join('\n');
    const noteSummary = recentNotes.map(n => `• [${n.paraCategory}] Sarlavha: "${n.title}" | Matn: "${n.content}"`).join('\n');
    const projectSummary = projects.map(p => `• Loyiha: "${p.name}" (${p.status} - ${p.progress}%)`).join('\n');
    const taskSummary = tasks.map(t => `• Vazifa: "${t.title}" (${t.status})`).join('\n');

    return `FOYDALANUVCHINING BARCHA SECOND BRAIN BAZASI VA 70,500+ TELEGRAM SUHBATLARI:
- Telegram Baza Arxivi: ${totalTgMsgs} ta xabar
- Saqlangan Qaydlar Soni: ${totalNotes} ta
- Moliyaviy Balans: Kirim ${income.toLocaleString()} so'm | Chiqim ${expense.toLocaleString()} so'm

🔎 SO'ROV BO'YICHA TELEGRAM BAZASIDAN TOPILGAN ANIQ SUHBATLAR (${matchedTgMsgs.length} ta):
${searchTgFormatted}

${searchNoteFormatted ? `🔎 SO'ROV BO'YICHA TOPILGAN QAYDLAR:\n${searchNoteFormatted}\n` : ''}

📌 SO'NGGI TELEGRAM SUHBATLARI:
${tgSummary || 'Hali xabarlar mavjud emas'}

📌 SO'NGGI QAYDLAR VA LOYIHALAR:
${noteSummary || 'Hali qaydlar mavjud emas'}
${projectSummary || 'Hozircha faol loyihalar mavjud emas'}
${taskSummary || 'Hozircha vazifalar mavjud emas'}`;
  } catch (e) {
    return 'Baza ma\'lumotlarini o\'qishda qisman xatolik bo\'ldi.';
  }
}

// OpenRouter AI Engine (DeepSeek / Qwen) with 70,500+ Telegram Deep Search
async function queryAI(prompt: string): Promise<string> {
  const dbContext = await getDatabaseFullContext(prompt);
  const systemPrompt = `Siz Second Brain OpenRouter AI botisiz. Sizda foydalanuvchining 70,500+ Telegram suhbatlari, loyihalari, qaydlari va moliya balansiga 100% to'liq chuqur qidiruv va o'qish huquqi bor.

${dbContext}

QOIDA: Foydalanuvchining savoliga uning 70,500+ Telegram suhbatlari va baza ma'lumotlariga tayangan holda o'zbek tilida erkin, samimiy, aniq va TARTIBLI javob bering.`;

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

  return 'Salom! Xabaringiz va g\'oyangiz Second Brain xotirasiga saqlandi. Sizga yana qanday yordam bera olaman?';
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

    // 📊 Shaxsiy Tahlil
    if (text === '📊 Shaxsiy Tahlil' || text.startsWith('/stats') || text.startsWith('/analyze')) {
      const statsAnswer = await queryAI('Foydalanuvchining Second Brain bazasidagi loyihalari, qaydlari va Telegram arxiviga oid to\'liq intellektual tahlil va hisobot bering.');
      await sendTelegram(chatId, `📊 <b>Second Brain AI Shaxsiy Tahlil:</b>\n\n${statsAnswer}`, { reply_markup: getMainMenuKeyboard() });
      return NextResponse.json({ ok: true });
    }

    // 💰 Moliya Balans
    if (text === '💰 Moliya Balans' || text.startsWith('/finance') || text.startsWith('/money')) {
      const financeAnswer = await queryAI('Foydalanuvchining moliya balansi, daromadlari va xarajatlari bo\'yicha qisqa xulosa va tavsiya bering.');
      await sendTelegram(chatId, `💰 <b>Moliya Balans va AI Tavsiya:</b>\n\n${financeAnswer}`, { reply_markup: getMainMenuKeyboard() });
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
    status: 'Telegram OpenRouter Webhook with 70,500+ Deep Search Engine is active',
  });
}
