import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = await prisma.memoryItem.findMany({
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, content, tags, source, sourceId, isPinned } = body;
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'title and content required' }, { status: 400 });
  }
  const item = await prisma.memoryItem.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      tags: tags ?? '',
      source: source ?? 'manual',
      sourceId: sourceId ?? null,
      isPinned: isPinned ?? false,
    },
  });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, isPinned, title, content, tags } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const item = await prisma.memoryItem.update({
    where: { id },
    data: {
      ...(isPinned !== undefined && { isPinned }),
      ...(title && { title }),
      ...(content && { content }),
      ...(tags !== undefined && { tags }),
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.memoryItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
