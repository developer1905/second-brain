import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const type = searchParams.get('type') ?? 'all'; // 'notes'|'projects'|'areas'|'resources'|'all'

  if (!q) return NextResponse.json({ results: [] });

  const results: {
    id: string;
    type: string;
    title: string;
    excerpt: string;
    url: string;
    tags?: string;
    score: number;
  }[] = [];

  const term = q.toLowerCase();

  // Helper: simple relevance score
  const score = (text: string) => {
    const t = text.toLowerCase();
    let s = 0;
    if (t.startsWith(term)) s += 10;
    if (t.includes(term)) s += 5;
    const words = term.split(' ');
    words.forEach(w => { if (t.includes(w)) s += 1; });
    return s;
  };

  if (type === 'all' || type === 'notes') {
    const notes = await prisma.note.findMany({
      where: {
        isArchived: false,
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
          { tags: { contains: q } },
        ],
      },
      take: 15,
    });
    notes.forEach(n => results.push({
      id: n.id,
      type: 'note',
      title: n.title,
      excerpt: n.content.slice(0, 150),
      url: `/notes/${n.id}`,
      tags: n.tags,
      score: score(n.title + ' ' + n.content + ' ' + n.tags),
    }));
  }

  if (type === 'all' || type === 'projects') {
    const projects = await prisma.project.findMany({
      where: {
        isArchived: false,
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
          { tags: { contains: q } },
        ],
      },
      take: 10,
    });
    projects.forEach(p => results.push({
      id: p.id,
      type: 'project',
      title: p.name,
      excerpt: p.description.slice(0, 150),
      url: `/projects/${p.id}`,
      tags: p.tags ?? '',
      score: score(p.name + ' ' + p.description),
    }));
  }

  if (type === 'all' || type === 'areas') {
    const areas = await prisma.area.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
        ],
      },
      take: 8,
    });
    areas.forEach(a => results.push({
      id: a.id,
      type: 'area',
      title: a.name,
      excerpt: a.description.slice(0, 150),
      url: `/areas/${a.id}`,
      score: score(a.name + ' ' + a.description),
    }));
  }

  if (type === 'all' || type === 'resources') {
    const resources = await prisma.resource.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { summary: { contains: q } },
          { tags: { contains: q } },
        ],
      },
      take: 10,
    });
    resources.forEach(r => results.push({
      id: r.id,
      type: 'resource',
      title: r.title,
      excerpt: r.summary.slice(0, 150),
      url: `/resources/${r.id}`,
      tags: r.tags,
      score: score(r.title + ' ' + r.summary),
    }));
  }

  // Sort by relevance score desc
  results.sort((a, b) => b.score - a.score);

  return NextResponse.json({ results: results.slice(0, 30), total: results.length });
}
