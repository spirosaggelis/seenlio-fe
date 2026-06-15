import type { AffiliatePattern } from './affiliateTypes';
import { resolveTemuDestinationUrl } from './temuAffiliate';

export interface AffiliateLink {
  platform: string;
  url: string;
  isActive?: boolean;
}

export interface AffiliateProductInput {
  productCode: string;
  sourcePlatform?: string;
  sourceUrl?: string;
  affiliateLinks?: AffiliateLink[];
}

export interface AffiliateDestinationOverrides {
  platform?: string;
  rawUrl?: string;
}

// EU countries that map directly to one of the affiliate stores
const COUNTRY_TO_DOMAIN: Record<string, string> = {
  DE: 'amazon.de',
  AT: 'amazon.de',
  CH: 'amazon.de',
  FR: 'amazon.fr',
  BE: 'amazon.fr',
  LU: 'amazon.fr',
  IT: 'amazon.it',
  ES: 'amazon.es',
  PT: 'amazon.es',
  GB: 'amazon.co.uk',
  IE: 'amazon.co.uk',
};

const EU_COUNTRIES = new Set([
  'DE', 'AT', 'CH', 'FR', 'BE', 'LU', 'IT', 'ES', 'PT', 'GB', 'IE',
  'NL', 'SE', 'PL', 'DK', 'FI', 'NO', 'GR', 'CY', 'MT', 'CZ', 'SK',
  'HU', 'RO', 'BG', 'HR', 'SI', 'LT', 'LV', 'EE', 'IS', 'AL', 'RS',
  'BA', 'ME', 'MK', 'XK', 'MD', 'UA', 'BY',
]);

const EU_DOMAINS = [
  'amazon.de',
  'amazon.co.uk',
  'amazon.fr',
  'amazon.it',
  'amazon.es',
];

const AVAILABILITY_CACHE = new Map<
  string,
  { available: boolean; checked: number }
>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

export function getVisitorCountry(
  requestHeaders: Headers,
  countryOverride?: string | null,
): string {
  return (
    countryOverride ||
    requestHeaders.get('x-vercel-ip-country') ||
    requestHeaders.get('cf-ipcountry') ||
    'US'
  )
    .trim()
    .toUpperCase();
}

async function isAvailableOnDomain(
  asin: string,
  domain: string,
): Promise<boolean> {
  const key = `${asin}:${domain}`;
  const hit = AVAILABILITY_CACHE.get(key);
  if (hit && Date.now() - hit.checked < CACHE_TTL) {
    return hit.available;
  }

  try {
    const res = await fetch(`https://www.${domain}/dp/${asin}`, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(4_000),
    });
    res.body?.cancel();
    const available = res.status < 400;
    AVAILABILITY_CACHE.set(key, { available, checked: Date.now() });
    return available;
  } catch {
    AVAILABILITY_CACHE.set(key, { available: false, checked: Date.now() });
    return false;
  }
}

function extractAsin(url: string): string | null {
  const m = url.match(/\/dp\/([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
}

function buildAmazonUrl(
  asin: string,
  domain: string,
  productCode: string,
  pattern: AffiliatePattern,
): string {
  const tag = (pattern.regionalTags || {})[domain] || pattern.paramValue || '';
  const params = new URLSearchParams();
  if (tag) params.set('tag', tag);
  params.set('utm_source', 'seenlio');
  params.set('utm_medium', 'amazon');
  params.set('utm_campaign', productCode);
  return `https://www.${domain}/dp/${asin}?${params.toString()}`;
}

/**
 * Resolve the final outbound affiliate URL — same logic used by /go/{code}.
 * Pass overrides when building per-platform buttons on the product detail page.
 */
export async function buildAffiliateDestinationUrl(
  product: AffiliateProductInput,
  patterns: AffiliatePattern[],
  country: string,
  overrides?: AffiliateDestinationOverrides,
): Promise<string> {
  const platform = (
    overrides?.platform ||
    product.sourcePlatform ||
    ''
  ).toLowerCase();

  const rawUrl =
    overrides?.rawUrl ??
    product.affiliateLinks?.find((l) => l.isActive !== false && l.url)?.url ??
    product.sourceUrl ??
    '';

  if (!rawUrl) return 'https://seenlio.com/products';

  const pattern = patterns.find(
    (p) => p.platform === platform && p.isActive !== false,
  );

  if (platform === 'temu') {
    return resolveTemuDestinationUrl(rawUrl, pattern, product.productCode);
  }

  if (platform === 'amazon' && pattern?.useGeoRedirect) {
    const asin = extractAsin(rawUrl);
    if (asin) {
      const preferredDomain = COUNTRY_TO_DOMAIN[country] ?? null;

      if (!EU_COUNTRIES.has(country)) {
        try {
          const url = new URL(rawUrl);
          const tag = pattern.paramValue || '';
          if (tag) url.searchParams.set('tag', tag);
          url.searchParams.set('utm_source', 'seenlio');
          url.searchParams.set('utm_medium', 'amazon');
          url.searchParams.set('utm_campaign', product.productCode);
          return url.toString();
        } catch {
          return rawUrl;
        }
      }

      const checkOrder = preferredDomain
        ? [preferredDomain, ...EU_DOMAINS.filter((d) => d !== preferredDomain)]
        : EU_DOMAINS;

      for (const domain of checkOrder) {
        if (await isAvailableOnDomain(asin, domain)) {
          return buildAmazonUrl(asin, domain, product.productCode, pattern);
        }
      }

      try {
        const url = new URL(rawUrl);
        const tag = pattern.paramValue || '';
        if (tag) url.searchParams.set('tag', tag);
        url.searchParams.set('utm_source', 'seenlio');
        url.searchParams.set('utm_medium', 'amazon');
        url.searchParams.set('utm_campaign', product.productCode);
        return url.toString();
      } catch {
        return rawUrl;
      }
    }
  }

  try {
    const url = new URL(rawUrl);
    if (pattern) {
      url.searchParams.set(pattern.paramName, pattern.paramValue);
      if (pattern.extraParams) {
        for (const [k, v] of Object.entries(pattern.extraParams)) {
          url.searchParams.set(k, v);
        }
      }
    }
    url.searchParams.set('utm_source', 'seenlio');
    url.searchParams.set('utm_medium', platform || 'other');
    url.searchParams.set('utm_campaign', product.productCode);
    return url.toString();
  } catch {
    return rawUrl;
  }
}

export async function attachAffiliateHrefs<T extends AffiliateProductInput>(
  products: T[],
  patterns: AffiliatePattern[],
  country: string,
): Promise<(T & { affiliateHref: string })[]> {
  return Promise.all(
    products.map(async (product) => ({
      ...product,
      affiliateHref: await buildAffiliateDestinationUrl(
        product,
        patterns,
        country,
      ),
    })),
  );
}
