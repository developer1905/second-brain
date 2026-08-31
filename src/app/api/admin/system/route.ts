import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [
      notesCount,
      projectsCount,
      areasCount,
      resourcesCount,
      habitsCount,
      booksCount,
      reposCount,
      telegramCount,
      txCount,
      usersCount,
    ] = await Promise.all([
      prisma.note.count(),
      prisma.project.count(),
      prisma.area.count(),
      prisma.resource.count(),
      prisma.habit.count(),
      prisma.book.count(),
      prisma.githubRepo.count(),
      prisma.telegramMessage.count(),
      prisma.transaction.count(),
      prisma.user.count(),
    ]);

    // Database file size in MB
    let dbSizeMB = '0.0';
    try {
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        dbSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      }
    } catch (e) {}

    // API Keys status check
    const groqKey = process.env.GROQ_API_KEY ? 'Ornatilgan' : 'Default Aktiv';
    const geminiKey = process.env.GEMINI_API_KEY ? 'Ornatilgan' : 'Default Aktiv';
    const openrouterKey = process.env.OPENROUTER_API_KEY ? 'Ornatilgan' : 'Default Aktiv';
    const botToken = process.env.TELEGRAM_BOT_TOKEN ? 'Telegram Bot Faol' : 'Sozlanmagan';

    return NextResponse.json({
      success: true,
      stats: {
        notesCount,
        projectsCount,
        areasCount,
        resourcesCount,
        habitsCount,
        booksCount,
        reposCount,
        telegramCount,
        txCount,
        usersCount,
        dbSizeMB,
      },
      apiStatus: {
        groqKey,
        geminiKey,
        openrouterKey,
        botToken,
      },
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    if (action === 'vacuum') {
      await prisma.$executeRawUnsafe('VACUUM;');
      return NextResponse.json({ success: true, message: 'Baza optimalizatsiya qilindi (VACUUM).' });
    }

    if (action === 'clear_test_data') {
      await prisma.telegramMessage.deleteMany({ where: { text: { contains: 'test' } } });
      return NextResponse.json({ success: true, message: 'Test xabarlari tozalandi.' });
    }

    return NextResponse.json({ error: 'Nomalum amal' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
