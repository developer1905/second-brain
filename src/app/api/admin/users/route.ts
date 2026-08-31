import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/users — Get all registered users with counts
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            notes: true,
            projects: true,
            telegramMessages: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/users — Toggle user admin status or delete user
export async function PATCH(request: Request) {
  try {
    const { userId, isAdmin } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId ko\'rsatilmadi' }, { status: 400 });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/users — Delete user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId ko\'rsatilmadi' }, { status: 400 });

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true, message: 'Foydalanuvchi o\'chirildi' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
