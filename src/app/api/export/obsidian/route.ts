import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'note';
}

function noteToMarkdown(note: {
  title: string;
  content: string;
  paraCategory: string;
  sourceType: string;
  tags?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): string {
  const tagsList = note.tags
    ? note.tags
        .split(',')
        .map((t) => `"${t.trim()}"`)
        .join(', ')
    : '';

  const frontmatter = [
    '---',
    `title: "${note.title.replace(/"/g, '\\"')}"`,
    `category: ${note.paraCategory}`,
    `source: ${note.sourceType}`,
    `tags: [${tagsList}]`,
    `created: ${note.createdAt.toISOString()}`,
    `updated: ${note.updatedAt.toISOString()}`,
    '---',
    '',
  ].join('\n');

  return frontmatter + note.content;
}

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const exportData = notes.map((n) => ({
      filename: `${slugify(n.title)}.md`,
      title: n.title,
      content: noteToMarkdown(n),
    }));

    return NextResponse.json({
      ok: true,
      count: exportData.length,
      notes: exportData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
