import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        area: true,
        tasks: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { notes: true },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, deadline, tags, areaId } = body;

    if (!name) {
      return NextResponse.json({ error: "Loyiha nomi kiritilishi shart!" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || '',
        deadline: deadline || null,
        tags: tags || 'Loyiha',
        areaId: areaId || null,
      },
    });

    return NextResponse.json(project);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, progress, isArchived, name, description } = body;

    if (!id) {
      return NextResponse.json({ error: "Loyiha ID kiritilmagan" }, { status: 400 });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(progress !== undefined && { progress }),
        ...(isArchived !== undefined && { isArchived }),
        ...(name && { name }),
        ...(description && { description }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
