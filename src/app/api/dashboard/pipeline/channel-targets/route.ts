import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

function headers() {
  return {
    'Content-Type': 'application/json',
    ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const res = await fetch(`${STRAPI_URL}/api/channel-targets`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ data: body }),
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

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const res = await fetch(`${STRAPI_URL}/api/channel-targets/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ data }),
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

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 });
    const res = await fetch(`${STRAPI_URL}/api/channel-targets/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
