import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Extract [[Note Title]] references from text
function extractBacklinks(content: string): string[] {
  const regex = /\[\[(.*?)\]\]/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1] && match[1].trim()) {
      matches.push(match[1].trim());
    }
  }
  return Array.from(new Set(matches));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = {};
    if (category === 'ARCHIVE') {
      where.OR = [
        { paraCategory: 'ARCHIVE' },
        { isArchived: true }
      ];
    } else if (category) {
      where.paraCategory = category;
    }
    if (search) {
      const searchWhere = [
        { title: { contains: search } },
        { content: { contains: search } },
        { tags: { contains: search } },
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchWhere }
        ];
        delete where.OR;
      } else {
        where.OR = searchWhere;
      }
    }

    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : (search ? 200 : 300);

    const notes = await prisma.note.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        project: { select: { name: true } },
        area: { select: { name: true } },
        _count: {
          select: { incomingEdges: true, outgoingEdges: true }
        }
      }
    });

    return NextResponse.json(notes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, paraCategory, sourceType, tags, projectId, areaId, externalUrl } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Sarlavha va kontent kiritilishi shart!" }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        paraCategory: paraCategory || 'RESOURCE',
        sourceType: sourceType || 'NOTE',
        tags: tags || 'Qayd',
        projectId: projectId || null,
        areaId: areaId || null,
        externalUrl: externalUrl || null,
      },
    });

    // Detect and process [[Backlinks]]
    const linkedTitles = extractBacklinks(content);
    if (linkedTitles.length > 0) {
      const targetNotes = await prisma.note.findMany({
        where: {
          title: { in: linkedTitles },
          id: { not: note.id },
        },
      });

      for (const targetNote of targetNotes) {
        await prisma.backlinkEdge.create({
          data: {
            sourceId: note.id,
            targetId: targetNote.id,
            label: 'backlink',
          },
        });
      }
    }

    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
