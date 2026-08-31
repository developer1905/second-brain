import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const area = await prisma.area.findUnique({
      where: { id: params.id },
      include: {
        projects: { include: { tasks: true } },
        notes: true,
      },
    });

    if (!area) {
      return NextResponse.json({ error: "Soha topilmadi!" }, { status: 404 });
    }

    return NextResponse.json(area);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, icon, description, metric } = body;

    const updated = await prisma.area.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(icon && { icon }),
        ...(description !== undefined && { description }),
        ...(metric !== undefined && { metric }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.area.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: "Soha o'chirildi!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
