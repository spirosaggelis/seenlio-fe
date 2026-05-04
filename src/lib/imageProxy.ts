import { createHmac } from 'node:crypto';

const CDN_BASE =
  process.env.NEXT_PUBLIC_IMAGE_CDN_URL?.replace(/\/+$/, '') ||
  'https://cdn.seenlio.com';

const SAME_ORIGIN_HOSTS = new Set(['seenlio.com', 'cdn.seenlio.com']);

const ALLOWED_EXTS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'avif',
  'svg',
]);

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64').toString('utf8');
}

function extractExt(url: string): string {
  try {
    const path = new URL(url).pathname;
    const m = path.match(/\.([a-zA-Z0-9]{2,5})(?:$|[?#])/);
    if (m) {
      const ext = m[1].toLowerCase();
      if (ALLOWED_EXTS.has(ext)) return ext;
      if (ext === 'jpe') return 'jpg';
    }
  } catch {
    // fall through
  }
  return 'jpg';
}

function getSecret(): string | null {
  return process.env.IMAGE_PROXY_SECRET || null;
}

export function sign(encodedSegment: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  return createHmac('sha256', secret)
    .update(encodedSegment)
    .digest('hex')
    .slice(0, 16);
}

export function verify(encodedSegment: string, sig: string): boolean {
  const expected = sign(encodedSegment);
  if (!expected || expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

export function proxyImage(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('/')) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (SAME_ORIGIN_HOSTS.has(parsed.hostname.toLowerCase())) {
    return url;
  }

  const ext = extractExt(url);
  const encoded = `${base64UrlEncode(url)}.${ext}`;
  const sig = sign(encoded);
  if (!sig) return url;
  return `${CDN_BASE}/i/${sig}/${encoded}`;
}

export function proxyImageList(urls: Array<string | null | undefined>): string[] {
  return urls
    .map((u) => proxyImage(u))
    .filter((u): u is string => !!u);
}
