import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { telegramId, firstName, lastName, username } = await request.json();

    if (!telegramId) {
      return NextResponse.json({ ok: false, error: 'Telegram ID kiritilmadi' }, { status: 400 });
    }

    const tgIdStr = String(telegramId);
    const email = `tg_${tgIdStr}@telegram.local`;
    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Telegram User';

    // Admin Telegram IDs
    const isAdmin = tgIdStr === '6542040260' || tgIdStr === '8996169928';

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: fullName,
          email,
          passwordHash: 'telegram_auth_protected',
          isAdmin,
          isActive: true,
        },
      });

      // Create initial welcome note for new user
      await prisma.note.create({
        data: {
          title: `👋 Xush kelibsiz, ${firstName}!`,
          content: `Ikkinchi miyangizga xush kelibsiz! Bu sahifada sizning barcha qaydlaringiz, loyihalaringiz va Telegram g'oyalaringiz saqlanadi.`,
          paraCategory: 'RESOURCE',
          sourceType: 'TELEGRAM',
          tags: 'Xush kelibsiz,Telegram,Boshlanish',
          userId: user.id,
        },
      });
    }

    // Set session cookie
    const sessionToken = btoa(`${user.id}:${user.email}`);

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });

    response.cookies.set('user_session', sessionToken, {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Telegram auth error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
