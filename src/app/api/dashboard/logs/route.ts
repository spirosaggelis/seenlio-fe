import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

async function strapiGet(path: string) {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Strapi ${path}: ${res.status}`);
  return res.json();
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = req.nextUrl;
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '25');
    const level = searchParams.get('level') || '';
    const service = searchParams.get('service') || '';
    const event = searchParams.get('event') || '';

    let filterStr = '';
    if (level) filterStr += `&filters[level][$eq]=${level}`;
    if (service) filterStr += `&filters[service][$eq]=${service}`;
    if (event) filterStr += `&filters[event][$contains]=${event}`;

    const result = await strapiGet(
      `/app-logs?sort=createdAt:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}${filterStr}`,
    );

    const logs = (result.data || []).map((j: Record<string, unknown>) => {
      const attrs = (j as Record<string, unknown>).attributes || j;
      return { id: j.documentId || j.id, ...attrs };
    });

    return NextResponse.json({
      logs,
      pagination: result.meta?.pagination || { page, pageSize, pageCount: 1, total: 0 },
    });
  } catch (error) {
    console.error('Logs API error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
