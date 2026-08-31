import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const tasks = await prisma.task.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, projectId, priority, dueDate } = body;

    if (!title || !projectId) {
      return NextResponse.json({ error: "Vazifa nomi va loyiha ID kiritilishi lozim" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        projectId,
        priority: priority || 'MEDIUM',
        dueDate: dueDate || null,
        status: 'TODO',
      },
    });

    // Auto update project progress percentage
    await updateProjectProgress(projectId);

    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, title, priority } = body;

    if (!id) {
      return NextResponse.json({ error: "Vazifa ID topilmadi" }, { status: 400 });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(title && { title }),
        ...(priority && { priority }),
      },
    });

    await updateProjectProgress(task.projectId);

    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID kiritilmagan" }, { status: 400 });
    }

    const task = await prisma.task.delete({
      where: { id },
    });

    await updateProjectProgress(task.projectId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function updateProjectProgress(projectId: string) {
  const tasks = await prisma.task.findMany({ where: { projectId } });
  if (tasks.length === 0) return;

  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  const progressPercent = Math.round((doneCount / tasks.length) * 100);

  await prisma.project.update({
    where: { id: projectId },
    data: { progress: progressPercent },
  });
}
