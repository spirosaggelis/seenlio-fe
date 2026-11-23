export const CANONICAL_ORIGIN = 'https://seenlio.com';
export const CDN_HOST = 'cdn.seenlio.com';

export const CDN_ROBOTS_TXT = `User-agent: *
Allow: /i/
Disallow: /
`;

export type CdnDecision =
  | { kind: 'pass' }
  | { kind: 'asset' }
  | { kind: 'robots' }
  | { kind: 'redirect'; location: string };

export function requestHostname(
  forwardedHost: string | null,
  host: string | null,
): string {
  const raw = (forwardedHost || host || '').split(',')[0]?.trim() || '';
  return raw.split(':')[0]?.toLowerCase() || '';
}

export function isCdnImagePath(pathname: string): boolean {
  if (pathname === '/favicon.ico') return true;
  if (pathname === '/i' || pathname.startsWith('/i/')) return true;
  if (pathname.startsWith('/_next/image')) return true;
  return /\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i.test(pathname);
}

/** Paths the CDN host is allowed to serve. Everything else redirects. */
export function isCdnAssetPath(pathname: string): boolean {
  if (pathname === '/favicon.ico') return true;
  if (pathname === '/i' || pathname.startsWith('/i/')) return true;
  if (pathname.startsWith('/_next/static/') || pathname.startsWith('/_next/image')) return true;
  return /\.(?:avif|gif|ico|jpe?g|png|svg|webp|woff2?|ttf|eot)$/i.test(pathname);
}

export function cdnDecision(host: string, pathname: string, search = ''): CdnDecision {
  if (host !== CDN_HOST) return { kind: 'pass' };
  if (pathname === '/robots.txt') return { kind: 'robots' };
  if (isCdnAssetPath(pathname)) return { kind: 'asset' };
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const query = search ? (search.startsWith('?') ? search : `?${search}`) : '';
  return { kind: 'redirect', location: `${CANONICAL_ORIGIN}${path}${query}` };
}
