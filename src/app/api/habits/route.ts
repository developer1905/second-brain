import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const habits = await prisma.habit.findMany({
      include: {
        logs: {
          orderBy: { date: 'desc' },
          take: 14,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const todayStr = new Date().toISOString().split('T')[0];

    const habitsWithStatus = habits.map((h) => {
      const isCompletedToday = h.logs.some((l) => l.date === todayStr && l.completed);
      return {
        ...h,
        isCompletedToday,
      };
    });

    return NextResponse.json({
      habits: habitsWithStatus,
      todayDate: todayStr,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, habitId, title, category, frequency, targetDays, icon, date } = body;

    if (action === 'toggle') {
      if (!habitId) {
        return NextResponse.json({ error: 'habitId shart!' }, { status: 400 });
      }

      const logDate = date || new Date().toISOString().split('T')[0];

      // Check if log exists
      const existingLog = await prisma.habitLog.findFirst({
        where: { habitId, date: logDate },
      });

      let isNowCompleted = true;
      if (existingLog) {
        // Toggle completed status
        isNowCompleted = !existingLog.completed;
        await prisma.habitLog.update({
          where: { id: existingLog.id },
          data: { completed: isNowCompleted },
        });
      } else {
        await prisma.habitLog.create({
          data: {
            habitId,
            date: logDate,
            completed: true,
          },
        });
      }

      // Calculate streak count
      const allCompletedLogs = await prisma.habitLog.findMany({
        where: { habitId, completed: true },
        select: { date: true },
      });

      const completedDatesSet = new Set(allCompletedLogs.map((l) => l.date));
      let currentStreak = 0;
      const checkDate = new Date();
      const maxDays = 365; // safety limit

      for (let i = 0; i < maxDays; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (completedDatesSet.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (i === 0) {
          // Today not completed yet — check from yesterday
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      await prisma.habit.update({
        where: { id: habitId },
        data: { streakCount: currentStreak },
      });

      return NextResponse.json({ success: true, completed: isNowCompleted, streakCount: currentStreak });
    }

    // Create habit
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Odat nomi kiritilishi shart!' }, { status: 400 });
    }

    const habit = await prisma.habit.create({
      data: {
        title: title.trim(),
        category: category || 'Soha',
        frequency: frequency || 'DAILY',
        targetDays: Number(targetDays) || 7,
        icon: icon || 'Flame',
      },
    });

    return NextResponse.json(habit);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID kiritilmagan' }, { status: 400 });
    }

    await prisma.habit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
