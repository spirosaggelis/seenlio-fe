import { NextResponse } from 'next/server';
import { base64UrlDecode, verify } from '@/lib/imageProxy';
import { isAllowedImageHost } from '@/lib/imageHosts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FETCH_TIMEOUT_MS = 10_000;
const FETCH_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

type Params = { sig: string; encoded: string };

export async function GET(
  _request: Request,
  context: { params: Params | Promise<Params> },
) {
  const { sig, encoded } = await Promise.resolve(context.params);

  if (!verify(encoded, sig)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const dot = encoded.lastIndexOf('.');
  const b64 = dot > 0 ? encoded.slice(0, dot) : encoded;

  let upstreamUrl: string;
  try {
    upstreamUrl = base64UrlDecode(b64);
  } catch {
    return new NextResponse('Bad request', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(upstreamUrl);
  } catch {
    return new NextResponse('Bad request', { status: 400 });
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return new NextResponse('Bad request', { status: 400 });
  }
  if (!isAllowedImageHost(parsed.hostname)) {
    return new NextResponse('Host not allowed', { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), {
      headers: { 'User-Agent': FETCH_UA, Accept: 'image/*,*/*;q=0.8' },
      signal: controller.signal,
      redirect: 'follow',
    });
  } catch {
    clearTimeout(timeout);
    return new NextResponse('Upstream fetch failed', { status: 502 });
  }
  clearTimeout(timeout);

  if (!upstream.ok || !upstream.body) {
    return new NextResponse('Upstream error', { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('image/')) {
    return new NextResponse('Not an image', { status: 502 });
  }

  const headers = new Headers();
  headers.set('Content-Type', contentType);
  const len = upstream.headers.get('content-length');
  if (len) headers.set('Content-Length', len);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');

  return new NextResponse(upstream.body, { status: 200, headers });
}
