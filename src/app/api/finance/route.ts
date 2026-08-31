import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    let totalIncome = 0;
    let totalExpense = 0;

    const categoryBreakdown: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type === 'INCOME') {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
        categoryBreakdown[tx.category] = (categoryBreakdown[tx.category] || 0) + tx.amount;
      }
    });

    const balance = totalIncome - totalExpense;

    return NextResponse.json({
      transactions,
      stats: {
        totalIncome,
        totalExpense,
        balance,
        count: transactions.length,
      },
      categoryBreakdown,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, amount, type, category, date, description } = body;

    if (!title?.trim() || !amount || !type) {
      return NextResponse.json({ error: 'Sarlavha, summa va tur (INCOME/EXPENSE) kiritilishi shart!' }, { status: 400 });
    }

    const numericAmount = Math.abs(Number(amount));
    const txDate = date || new Date().toISOString().split('T')[0];

    const transaction = await prisma.transaction.create({
      data: {
        title: title.trim(),
        amount: numericAmount,
        type: type === 'INCOME' ? 'INCOME' : 'EXPENSE',
        category: category || (type === 'INCOME' ? 'Maosh' : 'Boshqa'),
        date: txDate,
        description: description || '',
      },
    });

    // Also auto-create a Note entry so it registers as a Knowledge Node linked to PARA
    const isIncome = type === 'INCOME';
    await prisma.note.create({
      data: {
        title: `Moliya (${isIncome ? 'Kirim' : 'Chiqim'}): ${title.trim()}`,
        content: `### 💳 Moliyaviy Amaliyot: ${title.trim()}\n\n**Tur:** ${isIncome ? '🟢 Kirim (Income)' : '🔴 Chiqim (Expense)'}\n**Summa:** $${numericAmount.toLocaleString()}\n**Kategoriya:** ${category}\n**Sana:** ${txDate}\n\n${description ? `**Tavsif:** ${description}` : ''}`,
        paraCategory: 'RESOURCE',
        sourceType: 'NOTE',
        tags: `Moliya,${isIncome ? 'Kirim' : 'Chiqim'},${category.replace(/\s+/g, '')}`,
      },
    });

    return NextResponse.json(transaction);
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

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
