import { NextResponse, type NextRequest } from 'next/server';

// Edge Runtime-compatible session token check
function verifyAdminSession(sessionValue: string | undefined, password: string): boolean {
  if (!sessionValue) return false;
  const expected = btoa(password);
  return sessionValue === expected;
}

function verifyUserSession(sessionValue: string | undefined): boolean {
  if (!sessionValue) return false;
  try {
    const decoded = atob(sessionValue);
    const [userId] = decoded.split(':');
    return !!(userId && userId.length > 5);
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2025';

  // Helper to attach Telegram Mini App iframe headers
  const addSecurityHeaders = (response: NextResponse) => {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Content-Security-Policy', "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org;");
    return response;
  };

  // ── Static Assets — always allow ──────────────────────────────────────────
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico'
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  // ── Admin Panel Protection ─────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const adminSession = request.cookies.get('admin_session')?.value;
    const isAdminAuth = verifyAdminSession(adminSession, ADMIN_PASSWORD);

    if (pathname === '/admin/login') {
      if (isAdminAuth) {
        return addSecurityHeaders(NextResponse.redirect(new URL('/admin', request.url)));
      }
      return addSecurityHeaders(NextResponse.next());
    }

    if (!isAdminAuth) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/admin/login', request.url)));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  // ── User App Protection ────────────────────────────────────────────────────
  // Explicit /login route
  if (pathname === '/login') {
    return addSecurityHeaders(NextResponse.next());
  }

  // If user_session cookie is missing, auto-provision default user session for instant access
  const userSession = request.cookies.get('user_session')?.value;
  if (!verifyUserSession(userSession)) {
    const defaultSessionToken = btoa('default_user_session:admin@secondbrain.ai');
    const response = NextResponse.next();
    response.cookies.set('user_session', defaultSessionToken, {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    });
    return addSecurityHeaders(response);
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};

