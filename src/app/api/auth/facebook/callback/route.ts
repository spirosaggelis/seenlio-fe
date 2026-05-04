import { NextRequest, NextResponse } from 'next/server';

/**
 * Facebook Pages OAuth callback handler.
 *
 * Flow:
 * 1. User clicks "Connect Facebook" → Meta OAuth consent screen
 * 2. Meta redirects here with ?code=XXX&state=ACCOUNT_ID
 * 3. Exchange code for short-lived user token
 * 4. Exchange for long-lived 60-day token
 * 5. Discover Facebook Pages the user manages (direct + business-owned)
 * 6. Select the first available Page and get its Page access token
 * 7. Save { access_token, page_id, page_name } to Strapi platform account
 * 8. Redirect back to /dashboard/channels
 *
 * Required Meta app permissions:
 * pages_show_list, pages_read_engagement, pages_manage_posts, business_management
 */

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';
const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';
const FB_APP_ID = process.env.FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '';
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';

function getPublicOrigin(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'http';
  const host =
    req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    req.headers.get('host') ||
    'localhost:3000';
  return `${proto}://${host}`;
}

function getRedirectUri(req: NextRequest) {
  return `${getPublicOrigin(req)}/api/auth/facebook/callback`;
}

async function graphGet(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${GRAPH_BASE}${path}?${qs}`);
  return res.json();
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // platform account documentId
  const error = searchParams.get('error');

  const dashboardUrl = new URL(`${getPublicOrigin(req)}/dashboard/channels`);

  if (error) {
    dashboardUrl.searchParams.set('error', `Facebook auth failed: ${searchParams.get('error_description') || error}`);
    return NextResponse.redirect(dashboardUrl);
  }

  if (!code) {
    dashboardUrl.searchParams.set('error', 'No authorization code received from Meta');
    return NextResponse.redirect(dashboardUrl);
  }

  if (!FB_APP_ID || !FB_APP_SECRET) {
    dashboardUrl.searchParams.set('error', 'FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not configured');
    return NextResponse.redirect(dashboardUrl);
  }

  try {
    // Step 1: Exchange code for short-lived user access token
    const tokenUrl = new URL(`${GRAPH_BASE}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id', FB_APP_ID);
    tokenUrl.searchParams.set('client_secret', FB_APP_SECRET);
    tokenUrl.searchParams.set('redirect_uri', getRedirectUri(req));
    tokenUrl.searchParams.set('code', code);

    const shortTokenRes = await fetch(tokenUrl.toString());
    const shortTokenData = await shortTokenRes.json();

    if (shortTokenData.error || !shortTokenData.access_token) {
      const msg = shortTokenData.error?.message || 'Token exchange failed';
      dashboardUrl.searchParams.set('error', msg);
      return NextResponse.redirect(dashboardUrl);
    }

    // Step 2: Exchange for long-lived token (60 days)
    const longTokenData = await graphGet('/oauth/access_token', {
      grant_type: 'fb_exchange_token',
      client_id: FB_APP_ID,
      client_secret: FB_APP_SECRET,
      fb_exchange_token: shortTokenData.access_token,
    });

    if (longTokenData.error || !longTokenData.access_token) {
      const msg = longTokenData.error?.message || 'Long-lived token exchange failed';
      dashboardUrl.searchParams.set('error', msg);
      return NextResponse.redirect(dashboardUrl);
    }

    const userToken = longTokenData.access_token;
    const tokenExpiresIn: number = longTokenData.expires_in || 60 * 24 * 60 * 60;
    const tokenExpiresAt = new Date(Date.now() + tokenExpiresIn * 1000).toISOString();

    // Step 3: Discover Facebook Pages the user manages.
    // We check both /me/accounts (direct) and /me/businesses (business-owned).
    type Page = { id: string; name: string; access_token: string };
    const pageMap = new Map<string, Page>();
    const trace: Record<string, unknown> = {};

    // 3a. Direct user-managed pages
    const directPages = await graphGet('/me/accounts', {
      access_token: userToken,
      fields: 'id,name,access_token',
      limit: '100',
    });
    trace.me_accounts = directPages.error
      ? { error: directPages.error }
      : { count: (directPages.data || []).length };
    for (const p of directPages.data || []) {
      if (p?.id && p?.access_token) pageMap.set(p.id, p);
    }

    // 3b. Pages reachable via Businesses the user admins
    const businessesRes = await graphGet('/me/businesses', {
      access_token: userToken,
      fields: 'id,name',
      limit: '100',
    });
    const businesses: Array<{ id: string; name: string }> =
      businessesRes.data || [];
    trace.me_businesses = businessesRes.error
      ? { error: businessesRes.error }
      : { count: businesses.length };

    for (const biz of businesses) {
      for (const kind of ['owned_pages', 'client_pages'] as const) {
        const bizPagesRes = await graphGet(`/${biz.id}/${kind}`, {
          access_token: userToken,
          fields: 'id,name,access_token',
          limit: '100',
        });
        const bizPages: Page[] = bizPagesRes.data || [];
        trace[`${biz.id}_${kind}`] = bizPagesRes.error
          ? { error: bizPagesRes.error }
          : { count: bizPages.length };
        for (const p of bizPages) {
          if (!p?.id) continue;
          const existing = pageMap.get(p.id);
          if (!existing || (!existing.access_token && p.access_token)) {
            pageMap.set(p.id, {
              id: p.id,
              name: p.name,
              access_token: p.access_token || userToken,
            });
          }
        }
      }
    }

    const pages = Array.from(pageMap.values());

    if (pages.length === 0) {
      const detail = encodeURIComponent(JSON.stringify(trace).slice(0, 800));
      dashboardUrl.searchParams.set(
        'error',
        `No Facebook Pages found. Make sure you manage at least one Facebook Page. detail=${detail}`,
      );
      return NextResponse.redirect(dashboardUrl);
    }

    // Step 4: Use the first available Page. Page tokens don't expire.
    const page = pages[0];
    const credentials = {
      access_token: page.access_token,
      page_id: page.id,
      page_name: page.name,
    };

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
            accountId: page.id,
          },
        }),
      });
    }

    dashboardUrl.searchParams.set('success', `Facebook connected (${page.name})`);
    if (state) dashboardUrl.searchParams.set('accountId', state);
    return NextResponse.redirect(dashboardUrl);
  } catch (err) {
    console.error('Facebook OAuth error:', err);
    dashboardUrl.searchParams.set('error', 'Facebook OAuth failed — check server logs');
    return NextResponse.redirect(dashboardUrl);
  }
}
