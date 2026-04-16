import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

/**
 * GET /api/dashboard/channels/pinterest-boards?accountId=<documentId>
 *
 * Fetches the account credentials from Strapi, then calls Pinterest /v5/boards
 * using the stored access_token. Returns the board list to the client without
 * exposing the token directly to the browser.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get('accountId');

  if (!accountId) {
    return NextResponse.json({ error: 'Missing accountId' }, { status: 400 });
  }

  try {
    // Fetch the platform account from Strapi to get the access_token
    const accountRes = await fetch(`${STRAPI_URL}/api/platform-accounts/${accountId}`, {
      headers: {
        ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
      },
    });

    if (!accountRes.ok) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const accountData = await accountRes.json();
    const credentials = accountData?.data?.credentials as Record<string, string> | null;
    const accessToken = credentials?.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token — reconnect Pinterest first' }, { status: 400 });
    }

    // Fetch boards from Pinterest API
    const boardsRes = await fetch('https://api.pinterest.com/v5/boards?page_size=100', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!boardsRes.ok) {
      const errorBody = await boardsRes.json().catch(() => ({}));
      const msg = (errorBody as Record<string, string>).message || boardsRes.statusText;
      return NextResponse.json({ error: `Pinterest API error: ${msg}` }, { status: boardsRes.status });
    }

    const boardsData = await boardsRes.json();
    // Pinterest returns { items: [{id, name, description, ...}], bookmark: ... }
    const boards = (boardsData.items || []) as { id: string; name: string }[];

    return NextResponse.json({ boards });
  } catch (err) {
    console.error('pinterest-boards route error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
