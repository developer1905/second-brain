import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/data — Search & inspect raw entity data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'notes'; // notes | projects | telegram
    const query = searchParams.get('query') || '';

    let items: any[] = [];
    if (type === 'notes') {
      items = await prisma.note.findMany({
        where: query ? { title: { contains: query } } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { id: true, title: true, paraCategory: true, sourceType: true, createdAt: true },
      });
    } else if (type === 'projects') {
      items = await prisma.project.findMany({
        where: query ? { name: { contains: query } } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { id: true, name: true, status: true, progress: true, createdAt: true },
      });
    } else if (type === 'telegram') {
      items = await prisma.telegramMessage.findMany({
        where: query ? { text: { contains: query } } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { id: true, fromName: true, text: true, paraCategory: true, createdAt: true },
      });
    }

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/data — Delete any entity by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'type va id kiritilishi shart' }, { status: 400 });
    }

    if (type === 'notes') {
      await prisma.note.delete({ where: { id } });
    } else if (type === 'projects') {
      await prisma.project.delete({ where: { id } });
    } else if (type === 'telegram') {
      await prisma.telegramMessage.delete({ where: { id } });
    }

    return NextResponse.json({ success: true, message: 'O\'chirildi' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
