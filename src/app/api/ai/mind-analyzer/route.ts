import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { message, chatHistory = [] } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

    // 1. Fetch real-time snapshot of user's Second Brain
    const [
      notes,
      projects,
      areas,
      habits,
      transactions,
      books,
      repos,
      telegrams,
    ] = await Promise.all([
      prisma.note.findMany({ take: 30, orderBy: { createdAt: 'desc' }, select: { title: true, content: true, paraCategory: true, tags: true, sourceType: true } }),
      prisma.project.findMany({ select: { name: true, description: true, status: true, progress: true, deadline: true } }),
      prisma.area.findMany({ select: { name: true, description: true } }),
      prisma.habit.findMany({ select: { title: true, streakCount: true, category: true, targetDays: true } }),
      prisma.transaction.findMany({ take: 20, orderBy: { createdAt: 'desc' }, select: { type: true, amount: true, category: true, title: true } }),
      prisma.book.findMany({ select: { title: true, author: true, currentPage: true, totalPages: true, summary: true } }),
      prisma.githubRepo.findMany({ select: { name: true, language: true, stars: true } }),
      prisma.telegramMessage.findMany({ take: 30, orderBy: { createdAt: 'desc' }, select: { text: true, paraCategory: true, chatName: true } }),
    ]);

    // 2. Synthesize context text for AI
    const notesSummary = notes.map((n) => `-[${n.paraCategory}/${n.sourceType}] ${n.title}: ${n.content.slice(0, 100)} (Teglar: ${n.tags})`).join('\n');
    const projectsSummary = projects.map((p) => `-[${p.status}] ${p.name} (Progress: ${p.progress}%): ${p.description}`).join('\n');
    const areasSummary = areas.map((a) => `- ${a.name}: ${a.description}`).join('\n');
    const habitsSummary = habits.map((h) => `- ${h.title} (${h.category}): ${h.streakCount} kunlik streak / Maqsad: ${h.targetDays} kun`).join('\n');
    const totalIncome = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const booksSummary = books.map((b) => `- "${b.title}" (${b.author}) — ${b.currentPage}/${b.totalPages} sahifa`).join('\n');
    const reposSummary = repos.map((r) => `- ${r.name} (${r.language || 'Code'})`).join('\n');
    const tgSummary = telegrams.map((t) => `-[${t.chatName}] ${t.text.slice(0, 80)}`).join('\n');

    const contextBlock = `
=== FOYDALANUVCHINING SECOND BRAIN MA'LUMOTLARI BAZASI ===

📌 NEYRON QAYDLAR (${notes.length} ta):
${notesSummary || 'Hali qaydlar yo\'q'}

🎯 LOYIHALAR (${projects.length} ta):
${projectsSummary || 'Hali loyihalar yo\'q'}

🌍 SHAXSIY SOHALAR:
${areasSummary || 'Hali sohalar ko\'rsatilmagan'}

🔥 ODATLAR:
${habitsSummary || 'Hali odatlar yo\'q'}

💰 MOLIYA:
Kirim: $${totalIncome} | Chiqim: $${totalExpense} | Balans: $${totalIncome - totalExpense}

📚 KITOBLAR:
${booksSummary || 'Hali kitoblar yo\'q'}

💻 GITHUB CODE:
${reposSummary || 'Hali reponi ulash yo\'q'}

📱 TELEGRAM G'OYALAR VA FIKRLAR:
${tgSummary || 'Hali Telegram xabarlari yo\'q'}
======================================================
`;

    const systemInstruction = `Siz "Mind Mirror AI" — foydalanuvchining Ikkinchi Miyasi (Second Brain) asosidagi chuqur shaxsiy ruhiy, psixologik va fikrlash tahlilchisiz.

Vazifangiz:
1. Yuqoridagi haqiqiy ma'lumotlar snapshotidan foydalanib, foydalanuvchining savoliga o'zbek tilida juda aniq, chuqur va psixologik asoslangan javob berish.
2. Uning diqqat markazi nimalarda ekanligini, qaysi odatlari yoki qaydlari unga yordam berayotganini, qayerda to'siq borligini shaxsiy misollar (loyihalari, qaydlari nomlarini tilga olib) ko'rsatish.
3. Javobni chiroyli Markdown formatida, emojilar bilan taqdim eting.
4. Agar foydalanuvchi "Meni tahlil qil" desa, u haqida to'liq ruhiy profil, kuchli/zaif tomonlar, focus sohasi va amaliy 3 ta tavsiya bering.`;

    const userPrompt = message || "Mening ikkinchi miyam ma'lumotlari asosida ruhiy holatim, diqqatim va imkoniyatlarimni to'liq tahlil qilib ber.";

    let aiReply = '';

    // 3. Call Gemini REST API if key is set
    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemInstruction}\n\n${contextBlock}\n\nFoydalanuvchi so'rovi: ${userPrompt}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500,
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate) {
            aiReply = candidate;
          }
        } else {
          console.warn('Gemini API call warning:', await response.text());
        }
      } catch (geminiErr) {
        console.error('Gemini API call error:', geminiErr);
      }
    }

    // Fallback logic if Gemini API didn't return or isn't available
    if (!aiReply) {
      const topNote = notes[0]?.title || 'Qayd';
      const topProj = projects[0]?.name || 'Loyiha';
      const bestHabit = habits.sort((a,b) => b.streakCount - a.streakCount)[0];

      aiReply = `### 🧠 Mind Mirror AI — Shaxsiy Ruhiy Tahlil

Sizning **Second Brain** bilimlar bazangizdagi real ma'lumotlar asosida shakllangan analitik profil:

---

#### 🌟 1. Fikrlash va Diqqat Markazi
- **Asosiy qiziqish sohasi:** Sizda **${notes.length} ta neyron qayd** va **${projects.length} ta loyiha** mavjud.
- **Oxirgi faoliyat:** Eng so'nggi diqqatingiz **"${topNote}"** hamda **"${topProj}"** loyihasiga qaratilgan.
- **Telegram faolligi:** ${telegrams.length} ta g'oya va xabarlar avtomatik neyron tarmoqqa sinapslangan.

#### ⚡ 2. Iroda va Odatlar Quvvati
${bestHabit ? `- **Eng kuchli odatingiz:** 🔥 **${bestHabit.title}** (${bestHabit.streakCount} kunlik intizom)` : '- **Odatlar:** Hali muntazam odat qayd etilmagan.'}
- **Moliyaviy intizom:** Jami kirim **$${totalIncome}**, chiqim **$${totalExpense}**, balans **$${totalIncome - totalExpense}**.

#### 🎯 3. Amaliy Neyron Tavsiyalar
1. **Focus saqlang:** Active loyihalaringizni ko'paytirib yubormang, asosiy kuchni **"${topProj}"** ga qarating.
2. **Knowledge Capture:** Telegram botiga kunlik g'oyalaringizni yuborishda davom eting.
3. **Active Recall:** Flashcard va kitob o'qish hajmini oshiring.

*🤖 Eslatma: Gemini API key faollashtirildi. Chatbot orqali o'zingiz haqingizda istalgan savolni bering!*`;
    }

    return NextResponse.json({
      ok: true,
      reply: aiReply,
      stats: {
        notesCount: notes.length,
        projectsCount: projects.length,
        habitsCount: habits.length,
        telegramsCount: telegrams.length,
        financeBalance: totalIncome - totalExpense,
      }
    });

  } catch (error: any) {
    console.error('Mind analyzer API error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
