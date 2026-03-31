import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Only allow updating pipeline-specific fields
    const allowed: Record<string, unknown> = {};
    if ('pipelineEnabled' in body) allowed.pipelineEnabled = body.pipelineEnabled;
    if ('pipelineIntervalMinutes' in body) allowed.pipelineIntervalMinutes = body.pipelineIntervalMinutes;

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const res = await fetch(`${STRAPI_URL}/api/setting`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
      },
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
