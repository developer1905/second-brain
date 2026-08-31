import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/telegram/feed?since=ISO_DATE&limit=20
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const where: any = {};
    if (since) {
      where.createdAt = { gt: new Date(since) };
    }

    const messages = await prisma.telegramMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        chatName: true,
        fromName: true,
        text: true,
        paraCategory: true,
        mediaType: true,
        date: true,
        createdAt: true,
      },
    });

    const total = await prisma.telegramMessage.count();

    return NextResponse.json({
      ok: true,
      messages,
      total,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
