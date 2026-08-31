import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { createHash } from 'crypto';

export function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'secondbrain_salt_2026').digest('hex');
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user_session');
    if (!sessionCookie?.value) return null;

    // session value = base64(userId:passwordHash)
    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: { id: true, name: true, email: true, isAdmin: true, createdAt: true },
    });

    return user;
  } catch {
    return null;
  }
}

export function createSessionToken(userId: string, passwordHash: string): string {
  return Buffer.from(`${userId}:${passwordHash}`).toString('base64');
}
