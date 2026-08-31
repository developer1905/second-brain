import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, title, category, tags, notes } = body;

    if (!url) {
      return NextResponse.json({ error: "Havola (URL) kiritilishi shart!" }, { status: 400 });
    }

    let parsedTitle = title || '';
    let parsedSummary = notes || '';
    let domain = '';

    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname;

      // Simple fetch page title simulation / parser
      if (!parsedTitle) {
        const res = await fetch(url, { headers: { 'User-Agent': 'SecondBrainBot/1.0' } });
        if (res.ok) {
          const html = await res.text();
          const matchTitle = html.match(/<title>(.*?)<\/title>/i);
          if (matchTitle && matchTitle[1]) {
            parsedTitle = matchTitle[1].trim();
          }
          const matchMeta = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
          if (matchMeta && matchMeta[1] && !parsedSummary) {
            parsedSummary = matchMeta[1].trim();
          }
        }
      }
    } catch (e) {
      console.warn("URL parsing warning:", e);
    }

    if (!parsedTitle) {
      parsedTitle = `Veb Resurs: ${domain || url}`;
    }
    if (!parsedSummary) {
      parsedSummary = `Veb sahifa havolasi: ${url}`;
    }

    // 1. Create Resource entry
    const resource = await prisma.resource.create({
      data: {
        title: parsedTitle,
        type: 'ARTICLE',
        url: url,
        summary: parsedSummary,
        content: `**Havola:** [${url}](${url})\n\n**Domen:** ${domain}\n\n${parsedSummary}`,
        tags: tags || `Web,Link,${domain.replace(/[^a-zA-Z0-9]/g, '')}`,
      },
    });

    // 2. Create Note entry linked to 3D Neural Knowledge Graph
    const note = await prisma.note.create({
      data: {
        title: parsedTitle,
        content: `### 🌐 ${parsedTitle}\n\n**Manba Havolasi:** [${url}](${url})\n\n**Qisqacha Tavsif:** ${parsedSummary}\n\n${notes ? `**Shaxsiy Qaydlar:** ${notes}` : ''}`,
        paraCategory: category || 'RESOURCE',
        sourceType: 'NOTE',
        tags: tags || `Web,Link,${domain}`,
        externalUrl: url,
      },
    });

    // Auto-detect backlinks [[Note Title]]
    const regex = /\[\[(.*?)\]\]/g;
    const linkedTitles: string[] = [];
    let match;
    while ((match = regex.exec(parsedSummary + ' ' + (notes || ''))) !== null) {
      if (match[1] && match[1].trim()) {
        linkedTitles.push(match[1].trim());
      }
    }

    if (linkedTitles.length > 0) {
      const targetNotes = await prisma.note.findMany({
        where: { title: { in: Array.from(new Set(linkedTitles)) }, id: { not: note.id } }
      });
      for (const target of targetNotes) {
        await prisma.backlinkEdge.create({
          data: {
            sourceId: note.id,
            targetId: target.id,
            label: 'web_link_backlink',
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `"${parsedTitle}" havolasi neyron miyaga saqlandi va bog'landi!`,
      resource,
      noteId: note.id,
    });
  } catch (error: any) {
    console.error('URL Ingest error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
