import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const DASHBOARD_JWT_SECRET = process.env.DASHBOARD_JWT_SECRET ?? 'change-me-in-production';

/** Set DASHBOARD_AUTH_DISABLED=true only for local/debug — never in production. */
const DASHBOARD_AUTH_DISABLED =
  process.env.DASHBOARD_AUTH_DISABLED === 'true' ||
  process.env.DASHBOARD_AUTH_DISABLED === '1';

// ─── /go tracking cookies ─────────────────────────────────────────────────────

const CID_COOKIE = 'seenlio_cid';
const SID_COOKIE = 'seenlio_sid';
const CID_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 years
const SESSION_IDLE_SECONDS = 60 * 30; // 30 minutes — GA4 default

function generateCid(): string {
  return `${Math.floor(Math.random() * 1e10)}.${Math.floor(Date.now() / 1000)}`;
}

function generateSid(): string {
  return String(Math.floor(Date.now() / 1000));
}

/**
 * Ensure the response has persistent visitor + rolling session cookies.
 * Used on /go/* where client-side GTM is disabled and analytics fires
 * server-side via Measurement Protocol.
 */
function ensureTrackingCookies(req: NextRequest, res: NextResponse): void {
  if (!req.cookies.get(CID_COOKIE)) {
    res.cookies.set(CID_COOKIE, generateCid(), {
      maxAge: CID_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    });
  }
  // Rolling session: refresh maxAge on every hit so it expires only after
  // 30 min of inactivity (matches GA4 default session timeout).
  const existingSid = req.cookies.get(SID_COOKIE)?.value;
  res.cookies.set(SID_COOKIE, existingSid || generateSid(), {
    maxAge: SESSION_IDLE_SECONDS,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
  });
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

  if (pathname.startsWith('/go/')) {
    const res = NextResponse.next();
    ensureTrackingCookies(req, res);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
