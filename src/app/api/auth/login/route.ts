import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSessionToken } from '@/lib/auth';

// POST /api/auth/login
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email va parol kiritilmadi' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Foydalanuvchi topilmadi yoki bloklangan" }, { status: 401 });
    }

    const hashed = hashPassword(password);
    if (hashed !== user.passwordHash) {
      return NextResponse.json({ error: "Noto'g'ri parol" }, { status: 401 });
    }

    const token = createSessionToken(user.id, user.passwordHash);
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    });

    response.cookies.set('user_session', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'strict',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/auth/login  (logout)
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('user_session');
  return response;
}
