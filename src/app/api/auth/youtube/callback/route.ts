import { NextRequest, NextResponse } from 'next/server';

/**
 * YouTube OAuth callback handler.
 *
 * Flow:
 * 1. User clicks "Connect YouTube" → opens Google OAuth consent screen
 * 2. Google redirects here with ?code=XXX&state=ACCOUNT_ID
 * 3. We exchange the code for access_token + refresh_token
 * 4. Save credentials to the platform account in Strapi
 * 5. Redirect back to dashboard/channels
 */

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

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
  return `${getPublicOrigin(req)}/api/auth/youtube/callback`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // platform account documentId
  const error = searchParams.get('error');

  const dashboardUrl = new URL(`${getPublicOrigin(req)}/dashboard/channels`);

  if (error) {
    dashboardUrl.searchParams.set('error', `Google auth failed: ${error}`);
    return NextResponse.redirect(dashboardUrl);
  }

  if (!code) {
    dashboardUrl.searchParams.set('error', 'No authorization code received from Google');
    return NextResponse.redirect(dashboardUrl);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
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
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: tokenData.refresh_token || '',
    };

    // If no refresh_token, the user may have already granted access before
    if (!tokenData.refresh_token) {
      dashboardUrl.searchParams.set(
        'error',
        'No refresh token received. Revoke app access at myaccount.google.com/permissions then try again.',
      );
      return NextResponse.redirect(dashboardUrl);
    }

    // Save to Strapi platform account if state has account ID
    if (state) {
      await fetch(`${STRAPI_URL}/api/platform-accounts/${state}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
        },
        body: JSON.stringify({
          data: { credentials },
        }),
      });
    }

    dashboardUrl.searchParams.set('success', 'YouTube connected successfully');
    if (state) dashboardUrl.searchParams.set('accountId', state);
    return NextResponse.redirect(dashboardUrl);
  } catch (err) {
    console.error('YouTube OAuth error:', err);
    dashboardUrl.searchParams.set('error', 'YouTube OAuth failed — check server logs');
    return NextResponse.redirect(dashboardUrl);
  }
}
