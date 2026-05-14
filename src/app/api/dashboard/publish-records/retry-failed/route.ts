import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

async function strapiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Strapi ${path} ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

interface RecordRow {
  documentId?: string;
  id?: string | number;
  attributes?: Record<string, unknown>;
  platform?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const platform = req.nextUrl.searchParams.get('platform') || undefined;
  try {
    const platformFilter = platform
      ? `&filters[platform][$eq]=${encodeURIComponent(platform)}`
      : '';
    const res = await strapiFetch(
      `/publish-records?filters[publishStatus][$eq]=failed${platformFilter}&fields[0]=id&pagination[pageSize]=1`,
    );
    const total = res?.meta?.pagination?.total ?? 0;
    return NextResponse.json({ failedCount: total });
  } catch (err) {
    console.error('[retry-failed] count failed', err);
    return NextResponse.json({ failedCount: 0, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { platform?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* allow empty body */
  }
  const platform = body.platform;
  const platformFilter = platform
    ? `&filters[platform][$eq]=${encodeURIComponent(platform)}`
    : '';
  const nowIso = new Date().toISOString();

  let reset = 0;
  let failed = 0;

  try {
    while (true) {
      const res = await strapiFetch(
        `/publish-records?filters[publishStatus][$eq]=failed${platformFilter}&fields[0]=id&fields[1]=platform&pagination[pageSize]=100`,
      );
      const records: RecordRow[] = res?.data || [];
      if (records.length === 0) break;

      for (const rec of records) {
        const recId = rec.documentId || String(rec.id ?? '');
        if (!recId) continue;
        try {
          await strapiFetch(`/publish-records/${recId}`, {
            method: 'PUT',
            body: JSON.stringify({
              data: {
                publishStatus: 'scheduled',
                scheduledFor: nowIso,
                errorMessage: null,
              },
            }),
          });
          reset += 1;
        } catch (err) {
          console.error('[retry-failed] update failed', recId, err);
          failed += 1;
        }
      }
    }
  } catch (err) {
    console.error('[retry-failed] list failed', err);
    return NextResponse.json(
      { reset, failed, error: String(err) },
      { status: 500 },
    );
  }

  return NextResponse.json({ reset, failed });
}
