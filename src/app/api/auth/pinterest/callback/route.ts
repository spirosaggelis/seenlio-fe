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
const PINTEREST_APP_ID = process.env.PINTEREST_APP_ID || '';
const PINTEREST_APP_SECRET = process.env.PINTEREST_APP_SECRET || '';

function getRedirectUri(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host') || 'localhost:3000';
  return `${proto}://${host}/api/auth/pinterest/callback`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // platform account documentId
  const error = searchParams.get('error');

  const dashboardUrl = new URL('/dashboard/channels', req.url);

  if (error) {
    dashboardUrl.searchParams.set('error', `Pinterest auth failed: ${error}`);
    return NextResponse.redirect(dashboardUrl);
  }

  if (!code) {
    dashboardUrl.searchParams.set('error', 'No authorization code received from Pinterest');
    return NextResponse.redirect(dashboardUrl);
  }

  try {
    // Exchange code for tokens — Pinterest uses Basic auth (base64 of app_id:app_secret)
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
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      const errMsg = tokenData.message || tokenData.error || 'Token exchange failed';
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
