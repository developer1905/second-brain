import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename, content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: "Fayl kontenti ko'rsatilmadi!" }, { status: 400 });
    }

    // Simple Frontmatter & Markdown Parser
    let title = (filename || 'Imported Note').replace(/\.md$/i, '');
    let category = 'RESOURCE';
    let tags = 'Obsidian,Import';
    let bodyContent = content;

    // Check for Frontmatter YAML header --- ... ---
    const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (yamlMatch) {
      const yamlBlock = yamlMatch[1];
      bodyContent = yamlMatch[2].trim();

      const titleMatch = yamlBlock.match(/title:\s*["']?([^"'\n]+)["']?/i);
      if (titleMatch) title = titleMatch[1];

      const catMatch = yamlBlock.match(/category:\s*["']?([^"'\n]+)["']?/i);
      if (catMatch) {
        const parsedCat = catMatch[1].toUpperCase();
        if (['PROJECT', 'AREA', 'RESOURCE', 'ARCHIVE'].includes(parsedCat)) {
          category = parsedCat;
        }
      }

      const tagsMatch = yamlBlock.match(/tags:\s*\[?([^\]\n]+)\]?/i);
      if (tagsMatch) {
        tags = tagsMatch[1].replace(/["']/g, '').trim();
      }
    }

    // Save Note to Database
    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: bodyContent,
        paraCategory: category as any,
        sourceType: 'NOTE',
        tags: tags,
      },
    });

    return NextResponse.json({
      success: true,
      note,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
