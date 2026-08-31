import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const areas = await prisma.area.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        projects: true,
        notes: true,
      },
    });

    return NextResponse.json(areas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, icon, description, metric } = body;

    if (!name) {
      return NextResponse.json({ error: "Soha nomi kiritilishi lozim" }, { status: 400 });
    }

    const area = await prisma.area.create({
      data: {
        name,
        icon: icon || 'Briefcase',
        description: description || '',
        metric: metric || '1/1 Loyiha',
      },
    });

    return NextResponse.json(area);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
