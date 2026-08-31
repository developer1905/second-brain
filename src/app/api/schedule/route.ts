import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const schedules = await prisma.schedule.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, cronExpr, oneTime, tags } = body;
  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 });

  // Compute nextRun
  let nextRun: string | null = null;
  if (oneTime) {
    nextRun = oneTime;
  } else if (cronExpr) {
    // Basic next run computation for common patterns
    const now = new Date();
    now.setHours(now.getHours() + 1);
    nextRun = now.toISOString();
  }

  const schedule = await prisma.schedule.create({
    data: {
      title: title.trim(),
      description: description ?? '',
      cronExpr: cronExpr ?? null,
      oneTime: oneTime ?? null,
      tags: tags ?? '',
      nextRun,
    },
  });
  return NextResponse.json(schedule);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, isActive, title, description, cronExpr, oneTime, tags } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const schedule = await prisma.schedule.update({
    where: { id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(cronExpr !== undefined && { cronExpr }),
      ...(oneTime !== undefined && { oneTime }),
      ...(tags !== undefined && { tags }),
    },
  });
  return NextResponse.json(schedule);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.schedule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
