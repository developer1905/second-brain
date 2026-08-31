import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GraphNode, GraphLink } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // mode=full loads everything; default is lightweight
    const mode = searchParams.get('mode') || 'default';
    const isFull = mode === 'full';

    const includeTelegram = searchParams.get('includeTelegram') !== 'false';
    const includeNotes    = searchParams.get('includeNotes')    !== 'false';
    const includeBooks    = searchParams.get('includeBooks')    !== 'false';
    const includeGithub   = searchParams.get('includeGithub')   !== 'false';
    const includeProjects = searchParams.get('includeProjects') !== 'false';
    // Heavy models only in full mode
    const includeHeavy = isFull;

    const limitParam = searchParams.get('limit');
    const customLimit = limitParam ? parseInt(limitParam) : 1000;
    const tgLimit     = limitParam ? Math.min(parseInt(limitParam), 2000) : 500;

    const [
      notes,
      projects,
      areas,
      resources,
      telegrams,
      repos,
      books,
      transactions,
      habits,
      flashcards,
      edges,
    ] = await Promise.all([
      includeNotes
        ? prisma.note.findMany({
            take: customLimit,
            orderBy: { createdAt: 'desc' },
            include: { project: true, area: true },
          })
        : [],
      includeProjects
        ? prisma.project.findMany({ include: { tasks: true, area: true } })
        : [],
      prisma.area.findMany(),
      prisma.resource.findMany({ take: customLimit }),
      includeTelegram
        ? prisma.telegramMessage.findMany({
            take: tgLimit,
            orderBy: { createdAt: 'desc' },
          })
        : [],
      includeGithub ? prisma.githubRepo.findMany() : [],
      includeBooks
        ? prisma.book.findMany({ take: 300 })
        : [],
      prisma.transaction.findMany({ take: customLimit, orderBy: { createdAt: 'desc' } }),
      prisma.habit.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.flashcard.findMany({ take: customLimit, orderBy: { createdAt: 'desc' } }),
      prisma.backlinkEdge.findMany(),
    ]);

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // 1. Projects
    projects.forEach((p) => {
      nodes.push({
        id: `project-${p.id}`,
        label: p.name,
        category: p.isArchived ? 'ARCHIVE' : 'PROJECT',
        sourceType: 'NOTE',
        color: p.isArchived ? '#6c757d' : '#00f3ff',
        val: 16,
        tags: p.tags ? p.tags.split(',') : ['Loyiha'],
        isArchived: p.isArchived,
        details: {
          summary: p.description,
          deadline: p.deadline || undefined,
          progress: p.progress,
          tasksCount: p.tasks.length,
        },
        createdAt: p.createdAt.toISOString(),
      });
      if (p.areaId) {
        links.push({ source: `project-${p.id}`, target: `area-${p.areaId}`, label: 'tegishli_soha', color: '#9d4edd' });
      }
    });

    // 2. Areas
    areas.forEach((a) => {
      nodes.push({
        id: `area-${a.id}`,
        label: a.name,
        category: 'AREA',
        sourceType: 'NOTE',
        color: '#9d4edd',
        val: 20,
        tags: ['Soha', 'Hayotiy'],
        isArchived: false,
        details: { summary: a.description },
        createdAt: a.createdAt.toISOString(),
      });
    });

    // 3. Notes
    notes.forEach((n) => {
      const isVoice = n.sourceType === 'VOICE';
      let nodeColor = isVoice ? '#ff007f' : '#38bdf8';
      if (n.paraCategory === 'RESOURCE') nodeColor = '#ffd166';
      if (n.paraCategory === 'ARCHIVE' || n.isArchived) nodeColor = '#6c757d';

      nodes.push({
        id: `note-${n.id}`,
        label: n.title,
        category: n.isArchived ? 'ARCHIVE' : n.paraCategory,
        sourceType: n.sourceType as any,
        color: nodeColor,
        val: isVoice ? 12 : 10,
        tags: n.tags ? n.tags.split(',') : [],
        isArchived: n.isArchived,
        details: {
          summary: n.content.substring(0, 140) + '...',
          content: n.content,
        },
        createdAt: n.createdAt.toISOString(),
      });

      if (n.projectId) {
        links.push({ source: `note-${n.id}`, target: `project-${n.projectId}`, label: 'loyiha_qaydi', color: '#00f3ff' });
      } else if (n.areaId) {
        links.push({ source: `note-${n.id}`, target: `area-${n.areaId}`, label: 'soha_qaydi', color: '#9d4edd' });
      }
    });

    // 4. Resources
    resources.forEach((r) => {
      nodes.push({
        id: `resource-${r.id}`,
        label: r.title,
        category: 'RESOURCE',
        sourceType: r.type as any,
        color: '#ffd166',
        val: 12,
        tags: r.tags ? r.tags.split(',') : ['Resurs'],
        isArchived: false,
        details: { summary: r.summary, url: r.url || undefined },
        createdAt: r.createdAt.toISOString(),
      });
    });

    // 5. Telegram (limited in default mode)
    telegrams.forEach((t) => {
      const shortText = t.text.substring(0, 30);
      nodes.push({
        id: `telegram-${t.id}`,
        label: `${t.chatName}: ${shortText}${t.text.length > 30 ? '...' : ''}`,
        category: 'RESOURCE',
        sourceType: 'TELEGRAM',
        color: '#0088cc',
        val: 9,
        tags: ['Telegram', t.chatName],
        isArchived: false,
        details: { summary: t.text, chatName: t.chatName },
        createdAt: t.createdAt.toISOString(),
      });
    });

    // 6. GitHub
    repos.forEach((g) => {
      nodes.push({
        id: `github-${g.id}`,
        label: g.name,
        category: 'PROJECT',
        sourceType: 'GITHUB',
        color: '#2ea44f',
        val: 14,
        tags: ['GitHub', g.language || 'Code'],
        isArchived: false,
        details: { summary: g.description || undefined, url: g.url, stars: g.stars },
        createdAt: g.syncedAt.toISOString(),
      });
    });

    // 7. Books
    books.forEach((b) => {
      nodes.push({
        id: `book-${b.id}`,
        label: b.title,
        category: 'RESOURCE',
        sourceType: 'BOOK',
        color: '#ff9f1c',
        val: 15,
        tags: ['Kitob', b.fileType],
        isArchived: false,
        details: { summary: b.summary, author: b.author },
        createdAt: b.createdAt.toISOString(),
      });
    });

    // 8. Finance (full mode only)
    transactions.forEach((tx) => {
      const isIncome = tx.type === 'INCOME';
      const formattedAmount = `${isIncome ? '+' : '-'}$${tx.amount.toLocaleString()}`;
      nodes.push({
        id: `finance-${tx.id}`,
        label: `${isIncome ? '🟢 Kirim' : '🔴 Chiqim'}: ${tx.title} (${formattedAmount})`,
        category: 'RESOURCE',
        sourceType: 'NOTE',
        color: isIncome ? '#10b981' : '#f43f5e',
        val: 14,
        tags: ['Moliya', isIncome ? 'Kirim' : 'Chiqim', tx.category],
        isArchived: false,
        details: { summary: `${tx.category} | ${tx.date} | ${formattedAmount} — ${tx.description || tx.title}` },
        createdAt: tx.createdAt.toISOString(),
      });
    });

    // 9. Habits (full mode only)
    habits.forEach((h) => {
      nodes.push({
        id: `habit-${h.id}`,
        label: `🔥 Odat: ${h.title} (${h.streakCount}d)`,
        category: 'AREA',
        sourceType: 'NOTE',
        color: '#f59e0b',
        val: 14,
        tags: ['Odat', h.category],
        isArchived: false,
        details: { summary: `${h.category} | ${h.streakCount} kunlik streak` },
        createdAt: h.createdAt.toISOString(),
      });
    });

    // 10. Flashcards (full mode only)
    flashcards.forEach((fc) => {
      nodes.push({
        id: `flashcard-${fc.id}`,
        label: `🧠 Flashcard: ${fc.question.slice(0, 25)}...`,
        category: 'RESOURCE',
        sourceType: 'NOTE',
        color: '#8b5cf6',
        val: 12,
        tags: ['Flashcard', 'ActiveRecall'],
        isArchived: false,
        details: { summary: `Savol: ${fc.question} | Javob: ${fc.answer}` },
        createdAt: fc.createdAt.toISOString(),
      });
    });

    // 11. Backlink edges
    edges.forEach((e) => {
      links.push({ source: `note-${e.sourceId}`, target: `note-${e.targetId}`, label: e.label || 'backlink', color: '#a855f7' });
    });

    // Auto-connect nodes with shared tags (limited to avoid n² explosion)
    const tagToNodeIds = new Map<string, string[]>();
    nodes.forEach((n) => {
      n.tags.forEach((tag) => {
        const cleanTag = tag.trim().toLowerCase();
        if (cleanTag && cleanTag.length > 1) {
          if (!tagToNodeIds.has(cleanTag)) tagToNodeIds.set(cleanTag, []);
          tagToNodeIds.get(cleanTag)!.push(n.id);
        }
      });
    });

    const existingLinks = new Set(
      links.flatMap((l) => [`${l.source}->${l.target}`, `${l.target}->${l.source}`])
    );

    tagToNodeIds.forEach((nodeIds, tag) => {
      // Cap at 4 per tag to avoid O(n²) explosion on large datasets
      const maxConnect = Math.min(nodeIds.length, 4);
      for (let i = 0; i < maxConnect; i++) {
        for (let j = i + 1; j < maxConnect; j++) {
          const u = nodeIds[i];
          const v = nodeIds[j];
          const key1 = `${u}->${v}`;
          const key2 = `${v}->${u}`;
          if (!existingLinks.has(key1) && !existingLinks.has(key2)) {
            existingLinks.add(key1);
            existingLinks.add(key2);
            links.push({
              source: u,
              target: v,
              label: `synapse:${tag}`,
              color: tag.includes('telegram') ? '#0088cc' : tag.includes('loyiha') ? '#00f3ff' : '#a855f7',
            });
          }
        }
      }
    });

    const response = NextResponse.json({
      nodes,
      links,
      meta: {
        mode,
        totalNodes: nodes.length,
        totalLinks: links.length,
      },
    });
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    return response;
  } catch (error: any) {
    console.error('Graph API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
