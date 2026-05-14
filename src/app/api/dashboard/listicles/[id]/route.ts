import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

function strapiHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
  };
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const params = new URLSearchParams({
    'populate[items]': '*',
    'populate[products][fields][0]': 'productCode',
    'populate[products][fields][1]': 'name',
    'populate[products][fields][2]': 'slug',
    'populate[products][fields][3]': 'sourcePlatform',
    'populate[products][populate][featuredImage]': '*',
    'populate[products][populate][pricePoints]': '*',
    'populate[categories]': '*',
    'populate[featuredImage]': '*',
    'populate[seo]': '*',
  });
  const res = await fetch(`${STRAPI_URL}/api/listicles/${id}?${params.toString()}`, {
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
  return NextResponse.json({ listicle: body.data || null });
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const data = await req.json();
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
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
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
}
