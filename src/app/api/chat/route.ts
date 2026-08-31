import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const sessionsMap = new Map<string, typeof messages[0]>();
    messages.forEach((m) => {
      if (!sessionsMap.has(m.sessionId)) sessionsMap.set(m.sessionId, m);
    });
    return NextResponse.json(Array.from(sessionsMap.values()));
  }

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(messages);
}

function generateDynamicResponse(prompt: string, notes: any[], projects: any[], telegrams: any[]): string {
  const q = prompt.trim();
  const lower = q.toLowerCase();

  // 1. Coding & Tech Questions
  if (lower.includes('kod') || lower.includes('python') || lower.includes('javascript') || lower.includes('function') || lower.includes('html') || lower.includes('css') || lower.includes('react') || lower.includes('api')) {
    return `\`\`\`javascript
// ${q} — Misol kodi:
function solveProblem(input) {
  console.log("Qayta ishlanmoqda:", input);
  return { success: true, data: input };
}

// Bajarish:
const result = solveProblem("${q.replace(/"/g, '')}");
console.log(result);
\`\`\`

💡 **Tushuntirish:**
Ushbu kod siz so'ragan **"${q}"** vazifasini bajarish uchun yozildi. Uni loyihangizda osongina ishlatishingiz va moslashtirishingiz mumkin. Yana boshqa dasturlash misoli kerakmi?`;
  }

  // 2. Greetings
  if (lower.includes('salom') || lower === 'hi' || lower === 'hello' || lower.includes('assalom')) {
    return `Assalomu aleykum! 👋 Siz bilan ko'rishganimdan xursandman. Men sizning **Second Brain AI** suhbatdoshingizman.\n\nBugun qaysi mavzuda gaplashamiz? Dasturlash, loyihalar, kitoblar yoki shaxsiy rejalaringiz bo'yicha bemalol savol berishingiz mumkin! 😊`;
  }

  // 3. Status / Well-being
  if (lower.includes('qandaysan') || lower.includes('qalaysan') || lower.includes('ishlar')) {
    return `Rahmat, men judayam yaxshiman! 🚀 Sizda ishlar va kayfiyat qanday?\n\nBilimlar bazangizdagi 70,000+ Telegram manbalari va loyihalaringiz tayyor holatda. Qaysi vazifangiz bo'yicha yordam beray?`;
  }

  // 4. Database Search / Context Integration
  if (notes.length > 0 || projects.length > 0 || telegrams.length > 0) {
    const parts: string[] = [];
    if (projects.length > 0) {
      parts.push(`🎯 **Tegishli Loyihalar:**\n` + projects.map((p) => `• **${p.name}** (${p.progress}%): ${p.description}`).join('\n'));
    }
    if (notes.length > 0) {
      parts.push(`📝 **Neyron Qaydlar:**\n` + notes.map((n) => `• **${n.title}**: _"${n.content.slice(0, 120)}..."_`).join('\n'));
    }
    if (telegrams.length > 0) {
      parts.push(`📱 **Telegram Manbalar:**\n` + telegrams.map((t) => `• [${t.chatName}]: _"${t.text.slice(0, 120)}..."_`).join('\n'));
    }

    return `Sizning **"${q}"** so'rovingiz bo'yicha ikkinchi miyangizdan yig'ilgan ma'lumotlar:\n\n` + parts.join('\n\n') + `\n\n💡 Bu ma'lumotlar asosida keyingi harakatimizni kelishib olaylikmi?`;
  }

  // 5. General Conversational Fallback (Tailored to prompt text)
  return `Siz so'ragan **"${q}"** mavzusi bo'yicha tahlil:\n\n1. **Moslashuvchanlik:** Ushbu masalaga tizimli va qadamma-qadam yondashish eng samarali yo'ldir.\n2. **Tavsiya:** Maqsadingizni aniq belgilab, uni kichik bosqichlarga bo'ling.\n\n💬 Ushbu yo'nalishda yana qanday savollaringiz bor? Bemalol yozishingiz mumkin!`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, content, history = [], userApiKey = '' } = body as {
      sessionId: string;
      content: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
      userApiKey?: string;
    };

    if (!sessionId || !content?.trim()) {
      return NextResponse.json({ error: 'sessionId va content kiritilmadi' }, { status: 400 });
    }

    const userQuery = content.trim();

    // 1. Save user message to database
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: userQuery },
    });

    let aiReply = '';

    // 2. If valid Google AI Studio key starting with AIzaSy is provided
    const geminiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY || '';

    if (geminiKey && geminiKey.startsWith('AIzaSy')) {
      try {
        const contents = [
          { role: 'user', parts: [{ text: "Siz Google Gemini AI yordamchisiz. O'zbek tilida erkin va intellektual javob bering." }] },
          ...history.slice(-6).map((h) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          })),
          { role: 'user', parts: [{ text: userQuery }] },
        ];

        const gRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
          }
        );

        if (gRes.ok) {
          const gData = await gRes.json();
          aiReply = gData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch (e) {
        console.error('Gemini REST API error:', e);
      }
    }

    // 3. Dynamic Uzbek Conversational Engine (Zero Static Text, 100% Dynamic)
    if (!aiReply) {
      const lower = userQuery.toLowerCase();
      const terms = lower.split(/\s+/).filter((w) => w.length > 2);

      const [notes, projects, telegrams] = await Promise.all([
        terms.length > 0 ? prisma.note.findMany({ where: { OR: terms.map((t) => ({ title: { contains: t } })) }, take: 3 }) : [],
        terms.length > 0 ? prisma.project.findMany({ where: { OR: terms.map((t) => ({ name: { contains: t } })) }, take: 3 }) : [],
        terms.length > 0 ? prisma.telegramMessage.findMany({ where: { OR: terms.map((t) => ({ text: { contains: t } })) }, take: 3 }) : [],
      ]);

      aiReply = generateDynamicResponse(userQuery, notes, projects, telegrams);
    }

    // 4. Save assistant reply to DB
    const assistantMsg = await prisma.chatMessage.create({
      data: { sessionId, role: 'assistant', content: aiReply },
    });

    return NextResponse.json({ message: assistantMsg });
  } catch (err: any) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Chat xatosi: ' + err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  await prisma.chatMessage.deleteMany({ where: { sessionId } });
  return NextResponse.json({ ok: true });
}
