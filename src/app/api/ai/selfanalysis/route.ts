import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/ai/selfanalysis — generates a personal profile analysis
export async function GET() {
  try {
    const [
      notes,
      projects,
      areas,
      habits,
      transactions,
      flashcards,
      telegramMessages,
      books,
      repos,
    ] = await Promise.all([
      prisma.note.findMany({ select: { paraCategory: true, tags: true, sourceType: true, createdAt: true } }),
      prisma.project.findMany({ select: { status: true, progress: true, isArchived: true, tags: true } }),
      prisma.area.findMany({ select: { name: true } }),
      prisma.habit.findMany({ select: { title: true, streakCount: true, category: true, targetDays: true } }),
      prisma.transaction.findMany({ select: { type: true, amount: true, category: true } }),
      prisma.flashcard.findMany({ select: { difficulty: true, reviewCount: true } }),
      prisma.telegramMessage.findMany({ take: 500, orderBy: { createdAt: 'desc' }, select: { paraCategory: true, text: true, createdAt: true } }),
      prisma.book.findMany({ select: { title: true, author: true, totalPages: true, currentPage: true } }),
      prisma.githubRepo.findMany({ select: { name: true, language: true, stars: true } }),
    ]);

    // ── Compute statistics ────────────────────────────────────────────────────
    const totalNotes      = notes.length;
    const totalProjects   = projects.length;
    const activeProjects  = projects.filter((p) => !p.isArchived && p.status !== 'DONE').length;
    const doneProjects    = projects.filter((p) => p.status === 'DONE').length;
    const avgProgress     = projects.length > 0
      ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
      : 0;

    // Top tags from notes
    const tagCount: Record<string, number> = {};
    notes.forEach((n) => {
      (n.tags || '').split(',').forEach((t) => {
        const tag = t.trim().toLowerCase();
        if (tag && tag.length > 1) tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    // Habits analysis
    const activeHabits   = habits.filter((h) => h.streakCount >= 1);
    const bestHabit      = [...habits].sort((a, b) => b.streakCount - a.streakCount)[0];
    const avgStreak      = habits.length > 0
      ? Math.round(habits.reduce((s, h) => s + h.streakCount, 0) / habits.length)
      : 0;

    // Finance analysis
    const totalIncome  = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const balance      = totalIncome - totalExpense;
    const topExpCat: Record<string, number> = {};
    transactions.filter((t) => t.type === 'EXPENSE').forEach((t) => {
      topExpCat[t.category] = (topExpCat[t.category] || 0) + t.amount;
    });
    const topExpense = Object.entries(topExpCat).sort(([, a], [, b]) => b - a)[0];

    // Flashcard stats
    const masteredCards = flashcards.filter((fc) => (fc.reviewCount || 0) >= 5).length;
    const flashcardScore = flashcards.length > 0
      ? Math.round((masteredCards / flashcards.length) * 100)
      : 0;

    // Source type distribution
    const sourceTypes: Record<string, number> = {};
    notes.forEach((n) => {
      sourceTypes[n.sourceType] = (sourceTypes[n.sourceType] || 0) + 1;
    });

    // Telegram activity
    const tgThisWeek = telegramMessages.filter((m) => {
      const d = new Date(m.createdAt);
      const now = new Date();
      return (now.getTime() - d.getTime()) < 7 * 24 * 3600 * 1000;
    }).length;

    // Learning focus from top books/repos
    const topLangs: Record<string, number> = {};
    repos.forEach((r) => {
      if (r.language) topLangs[r.language] = (topLangs[r.language] || 0) + 1;
    });
    const topLang = Object.entries(topLangs).sort(([, a], [, b]) => b - a)[0];

    // ── Generate AI insight text ──────────────────────────────────────────────
    const insights: string[] = [];

    // Productivity score (0-100)
    let productivityScore = 0;
    if (totalNotes > 10)     productivityScore += 20;
    if (activeProjects > 0)  productivityScore += 15;
    if (doneProjects > 0)    productivityScore += 10;
    if (avgStreak > 7)       productivityScore += 20;
    if (tgThisWeek > 5)      productivityScore += 10;
    if (flashcardScore > 50) productivityScore += 15;
    if (balance > 0)         productivityScore += 10;
    productivityScore = Math.min(100, productivityScore);

    // Strengths
    const strengths: string[] = [];
    if (totalNotes > 20)      strengths.push('📝 Faol yozuvchi — ' + totalNotes + ' ta qayd');
    if (avgStreak > 7)        strengths.push(`🔥 Odat quvvati: ${bestHabit?.title || 'odat'} (${bestHabit?.streakCount || 0} kun streak)`);
    if (doneProjects > 0)     strengths.push(`✅ ${doneProjects} ta loyiha yakunlangan`);
    if (flashcardScore > 60)  strengths.push(`🧠 Flashcard o'rganish: ${flashcardScore}% mukammal`);
    if (repos.length > 0)     strengths.push(`💻 GitHub: ${repos.length} ta repo, asosiy til: ${topLang?.[0] || 'N/A'}`);
    const booksReadCount = books.filter((b) => b.currentPage > 0 && b.totalPages > 0 && b.currentPage >= b.totalPages).length;
    if (booksReadCount > 0)
      strengths.push(`📚 ${booksReadCount} ta kitob o'qilgan`);

    // Weaknesses
    const improvements: string[] = [];
    if (activeProjects > 5)   improvements.push(`⚠️ ${activeProjects} ta faol loyiha — focus qiling`);
    if (avgStreak < 3)        improvements.push('🔄 Odat ko\'rsatkichi past — kunlik muntazamlik kerak');
    if (flashcardScore < 40)  improvements.push('📊 Flashcard mashqlari kam — active recall ni kuchaytiring');
    if (balance < 0)          improvements.push('💸 Moliyaviy balans manfiy — chiqimlarni nazorat qiling');
    if (tgThisWeek < 3)       improvements.push('📱 Telegram faolligi kam — g\'oyalarni darhol yozing');
    if (totalNotes < 5)       improvements.push('📝 Qayd yozish odatini shakllantiring');

    // Weekly activity (last 7 days notes)
    const now = new Date();
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toISOString().substring(0, 10);
      const count  = notes.filter((n) => n.createdAt.toISOString().startsWith(dayStr)).length;
      return { day: d.toLocaleDateString('uz-UZ', { weekday: 'short' }), count };
    });

    const analysis = {
      productivityScore,
      totalNotes,
      totalProjects,
      activeProjects,
      doneProjects,
      avgProjectProgress: avgProgress,
      topTags,
      habits: {
        total: habits.length,
        active: activeHabits.length,
        avgStreak,
        best: bestHabit ? { title: bestHabit.title, streak: bestHabit.streakCount } : null,
      },
      finance: {
        totalIncome: Math.round(totalIncome),
        totalExpense: Math.round(totalExpense),
        balance: Math.round(balance),
        topExpenseCategory: topExpense ? { name: topExpense[0], amount: Math.round(topExpense[1]) } : null,
      },
      learning: {
        flashcards: flashcards.length,
        masteredCards,
        flashcardScore,
        booksRead: books.filter((b) => b.currentPage > 0 && b.totalPages > 0 && b.currentPage >= b.totalPages).length,
        totalBooks: books.length,
        githubRepos: repos.length,
        topLanguage: topLang?.[0] || null,
      },
      telegram: {
        total: telegramMessages.length,
        thisWeek: tgThisWeek,
      },
      areas: areas.map((a) => a.name),
      sourceTypes,
      weeklyActivity,
      strengths,
      improvements,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, analysis });
  } catch (error: any) {
    console.error('Self-analysis error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
