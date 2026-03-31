import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.DASHBOARD_JWT_SECRET ?? 'change-me-in-production';
const PASSWORD_HASH = process.env.DASHBOARD_PASSWORD_HASH ?? '';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { password } = await req.json();
    if (!password || !PASSWORD_HASH) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, PASSWORD_HASH);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await new SignJWT({ role: 'dashboard' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .setIssuedAt()
      .sign(new TextEncoder().encode(JWT_SECRET));

    const res = NextResponse.json({ ok: true });
    res.cookies.set('dashboard_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/dashboard',
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
    path: '/dashboard',
  });
  return res;
}
