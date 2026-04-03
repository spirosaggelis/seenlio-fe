import { NextRequest, NextResponse } from 'next/server';

/**
 * Pinterest OAuth callback handler.
 *
 * Flow:
 * 1. User clicks "Connect Pinterest" → opens Pinterest OAuth consent screen
 * 2. Pinterest redirects here with ?code=XXX&state=ACCOUNT_ID
 * 3. We exchange the code for access_token + refresh_token
 * 4. Save credentials to the platform account in Strapi
 * 5. Redirect back to dashboard/channels
 */

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';
/** Server env; falls back to public ID so token exchange matches the authorize URL client_id. */
const PINTEREST_APP_ID =
  process.env.PINTEREST_APP_ID || process.env.NEXT_PUBLIC_PINTEREST_APP_ID || '';
const PINTEREST_APP_SECRET = process.env.PINTEREST_APP_SECRET || '';

/**
 * Public origin for OAuth redirect_uri and redirects — do not use `new URL(req.url).origin`
 * when the app is behind a reverse proxy (req.url is often http://localhost:5000/...).
 */
function getPublicOrigin(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  const proto =
    req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'http';
  const host =
    req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    req.headers.get('host') ||
    'localhost:3000';
  return `${proto}://${host}`;
}

function getRedirectUri(req: NextRequest) {
  return `${getPublicOrigin(req)}/api/auth/pinterest/callback`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // platform account documentId
  const error = searchParams.get('error');

  const dashboardUrl = new URL('/dashboard/channels', getPublicOrigin(req));

  if (error) {
    dashboardUrl.searchParams.set('error', `Pinterest auth failed: ${error}`);
    return NextResponse.redirect(dashboardUrl);
  }

  if (!code) {
    dashboardUrl.searchParams.set('error', 'No authorization code received from Pinterest');
    return NextResponse.redirect(dashboardUrl);
  }

  try {
    if (!PINTEREST_APP_ID || !PINTEREST_APP_SECRET) {
      dashboardUrl.searchParams.set(
        'error',
        'Pinterest OAuth is not configured: set PINTEREST_APP_ID and PINTEREST_APP_SECRET (server env).',
      );
      return NextResponse.redirect(dashboardUrl);
    }

    // Pinterest expects Basic auth; many integrations also require client_id + client_secret in the body
    // or the API returns code 2 "Authentication failed." (see Pinterest API / community threads).
    const basicAuth = Buffer.from(`${PINTEREST_APP_ID}:${PINTEREST_APP_SECRET}`).toString('base64');

    const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: getRedirectUri(req),
        client_id: PINTEREST_APP_ID,
        client_secret: PINTEREST_APP_SECRET,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      const errMsg =
        tokenData.message || tokenData.error || tokenRes.statusText || 'Token exchange failed';
      console.error('Pinterest token exchange failed:', {
        status: tokenRes.status,
        body: tokenData,
        redirect_uri: getRedirectUri(req),
      });
      dashboardUrl.searchParams.set('error', errMsg);
      return NextResponse.redirect(dashboardUrl);
    }

    const credentials = {
      app_id: PINTEREST_APP_ID,
      app_secret: PINTEREST_APP_SECRET,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || '',
    };

    // Calculate token expiry
    const expiresIn = tokenData.expires_in || 86400;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Save to Strapi platform account if state has account ID
    if (state) {
      await fetch(`${STRAPI_URL}/api/platform-accounts/${state}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
        },
        body: JSON.stringify({
          data: {
            credentials,
            tokenExpiresAt,
          },
        }),
      });
    }

    dashboardUrl.searchParams.set('success', 'Pinterest connected successfully');
    if (state) dashboardUrl.searchParams.set('accountId', state);
    return NextResponse.redirect(dashboardUrl);
  } catch (err) {
    console.error('Pinterest OAuth error:', err);
    dashboardUrl.searchParams.set('error', 'Pinterest OAuth failed — check server logs');
    return NextResponse.redirect(dashboardUrl);
  }
}
