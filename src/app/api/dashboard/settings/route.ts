import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
};

export async function GET(): Promise<NextResponse> {
  try {
    const res = await fetch(`${STRAPI_URL}/api/setting?populate=affiliatePatterns`, {
      headers,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Strapi: ${res.status}`);
    const result = await res.json();
    const data = result.data || {};
    const attrs = data.attributes || data;
    return NextResponse.json({ settings: attrs });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    const ALLOWED_FIELDS = [
      'pipelineEnabled',
      'pipelineIntervalMinutes',
      'logLevel',
      'minTrendScore',
      'minRating',
      'maxPrice',
      'defaultApprovalPrompt',
    ];

    const allowed: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) allowed[key] = body[key];
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const res = await fetch(`${STRAPI_URL}/api/setting`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ data: allowed }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
