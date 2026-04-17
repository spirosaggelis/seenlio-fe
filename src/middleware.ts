import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const DASHBOARD_JWT_SECRET = process.env.DASHBOARD_JWT_SECRET ?? 'change-me-in-production';

/** Set DASHBOARD_AUTH_DISABLED=true only for local/debug — never in production. */
const DASHBOARD_AUTH_DISABLED =
  process.env.DASHBOARD_AUTH_DISABLED === 'true' ||
  process.env.DASHBOARD_AUTH_DISABLED === '1';

const BOT_UA_RE =
  /bot|crawl|spider|slurp|mediapartners|google|bingpreview|facebookexternalhit|twitterbot|pinterest|whatsapp|applebot|yandex|baidu|duckduckbot|semrush|ahrefs|mj12bot|dotbot|curl|wget|python-requests|axios|java\/|go-http|okhttp|libwww|scrapy|headlesschrome/i;

function isBot(ua: string): boolean {
  if (!ua) return true;
  return BOT_UA_RE.test(ua);
}

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

  // ── Dashboard auth guard ──────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard') && pathname !== '/dashboard/login') {
    if (DASHBOARD_AUTH_DISABLED) {
      return NextResponse.next();
    }
    const authed = await isDashboardAuthed(req);
    if (!authed) {
      const base = process.env.NEXT_PUBLIC_SITE_URL || req.url;
      const loginUrl = new URL('/dashboard/login', base);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Server-side page view tracking ───────────────────────────────────────
  // Skip API routes, static files, and non-page paths
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/dashboard') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // Skip bots and crawlers — they don't execute JS so GA never counts them either
  const ua = req.headers.get('user-agent') ?? '';
  if (isBot(ua)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Issue or renew session cookie
  let sessionId = req.cookies.get('__sess')?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    response.cookies.set('__sess', sessionId, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
  }

  // Fire-and-forget page view to analytics ingest (Node.js route handles geoip + hashing)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL
    : req.nextUrl.origin;

  void fetch(`${baseUrl}/api/analytics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': req.headers.get('x-forwarded-for') ?? '',
      'x-real-ip': req.headers.get('x-real-ip') ?? '',
      'user-agent': req.headers.get('user-agent') ?? '',
    },
    body: JSON.stringify({
      event_type: 'page_view',
      session_id: sessionId,
      page: pathname,
      referrer: req.headers.get('referer') ?? '',
    }),
  }).catch(() => {});

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
