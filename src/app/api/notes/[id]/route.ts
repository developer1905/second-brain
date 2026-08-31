import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const note = await prisma.note.findUnique({
      where: { id: params.id },
      include: {
        project: true,
        area: true,
        incomingEdges: {
          include: { source: true },
        },
        outgoingEdges: {
          include: { target: true },
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Qayd topilmadi!" }, { status: 404 });
    }

    return NextResponse.json(note);
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
    const { title, content, paraCategory, sourceType, tags, isArchived, projectId, areaId } = body;

    const note = await prisma.note.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(paraCategory && { paraCategory }),
        ...(sourceType && { sourceType }),
        ...(tags !== undefined && { tags }),
        ...(isArchived !== undefined && { isArchived }),
        ...(projectId !== undefined && { projectId }),
        ...(areaId !== undefined && { areaId }),
      },
    });

    // Re-sync backlinks if content changed
    if (content) {
      // Remove old outgoing backlink edges
      await prisma.backlinkEdge.deleteMany({
        where: { sourceId: params.id },
      });

      const regex = /\[\[(.*?)\]\]/g;
      const linkedTitles: string[] = [];
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (match[1] && match[1].trim()) {
          linkedTitles.push(match[1].trim());
        }
      }

      if (linkedTitles.length > 0) {
        const targetNotes = await prisma.note.findMany({
          where: {
            title: { in: Array.from(new Set(linkedTitles)) },
            id: { not: params.id },
          },
        });

        for (const targetNote of targetNotes) {
          await prisma.backlinkEdge.create({
            data: {
              sourceId: params.id,
              targetId: targetNote.id,
              label: 'backlink',
            },
          });
        }
      }
    }

    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.note.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
