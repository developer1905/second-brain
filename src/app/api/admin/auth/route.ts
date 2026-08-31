import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2025';

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Noto'g'ri parol" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', Buffer.from(ADMIN_PASSWORD).toString('base64'), {
      httpOnly: true,
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
      sameSite: 'strict',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_session');
  return response;
}
