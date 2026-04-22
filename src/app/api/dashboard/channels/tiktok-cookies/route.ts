import { NextRequest, NextResponse } from 'next/server';

/**
 * Persist a Netscape-format cookies.txt blob onto a TikTok platform-account
 * record. Used by the /dashboard/channels UI when a TikTok account is set to
 * uploadMode="studio" (Selenium-based TikTok Studio uploader).
 *
 * Body: { accountId: string, cookiesTxt: string }
 */

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

function isNetscapeCookies(blob: string): boolean {
  // Netscape cookies.txt files either start with the official header comment or
  // contain tab-separated lines with "tiktok.com" in the domain column. A quick
  // heuristic check prevents saving garbage — real validation happens at upload
  // time when the cookies are loaded into the browser.
  if (!blob || blob.trim().length === 0) return false;
  if (blob.includes('# Netscape HTTP Cookie File')) return true;
  return /tiktok\.com/i.test(blob) && /\t/.test(blob);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { accountId, cookiesTxt } = await req.json();

    if (!accountId) {
      return NextResponse.json({ error: 'Missing accountId' }, { status: 400 });
    }
    if (!cookiesTxt || typeof cookiesTxt !== 'string') {
      return NextResponse.json({ error: 'Missing cookiesTxt' }, { status: 400 });
    }
    if (!isNetscapeCookies(cookiesTxt)) {
      return NextResponse.json(
        {
          error:
            'Cookies do not look like a Netscape cookies.txt export. Expected tab-separated rows with a tiktok.com domain.',
        },
        { status: 400 },
      );
    }

    // Fetch existing credentials so we don't wipe unrelated fields (keep symmetry
    // with the OAuth flow, which stores open_id / client_key alongside tokens).
    const getRes = await fetch(`${STRAPI_URL}/api/platform-accounts/${accountId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
      },
      cache: 'no-store',
    });
    if (!getRes.ok) {
      return NextResponse.json(
        { error: `Platform account not found: ${accountId}` },
        { status: 404 },
      );
    }
    const existing = await getRes.json();
    const attrs = (existing?.data?.attributes || existing?.data || {}) as Record<
      string,
      unknown
    >;
    const prevCreds = ((attrs.credentials as Record<string, unknown>) || {}) as Record<
      string,
      unknown
    >;

    const updated = await fetch(`${STRAPI_URL}/api/platform-accounts/${accountId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        data: {
          uploadMode: 'studio',
          credentials: { ...prevCreds, cookies_txt: cookiesTxt },
          // Cookie-based auth has no server-known expiry; clear tokenExpiresAt so
          // the dashboard doesn't show a stale "token expired" badge from a
          // previous OAuth connection.
          tokenExpiresAt: null,
        },
      }),
    });

    if (!updated.ok) {
      const text = await updated.text();
      return NextResponse.json(
        { error: `Strapi update failed: ${updated.status} ${text}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('TikTok cookies save error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    if (!accountId) {
      return NextResponse.json({ error: 'Missing accountId' }, { status: 400 });
    }

    const getRes = await fetch(`${STRAPI_URL}/api/platform-accounts/${accountId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
      },
      cache: 'no-store',
    });
    if (!getRes.ok) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    const existing = await getRes.json();
    const attrs = (existing?.data?.attributes || existing?.data || {}) as Record<
      string,
      unknown
    >;
    const prevCreds = ((attrs.credentials as Record<string, unknown>) || {}) as Record<
      string,
      unknown
    >;
    // Keep any other credential keys that happen to be there, just drop the cookies.
    const next: Record<string, unknown> = { ...prevCreds };
    delete next.cookies_txt;

    const res = await fetch(`${STRAPI_URL}/api/platform-accounts/${accountId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ data: { credentials: next } }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Strapi update failed: ${res.status} ${text}` },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('TikTok cookies clear error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
