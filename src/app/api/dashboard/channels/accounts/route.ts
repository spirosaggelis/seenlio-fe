import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

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

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const result = await strapiMutate('POST', '/platform-accounts', {
      data: {
        platform: body.platform,
        uploadMode: body.uploadMode || 'api',
        accountName: body.accountName,
        accountId: body.accountId || '',
        channel: body.channelId || undefined,
        credentials: body.credentials || {},
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Create platform account error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const payload: Record<string, unknown> = {};
    if (data.platform !== undefined) payload.platform = data.platform;
    if (data.uploadMode !== undefined) payload.uploadMode = data.uploadMode;
    if (data.accountName !== undefined) payload.accountName = data.accountName;
    if (data.accountId !== undefined) payload.accountId = data.accountId;
    if (data.channelId !== undefined) payload.channel = data.channelId;
    if (data.credentials !== undefined) payload.credentials = data.credentials;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.tokenExpiresAt !== undefined) payload.tokenExpiresAt = data.tokenExpiresAt;

    const result = await strapiMutate('PUT', `/platform-accounts/${id}`, { data: payload });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Update platform account error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const result = await strapiMutate('DELETE', `/platform-accounts/${id}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Delete platform account error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
