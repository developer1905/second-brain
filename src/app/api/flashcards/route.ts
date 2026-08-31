import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const flashcards = await prisma.flashcard.findMany({
      orderBy: [{ nextReview: 'asc' }, { createdAt: 'desc' }],
    });

    const notes = await prisma.note.findMany({
      select: { id: true, title: true },
    });

    return NextResponse.json({
      flashcards,
      notes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, noteId, question, answer, difficulty } = body;

    // AI Auto-Generator Mode
    if (action === 'ai-generate' && noteId) {
      const note = await prisma.note.findUnique({ where: { id: noteId } });
      if (!note) {
        return NextResponse.json({ error: 'Qayd topilmadi!' }, { status: 404 });
      }

      // Generate smart QA cards from note content
      const sentences = (note.content || '').split(/[.!?\n]/).filter((s) => s.trim().length > 15);
      const generatedCards = [];

      if (sentences.length >= 2) {
        for (let i = 0; i < Math.min(3, sentences.length); i++) {
          const text = sentences[i].trim();
          const q = `${note.title}: ${text.slice(0, 40)}... kontseptsiyasi nima?`;
          const a = text;

          const card = await prisma.flashcard.create({
            data: {
              noteId: note.id,
              question: q,
              answer: a,
              difficulty: 'MEDIUM',
            },
          });
          generatedCards.push(card);
        }
      } else {
        const card = await prisma.flashcard.create({
          data: {
            noteId: note.id,
            question: `${note.title} loyihasi/qaydining asosiy mazmuni nima?`,
            answer: note.content || note.title,
            difficulty: 'MEDIUM',
          },
        });
        generatedCards.push(card);
      }

      return NextResponse.json({ success: true, count: generatedCards.length, cards: generatedCards });
    }

    // Manual Card Creation Mode
    if (!question?.trim() || !answer?.trim()) {
      return NextResponse.json({ error: 'Savol va javob kiritilishi shart!' }, { status: 400 });
    }

    const card = await prisma.flashcard.create({
      data: {
        noteId: noteId || null,
        question: question.trim(),
        answer: answer.trim(),
        difficulty: difficulty || 'MEDIUM',
      },
    });

    return NextResponse.json(card);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, rating } = body; // "EASY" | "MEDIUM" | "HARD"

    if (!id || !rating) {
      return NextResponse.json({ error: 'id va rating shart!' }, { status: 400 });
    }

    // Spaced repetition interval computation
    let daysToAdd = 1;
    if (rating === 'EASY') daysToAdd = 4;
    else if (rating === 'MEDIUM') daysToAdd = 2;
    else daysToAdd = 1;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    const nextReviewStr = nextDate.toISOString().split('T')[0];

    const updated = await prisma.flashcard.update({
      where: { id },
      data: {
        difficulty: rating,
        reviewCount: { increment: 1 },
        nextReview: nextReviewStr,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID kiritilmagan' }, { status: 400 });
    }

    await prisma.flashcard.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
