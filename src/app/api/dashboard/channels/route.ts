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

async function strapiMutate(method: string, path: string, body?: unknown) {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strapi ${method} ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

export async function GET(): Promise<NextResponse> {
  try {
    const [channelsRes, categoriesRes] = await Promise.all([
      strapiGet(
        '/channels?populate[0]=category&populate[1]=platformAccounts&sort=name:asc&pagination[pageSize]=100',
      ),
      strapiGet(
        '/categories?fields[0]=id&fields[1]=name&filters[isActive][$eq]=true&sort=name:asc&pagination[pageSize]=100',
      ),
    ]);

    const channels = (channelsRes.data || []).map((c: Record<string, unknown>) => {
      const attrs = ((c as Record<string, unknown>).attributes || c) as Record<string, unknown>;
      const cat = attrs.category as Record<string, unknown> | undefined;
      const catData = cat?.data ? cat.data : cat;

      const accounts = (attrs.platformAccounts as unknown[]) || [];
      const platformAccounts = ((Array.isArray(accounts) ? accounts : (accounts as Record<string, unknown>).data || []) as unknown[]).map(
        (a: unknown) => {
          const acc = a as Record<string, unknown>;
          const accAttrs = (acc.attributes || acc) as Record<string, unknown>;
          return {
            id: acc.documentId || acc.id,
            platform: accAttrs.platform,
            accountName: accAttrs.accountName,
            accountId: accAttrs.accountId,
            isActive: accAttrs.isActive,
            credentials: accAttrs.credentials,
            tokenExpiresAt: accAttrs.tokenExpiresAt,
            lastPostedAt: accAttrs.lastPostedAt,
          };
        },
      );

      return {
        id: c.documentId || c.id,
        name: attrs.name,
        slug: attrs.slug,
        description: attrs.description,
        isActive: attrs.isActive,
        category: catData
          ? { id: (catData as Record<string, unknown>).documentId || (catData as Record<string, unknown>).id, name: (catData as Record<string, unknown>).name }
          : null,
        platformAccounts,
      };
    });

    const categories = (categoriesRes.data || []).map((c: Record<string, unknown>) => {
      const attrs = ((c as Record<string, unknown>).attributes || c) as Record<string, unknown>;
      return { id: c.documentId || c.id, name: attrs.name };
    });

    return NextResponse.json({ channels, categories });
  } catch (error) {
    console.error('Channels dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const result = await strapiMutate('POST', '/channels', {
      data: {
        name: body.name,
        description: body.description || '',
        category: body.categoryId || undefined,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Create channel error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.categoryId !== undefined) payload.category = data.categoryId;
    if (data.isActive !== undefined) payload.isActive = data.isActive;

    const result = await strapiMutate('PUT', `/channels/${id}`, { data: payload });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Update channel error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const result = await strapiMutate('DELETE', `/channels/${id}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Delete channel error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
