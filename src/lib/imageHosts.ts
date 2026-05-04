// Allowlist of upstream hostnames the image proxy is willing to fetch from.
// Mirrors the patterns in next.config.ts → images.remotePatterns. Entries
// starting with "*." or "**." match any subdomain of the suffix.

const PATTERNS: string[] = [
  'cdn.dummyjson.com',
  'dummyjson.com',
  'fakestoreapi.com',
  'picsum.photos',
  'ae01.alicdn.com',
  '**.alicdn.com',
  'm.media-amazon.com',
  'img.kwcdn.com',
  'images-na.ssl-images-amazon.com',
  '*.aliexpress-media.com',
  '*.kwcdn.com',
];

export function isAllowedImageHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  for (const p of PATTERNS) {
    if (p.startsWith('**.')) {
      const suffix = p.slice(3);
      if (h === suffix || h.endsWith('.' + suffix)) return true;
    } else if (p.startsWith('*.')) {
      const suffix = p.slice(2);
      if (h.endsWith('.' + suffix)) return true;
    } else if (h === p.toLowerCase()) {
      return true;
    }
  }
  return false;
}
