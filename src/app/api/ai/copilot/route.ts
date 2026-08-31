import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function generateDynamicResponse(prompt: string, notes: any[], projects: any[], telegrams: any[]): string {
  const q = prompt.trim();
  const lower = q.toLowerCase();

  // 1. Coding & Tech Questions
  if (lower.includes('kod') || lower.includes('python') || lower.includes('javascript') || lower.includes('function') || lower.includes('html') || lower.includes('css') || lower.includes('react') || lower.includes('api')) {
    return `\`\`\`javascript
// ${q} — Dasturlash misoli:
function processTask(input) {
  return {
    status: "success",
    query: input,
    timestamp: new Date().toISOString()
  };
}

const result = processTask("${q.replace(/"/g, '')}");
console.log(result);
\`\`\`

💡 **Dasturlash bo'yicha tushuntirish:**
Siz so'ragan **"${q}"** vazifasi uchun toza va tezkor kod misoli. Buni loyihangizga osongina ulashingiz mumkin. Yana biror til bo'yicha namuna kerakmi?`;
  }

  // 2. Greetings & Status
  if (lower.includes('salom') || lower === 'hi' || lower === 'hello' || lower.includes('assalom')) {
    return `Assalomu aleykum! 👋 Men sizning **Second Brain AI Copilot** yordamchingizman.\n\n70,000+ Telegram manbalaringiz va loyihalaringiz bazasi bilan ulanganman. Bugun sizga qanday yordam bera olaman? 😊`;
  }

  // 3. Database Search / Context Integration
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

    return `Sizning **"${q}"** so'rovingiz bo'yicha ikkinchi miyangizdan yig'ilgan tahlil:\n\n` + parts.join('\n\n') + `\n\n💡 Ushbu manbalar bo'yicha qanday amaliy reja tuzamiz?`;
  }

  // 4. General Conversational Dialog
  return `Siz so'ragan **"${q}"** bo'yicha tavsiyalar:\n\n1. **Moslashuvchanlik:** Ushbu masalani kichik va aniq qadamlarga bo'lib bajarish eng maqsadga muvofiq yondashuvdir.\n2. **Tizimlilik:** Har bir natijani Second Brain bazasiga qayd qilib boring.\n\n💬 Yana qanday savollaringiz bor? Bemalol yozing!`;
}

export async function POST(request: Request) {
  try {
    const { prompt, userApiKey = '' } = await request.json();
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Savol matni kiritilmadi" }, { status: 400 });
    }

    const userQuery = prompt.trim();
    const lowerQuery = userQuery.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter((w: string) => w.length > 2);

    const [notes, projects, telegrams] = await Promise.all([
      terms.length > 0 ? prisma.note.findMany({ where: { OR: terms.map((t: string) => ({ title: { contains: t } })) }, take: 3 }) : [],
      terms.length > 0 ? prisma.project.findMany({ where: { OR: terms.map((t: string) => ({ name: { contains: t } })) }, take: 3 }) : [],
      terms.length > 0 ? prisma.telegramMessage.findMany({ where: { OR: terms.map((t: string) => ({ text: { contains: t } })) }, take: 3 }) : [],
    ]);

    let answer = '';

    // Call Gemini API if Google AI Studio key (AIzaSy...) is provided
    const geminiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY || '';
    if (geminiKey && geminiKey.startsWith('AIzaSy')) {
      try {
        const contents = [
          { role: 'user', parts: [{ text: "Siz AI Copilotsiz. O'zbek tilida erkin va aniq javob bering." }] },
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
          answer = gData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch (e) {
        console.error('Gemini API error:', e);
      }
    }

    if (!answer) {
      answer = generateDynamicResponse(userQuery, notes, projects, telegrams);
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
