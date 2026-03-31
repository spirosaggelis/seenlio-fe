import { NextRequest, NextResponse } from 'next/server';

/**
 * TikTok OAuth callback handler.
 *
 * Flow:
 * 1. User clicks "Connect TikTok" → opens TikTok auth URL
 * 2. TikTok redirects here with ?code=XXX&state=ACCOUNT_ID
 * 3. We exchange the code for access_token + refresh_token
 * 4. Save credentials to the platform account in Strapi
 * 5. Redirect back to dashboard/channels
 */

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || '';
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || '';

function getRedirectUri(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host') || 'localhost:3000';
  return `${proto}://${host}/api/auth/tiktok/callback`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // platform account documentId
  const error = searchParams.get('error');

  const dashboardUrl = new URL('/dashboard/channels', req.url);

  if (error) {
    dashboardUrl.searchParams.set('error', `TikTok auth failed: ${error}`);
    return NextResponse.redirect(dashboardUrl);
  }

  if (!code) {
    dashboardUrl.searchParams.set('error', 'No authorization code received from TikTok');
    return NextResponse.redirect(dashboardUrl);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: getRedirectUri(req),
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      const errMsg = tokenData.error_description || tokenData.error || 'Token exchange failed';
      dashboardUrl.searchParams.set('error', errMsg);
      return NextResponse.redirect(dashboardUrl);
    }

    const credentials = {
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || '',
      open_id: tokenData.open_id || '',
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
            accountId: tokenData.open_id || '',
          },
        }),
      });
    }

    dashboardUrl.searchParams.set('success', 'TikTok connected successfully');
    if (state) dashboardUrl.searchParams.set('accountId', state);
    return NextResponse.redirect(dashboardUrl);
  } catch (err) {
    console.error('TikTok OAuth error:', err);
    dashboardUrl.searchParams.set('error', 'TikTok OAuth failed — check server logs');
    return NextResponse.redirect(dashboardUrl);
  }
}
