import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(books);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, author, totalPages, summary, highlights, fileType, content } = body;

    if (!title) {
      return NextResponse.json({ error: "Kitob sarlavhasi kiritilishi shart!" }, { status: 400 });
    }

    const highlightsArray = Array.isArray(highlights) 
      ? highlights 
      : (highlights ? highlights.split('\n').filter(Boolean) : []);

    const book = await prisma.book.create({
      data: {
        title,
        author: author || 'Noma\'lum Muallif',
        totalPages: Number(totalPages) || 100,
        currentPage: 0,
        fileType: fileType || 'PDF',
        summary: summary || 'Kitob haqida qisqacha ma\'lumot va anotaatsiyalar.',
        highlights: JSON.stringify(highlightsArray),
      },
    });

    // Create a Resource node in PARA for this book
    const resource = await prisma.resource.create({
      data: {
        title: `Kitob: ${title} (${author || 'Muallif'})`,
        type: 'BOOK',
        summary: summary || `Kitob anotaatsiyasi va ${highlightsArray.length} ta iqtibos`,
        content: content || highlightsArray.join('\n\n'),
        tags: `Kitob,${fileType || 'PDF'},Anotaatsiya`,
      },
    });

    // Create a Note with quotes
    await prisma.note.create({
      data: {
        title: `Iqtiboslar: ${title}`,
        content: `### ${title} - ${author || 'Muallif'}\n\n**Anotaatsiya:** ${summary || 'Mavjud emas'}\n\n**Asosiy Iqtiboslar:**\n` +
          highlightsArray.map((h: string) => `> "${h}"`).join('\n\n'),
        paraCategory: 'RESOURCE',
        sourceType: 'BOOK',
        tags: `Kitob,Iqtibos,${title.replace(/\s+/g, '')}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `"${title}" kitobi va iqtiboslari neyron tarmoqqa muvaffaqiyatli saqlandi!`,
      book,
      resourceId: resource.id,
    });
  } catch (error: any) {
    console.error('Book Ingest Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID kiritilmagan' }, { status: 400 });
    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

