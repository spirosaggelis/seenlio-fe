import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.DASHBOARD_JWT_SECRET ?? 'change-me-in-production';
const PASSWORD_HASH = process.env.DASHBOARD_PASSWORD_HASH ?? '';

// ── Rate limiter (in-memory, per IP) ──────────────────────────────────────
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

// Clean up stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of attempts) {
    if (now > entry.resetAt) attempts.delete(ip);
  }
}, 10 * 60 * 1000);

// ── Routes ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again in 15 minutes.' },
      { status: 429 },
    );
  }

  try {
    const { password } = await req.json();
    if (!password || !PASSWORD_HASH) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, PASSWORD_HASH);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Successful login — clear rate limit for this IP
    attempts.delete(ip);

    const token = await new SignJWT({ role: 'dashboard' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .setIssuedAt()
      .sign(new TextEncoder().encode(JWT_SECRET));

    const res = NextResponse.json({ ok: true });
    res.cookies.set('dashboard_token', token, {
      httpOnly: true,
      // Lax: session must survive top-level return from OAuth providers (e.g. Pinterest).
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('dashboard_token', '', {
    maxAge: 0,
    path: '/',
  });
  return res;
}
