export const PLATFORM_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  aliexpress: 'AliExpress',
  temu: 'Temu',
  tiktok_shop: 'TikTok Shop',
};

export function shopPlatformLabel(platform?: string): string {
  const key = (platform || '').toLowerCase();
  return PLATFORM_LABELS[key] || 'store';
}

export function affiliateGoHref(productCode: string): string {
  return `/go/${encodeURIComponent(productCode)}`;
}

/** CMS titles sometimes already include the site name; the layout adds it again. */
export function pageTitle(raw: string, max = 57): string {
  const cleaned = raw.replace(/\s*[|—–-]\s*Seenlio\s*$/i, '').trim() || raw.trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max).trimEnd() + '…';
}

/** Short name for cards, H1s, and breadcrumbs — not the 30-word marketplace title. */
export function displayName(name: string, seoTitle?: string, max = 62): string {
  const seo = pageTitle(seoTitle || '', 200).replace(/…$/, '').trim();
  if (seo && seo.length >= 8 && seo.length <= max) return seo;

  let stem = (name || '').trim();
  const cut = stem.match(/^(.{12,}?)(?:\s+[-–—|:]\s+|,\s+)/);
  if (cut) stem = cut[1].trim();
  const words = stem.split(/\s+/).filter(Boolean);
  if (words.length > 8) stem = words.slice(0, 8).join(' ');
  if (stem.length > max) {
    stem = stem.slice(0, max).replace(/\s+\S*$/, '').replace(/[,:;.-]+$/, '');
  }
  return stem || name;
}

const WEAK_BRANDS = new Set([
  'the', 'pack', 'new', 'set', 'pcs', '1pc', '2pcs', '2pc', 'pair', 'generic',
]);

/** Best-effort brand from the listing name. Returns null if it looks like filler. */
export function inferBrand(name: string): string | null {
  const first = (name || '').trim().split(/\s+/)[0] || '';
  const cleaned = first.replace(/[^A-Za-z0-9]/g, '');
  if (cleaned.length < 2 || cleaned.length > 18) return null;
  if (WEAK_BRANDS.has(cleaned.toLowerCase())) return null;
  if (/^\d/.test(cleaned)) return null;
  return cleaned;
}

export function isMarketplaceBlurb(text: string | undefined, name: string): boolean {
  const a = (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const b = (name || '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!a) return true;
  if (a === b) return true;
  if (b && a.startsWith(b.slice(0, Math.min(40, b.length)))) return true;
  return false;
}

/** Seenlio-authored intro so product pages are not only marketplace copy. */
export function productEditorialIntro(product: {
  name: string;
  sourcePlatform?: string;
  trendScore?: number;
  categories?: Array<{ name?: string }>;
  seo?: {
    structuredData?: {
      editorialIntro?: string;
    };
  };
}): string {
  const stored = product.seo?.structuredData?.editorialIntro?.trim();
  if (stored) return stored;
  const platform =
    PLATFORM_LABELS[(product.sourcePlatform || '').toLowerCase()] ||
    'Amazon, Temu, and AliExpress';
  const category = product.categories?.find((c) => c.name)?.name;
  const where = category ? ` in ${category}` : '';
  const score =
    product.trendScore != null && product.trendScore > 0
      ? ` It currently scores ${Math.round(product.trendScore)} on Seenlio’s trend index.`
      : '';
  return `Seenlio spotted this product trending on ${platform}${where}.${score} We track viral consumer products so you can see what is taking off before it saturates.`;
}

export function breadcrumbJsonLd(
  siteUrl: string,
  crumbs: Array<{ name: string; path: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.path}`,
    })),
  };
}

export function offerValidUntil(days = 30): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
