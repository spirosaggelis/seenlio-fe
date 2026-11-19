
export const PLATFORM_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  aliexpress: 'AliExpress',
  temu: 'Temu',
  tiktok_shop: 'TikTok Shop',
};

/**
 * First word of a marketplace title is not a brand ("Cordless", "Stay").
 * Only these names are emitted as schema.org Brand.
 */
const KNOWN_BRANDS = new Set([
  'anker', 'apple', 'asus', 'aukey', 'baseus', 'bose', 'boss', 'bosch',
  'braun', 'breville', 'canon', 'cosori', 'dewalt', 'dji', 'dyson',
  'ecoflow', 'esr', 'eufy', 'fitbit', 'garmin', 'google', 'gopro', 'govee',
  'hydroflask', 'instant', 'jackery', 'jbl', 'keurig', 'kitchenaid', 'lego',
  'lenovo', 'logitech', 'makita', 'metapen', 'microsoft', 'nespresso',
  'nike', 'ninja', 'oral-b', 'otterbox', 'owala', 'philips', 'razer',
  'samsung', 'shark', 'sony', 'spigen', 'stanley', 'ugreen', 'vitamix',
  'wyze', 'yeti',
]);

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

/** Best-effort brand. Returns null unless the first word is a known brand. */
export function inferBrand(name: string): string | null {
  const first = (name || '').trim().split(/\s+/)[0] || '';
  const cleaned = first.replace(/[^A-Za-z0-9-]/g, '');
  if (!cleaned || !KNOWN_BRANDS.has(cleaned.toLowerCase())) return null;
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

const CP1252_TO_BYTE: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};

/** Undo UTF-8 text that was decoded as Latin-1 / Windows-1252 (â€™, Â®, Ã©). */
export function fixMojibake(text: string): string {
  if (!text || !/[ÂÃâ]/.test(text)) return text;
  const bytes: number[] = [];
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code <= 0xff) bytes.push(code);
    else if (CP1252_TO_BYTE[code] != null) bytes.push(CP1252_TO_BYTE[code]);
    else return text;
  }
  const decoded = new TextDecoder('utf-8', { fatal: false }).decode(Uint8Array.from(bytes));
  if (!decoded || decoded.includes('\uFFFD')) return text;
  return decoded;
}

export function stringList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const text = fixMojibake(item).trim();
    if (!text) continue;
    out.push(text);
    if (out.length >= max) break;
  }
  return out;
}

type EditorialProduct = {
  name: string;
  sourcePlatform?: string;
  categories?: Array<{ name?: string }>;
  seo?: {
    metaTitle?: string;
    structuredData?: {
      editorialIntro?: string;
    };
  };
};

/** Factual one-liner when the CMS has no product-specific intro. */
export function factualProductLine(product: EditorialProduct): string {
  const name = displayName(product.name, product.seo?.metaTitle);
  const category = product.categories?.find((c) => c.name)?.name;
  const platform = shopPlatformLabel(product.sourcePlatform);
  const retailer = platform === 'store' ? 'a retailer' : platform;
  if (category) {
    return `${name} is a ${category} product Seenlio found trending on ${retailer}.`;
  }
  return `${name} is a product Seenlio found trending on ${retailer}.`;
}

/** Seenlio-authored intro so product pages are not only marketplace copy. */
export function productEditorialIntro(product: EditorialProduct): string {
  const stored = product.seo?.structuredData?.editorialIntro?.trim();
  if (stored) return fixMojibake(stored);
  return factualProductLine(product);
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

/** Collection page schema from the items actually rendered. Names and URLs only. */
export function collectionPageJsonLd(input: {
  siteUrl: string;
  path: string;
  name: string;
  crumbs: Array<{ name: string; path: string }>;
  items: Array<{ name: string; path: string }>;
}) {
  const pageUrl = `${input.siteUrl}${input.path}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: input.name,
        url: pageUrl,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: input.items.length,
          itemListElement: input.items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            url: item.path.startsWith('http') ? item.path : `${input.siteUrl}${item.path}`,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: input.crumbs.map((crumb, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: crumb.name,
          item: crumb.path === '/' ? input.siteUrl : `${input.siteUrl}${crumb.path}`,
        })),
      },
    ],
  };
}

/** One line for the buy box: the intro's first sentence, or a factual fallback. */
export function solvesLine(product: EditorialProduct & { shortDescription?: string }): string {
  const stored = product.seo?.structuredData?.editorialIntro?.trim();
  const firstSentence = stored ? fixMojibake(stored).split(/(?<=[.!?])\s/)[0]?.trim() : '';
  if (firstSentence && firstSentence.length <= 140) return firstSentence;

  const short = product.shortDescription?.replace(/\s+/g, ' ').trim();
  if (short && !isMarketplaceBlurb(short, product.name) && short.length <= 140) {
    return fixMojibake(short);
  }

  return factualProductLine(product);
}

export function offerValidUntil(days = 30): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Offer for the product page. The amount is the stored listing price in its
 * own currency. No availability: we do not know retailer stock.
 */
export function productOfferJsonLd(input: {
  price?: number | null;
  currency?: string | null;
  pageUrl: string;
}): Record<string, unknown> | null {
  if (input.price == null || Number.isNaN(input.price)) return null;
  const currency = (input.currency || 'USD').toUpperCase();
  return {
    '@type': 'Offer',
    url: input.pageUrl,
    price: input.price,
    priceCurrency: currency,
    priceValidUntil: offerValidUntil(30),
  };
}

/** Category blurbs in Strapi still name the closed Temu programme. */
export function scrubClosedRetailerClaims(text: string): string {
  return text
    .replace(/Amazon,\s*Temu,\s*and\s*AliExpress/gi, 'Amazon and AliExpress')
    .replace(/Amazon,\s*Temu\s+and\s*AliExpress/gi, 'Amazon and AliExpress')
    .replace(/Amazon,\s*AliExpress,?\s*and\s*Temu/gi, 'Amazon and AliExpress')
    .replace(/Amazon,\s*AliExpress,\s*Temu/gi, 'Amazon and AliExpress')
    .replace(/Amazon,\s*Temu,\s*AliExpress/gi, 'Amazon and AliExpress');
}
