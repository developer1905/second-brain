import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, category, sourceType, tags, audioData } = body;

    if (!content && !title) {
      return NextResponse.json({ error: "Eslatma matni yoki sarlavha bo'sh bo'lishi mumkin emas!" }, { status: 400 });
    }

    const noteTitle = title || (sourceType === 'VOICE' 
      ? `Ovozli Eslatma (${new Date().toLocaleTimeString('uz-UZ')})` 
      : `Tezkor Qayd (${new Date().toLocaleDateString('uz-UZ')})`);

    const noteContent = content || (audioData ? `[Ovozli xabar saqlandi - ${Math.round(audioData.length / 1024)} KB audio fayl]` : '');

    const note = await prisma.note.create({
      data: {
        title: noteTitle,
        content: noteContent,
        paraCategory: category || 'RESOURCE',
        sourceType: sourceType || (audioData ? 'VOICE' : 'NOTE'),
        tags: tags || (sourceType === 'VOICE' ? 'Ovozli,Tezkor' : 'Tezkor,Qayd'),
      },
    });

    // Check for backlinks [[Title]]
    const regex = /\[\[(.*?)\]\]/g;
    const linkedTitles: string[] = [];
    let match;
    while ((match = regex.exec(noteContent)) !== null) {
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
            label: 'tezkor_ulanish',
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tezkor eslatma neyron bilimlar bazasiga muvaffaqiyatli saqlandi!",
      note,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
