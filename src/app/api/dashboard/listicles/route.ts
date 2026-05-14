import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

function strapiHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
  };
}

type RawListicle = Record<string, unknown> & {
  attributes?: Record<string, unknown>;
  documentId?: string;
  id?: number | string;
};

function flatten(row: RawListicle) {
  const attrs = (row.attributes || row) as Record<string, unknown>;
  return { ...attrs, id: row.documentId || attrs.documentId || row.id };
}

export async function GET(): Promise<NextResponse> {
  if (!STRAPI_URL) {
    return NextResponse.json({ error: 'STRAPI_URL not configured' }, { status: 500 });
  }
  try {
    const params = new URLSearchParams({
      'pagination[pageSize]': '200',
      'sort[0]': 'priorityScore:desc',
      'sort[1]': 'createdAt:desc',
      'populate[products][fields][0]': 'productCode',
      'populate[products][fields][1]': 'name',
      'populate[products][fields][2]': 'slug',
      'populate[0]': 'featuredImage',
    });
    const res = await fetch(`${STRAPI_URL}/api/listicles?${params.toString()}`, {
      headers: strapiHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Strapi ${res.status}: ${await res.text()}` },
        { status: res.status },
      );
    }
    const body = await res.json();
    const listicles = (body.data || []).map((row: RawListicle) => flatten(row));
    return NextResponse.json({ listicles });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { id, ...data } = body as { id?: string } & Record<string, unknown>;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const res = await fetch(`${STRAPI_URL}/api/listicles/${id}`, {
      method: 'PUT',
      headers: strapiHeaders(),
      body: JSON.stringify({ data }),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: await res.text() },
        { status: res.status },
      );
    }
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 });
    const res = await fetch(`${STRAPI_URL}/api/listicles/${id}`, {
      method: 'DELETE',
      headers: strapiHeaders(),
    });
    if (!res.ok && res.status !== 204) {
      return NextResponse.json(
        { error: await res.text() },
        { status: res.status },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
