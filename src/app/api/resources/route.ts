import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [resources, books, repos, telegrams, noteResources] = await Promise.all([
      prisma.resource.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.book.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.githubRepo.findMany({
        take: 100,
        orderBy: { syncedAt: 'desc' },
      }),
      prisma.telegramMessage.findMany({
        where: {
          OR: [
            { mediaType: 'link' },
            { paraCategory: 'RESOURCE' },
            { text: { contains: 'http' } },
          ],
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.note.findMany({
        where: {
          OR: [
            { paraCategory: 'RESOURCE' },
            { externalUrl: { not: null } },
            { sourceType: { in: ['BOOK', 'GITHUB', 'TELEGRAM'] } },
          ],
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const formattedBooks = books.map((b) => ({
      id: `book-${b.id}`,
      title: `${b.title} (${b.author})`,
      type: 'BOOK',
      url: null,
      summary: b.summary || `Kitob: ${b.title}. Jami ${b.totalPages} sahifa.`,
      content: b.highlights,
      tags: `Kitob,${b.fileType},${b.author.replace(/\s+/g, '')}`,
      createdAt: b.createdAt.toISOString(),
    }));

    const formattedRepos = repos.map((g) => ({
      id: `github-${g.id}`,
      title: g.fullName || g.name,
      type: 'GITHUB',
      url: g.url,
      summary: g.description || `GitHub repozitoriyasi: ${g.name}. ⭐ ${g.stars} stars.`,
      content: g.readmeContent,
      tags: `GitHub,${g.language || 'Code'},Repozitoriya`,
      createdAt: g.syncedAt.toISOString(),
    }));

    const formattedTelegrams = telegrams.map((t) => ({
      id: `telegram-${t.id}`,
      title: `Telegram [${t.chatName}]: ${t.text.slice(0, 40)}...`,
      type: 'TELEGRAM',
      url: t.text.match(/https?:\/\/[^\s]+/)?.[0] || null,
      summary: t.text,
      content: t.text,
      tags: `Telegram,${t.chatName.replace(/\s+/g, '')}`,
      createdAt: t.createdAt.toISOString(),
    }));

    const formattedNotes = noteResources.map((n) => ({
      id: `note-${n.id}`,
      title: n.title,
      type: (n.sourceType as any) || 'ARTICLE',
      url: n.externalUrl || null,
      summary: n.content.length > 160 ? n.content.substring(0, 160) + '...' : n.content,
      content: n.content,
      tags: n.tags || 'Qayd,Resurs',
      createdAt: n.createdAt.toISOString(),
    }));

    // Deduplicate items by title to avoid redundant entries
    const combined = [...resources.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })), ...formattedBooks, ...formattedRepos, ...formattedTelegrams, ...formattedNotes];
    const seenTitles = new Set<string>();
    const unique = combined.filter((item) => {
      const lower = item.title.toLowerCase().trim();
      if (seenTitles.has(lower)) return false;
      seenTitles.add(lower);
      return true;
    });

    return NextResponse.json(unique);
  } catch (error: any) {
    console.error('Resources GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type, url, summary, content, tags } = body;

    if (!title || !summary) {
      return NextResponse.json({ error: "Sarlavha va anotaatsiya kiritilishi shart!" }, { status: 400 });
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        type: type || 'ARTICLE',
        url: url || null,
        summary,
        content: content || null,
        tags: tags || 'Resurs',
      },
    });

    return NextResponse.json(resource);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
