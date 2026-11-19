import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const DASHBOARD_JWT_SECRET = process.env.DASHBOARD_JWT_SECRET ?? 'change-me-in-production';

/** Set DASHBOARD_AUTH_DISABLED=true only for local/debug — never in production. */
const DASHBOARD_AUTH_DISABLED =
  process.env.DASHBOARD_AUTH_DISABLED === 'true' ||
  process.env.DASHBOARD_AUTH_DISABLED === '1';

// ─── Dashboard auth guard ─────────────────────────────────────────────────────

async function isDashboardAuthed(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('dashboard_token')?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(DASHBOARD_JWT_SECRET));
    return true;
  } catch {
    return false;
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  const indexNowKey = process.env.INDEXNOW_KEY?.trim();
  if (indexNowKey && pathname === `/${indexNowKey}.txt`) {
    return new NextResponse(indexNowKey, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  if (pathname === '/go' || pathname.startsWith('/go/')) {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  if (pathname.startsWith('/dashboard') && pathname !== '/dashboard/login') {
    if (DASHBOARD_AUTH_DISABLED) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    const authed = await isDashboardAuthed(req);
    if (!authed) {
      const base = process.env.NEXT_PUBLIC_SITE_URL || req.url;
      const loginUrl = new URL('/dashboard/login', base);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
