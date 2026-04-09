import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { createHash } from 'crypto';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import GoRedirectClient from './GoRedirectClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// ── Config ─────────────────────────────────────────────────────────────────

const STRAPI_URL =
  process.env.STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';

const COUNTRY_TO_DOMAIN: Record<string, string> = {
  DE: 'amazon.de', AT: 'amazon.de', CH: 'amazon.de',
  FR: 'amazon.fr', BE: 'amazon.fr', LU: 'amazon.fr',
  IT: 'amazon.it', ES: 'amazon.es',
  NL: 'amazon.nl', SE: 'amazon.se', PL: 'amazon.pl',
  GB: 'amazon.co.uk',
  JP: 'amazon.co.jp', AU: 'amazon.com.au', IN: 'amazon.in',
  CA: 'amazon.ca', MX: 'amazon.com.mx', BR: 'amazon.com.br',
  AE: 'amazon.ae', SA: 'amazon.sa', TR: 'amazon.com.tr',
};

// ── Types ──────────────────────────────────────────────────────────────────

interface AffiliatePattern {
  platform: string;
  paramName: string;
  paramValue: string;
  regionalTags?: Record<string, string>;
  extraParams?: Record<string, string>;
  useGeoRedirect?: boolean;
  isActive?: boolean;
}

interface Product {
  id: number;
  productCode: string;
  name?: string;
  sourceUrl?: string;
  sourcePlatform?: string;
  affiliateLinks?: Array<{ platform: string; url: string; isActive?: boolean }>;
}

// ── Strapi helpers ─────────────────────────────────────────────────────────

async function lookupProduct(code: string): Promise<Product | null> {
  try {
    const res = await fetch(
      `${STRAPI_URL}/api/products?filters[productCode][$eq]=${encodeURIComponent(code)}&filters[productStatus][$eq]=published&populate[0]=affiliateLinks&fields[0]=id&fields[1]=productCode&fields[2]=sourceUrl&fields[3]=sourcePlatform&fields[4]=name`,
      {
        headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.[0] ?? null;
  } catch {
    return null;
  }
}

async function getAffiliatePatterns(): Promise<AffiliatePattern[]> {
  try {
    const res = await fetch(
      `${STRAPI_URL}/api/setting?populate=affiliatePatterns`,
      {
        headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
        next: { revalidate: 300 },
      },
    );
    if (res.ok) {
      const json = await res.json();
      return json?.data?.affiliatePatterns || [];
    }
  } catch {
    // fall through
  }
  return [];
}

// ── URL building ───────────────────────────────────────────────────────────

function extractAsin(url: string): string | null {
  const m = url.match(/\/dp\/([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
}

function buildDestinationUrl(
  product: Product,
  patterns: AffiliatePattern[],
  country: string,
): string {
  const platform = product.sourcePlatform || '';
  const activeLink = product.affiliateLinks?.find((l) => l.isActive !== false && l.url);
  const rawUrl = activeLink?.url || product.sourceUrl || '';
  if (!rawUrl) return 'https://seenlio.com/products';

  const pattern = patterns.find((p) => p.platform === platform && p.isActive !== false);

  if (platform === 'amazon' && pattern?.useGeoRedirect) {
    const asin = extractAsin(rawUrl);
    if (asin) {
      const targetDomain = COUNTRY_TO_DOMAIN[country] ?? 'amazon.com';
      const tag =
        (pattern.regionalTags || {})[targetDomain] || pattern.paramValue || '';
      const params = new URLSearchParams();
      if (tag) params.set('tag', tag);
      params.set('utm_source', 'seenlio');
      params.set('utm_medium', 'amazon');
      params.set('utm_campaign', product.productCode);
      return `https://www.${targetDomain}/dp/${asin}?${params.toString()}`;
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

// ── Strapi click tracking (server-side) ────────────────────────────────────

async function trackClickInStrapi(
  reqHeaders: Awaited<ReturnType<typeof headers>>,
  product: Product,
  destinationUrl: string,
): Promise<void> {
  const ip =
    reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    reqHeaders.get('x-real-ip') ||
    '0.0.0.0';
  const ua = reqHeaders.get('user-agent') || '';
  const referrer = reqHeaders.get('referer') || '';
  const country =
    reqHeaders.get('x-vercel-ip-country') ||
    reqHeaders.get('cf-ipcountry') ||
    null;

  const salt = process.env.IP_HASH_SALT || 'default-salt-change-me';
  const ipHash = createHash('sha256')
    .update(ip + salt)
    .digest('hex')
    .slice(0, 16);

  let deviceType = 'unknown';
  const lower = ua.toLowerCase();
  if (/tablet|ipad/.test(lower)) deviceType = 'tablet';
  else if (/mobile|android|iphone|ipod|windows phone/.test(lower)) deviceType = 'mobile';
  else if (ua) deviceType = 'desktop';

  let referrerSource = 'direct';
  if (referrer) {
    try {
      const host = new URL(referrer).hostname.toLowerCase();
      if (/tiktok\.com/.test(host)) referrerSource = 'tiktok';
      else if (/youtube\.com|youtu\.be/.test(host)) referrerSource = 'youtube';
      else if (/instagram\.com/.test(host)) referrerSource = 'instagram';
      else if (/facebook\.com|fb\.com/.test(host)) referrerSource = 'facebook';
      else if (/twitter\.com|x\.com/.test(host)) referrerSource = 'twitter';
      else if (/pinterest\.com/.test(host)) referrerSource = 'pinterest';
      else if (/google\./.test(host)) referrerSource = 'google';
      else referrerSource = 'other';
    } catch {
      // keep 'direct'
    }
  }

  await fetch(`${STRAPI_URL}/api/site-events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
    body: JSON.stringify({
      data: {
        event_type: 'affiliate_click',
        page: `/go/${product.productCode}`,
        ip_hash: ipHash,
        country,
        device_type: deviceType,
        referrer: referrer || null,
        referrer_source: referrerSource,
        click_source: 'short_url',
        affiliate_platform: product.sourcePlatform || null,
        product: product.id,
        metadata: {
          product_code: product.productCode,
          destination: destinationUrl,
          source: 'short_url',
        },
      },
    }),
  }).catch(() => {});
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function GoPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const [{ code }, sp] = await Promise.all([params, searchParams]);
  const productCode = code.toUpperCase();

  const reqHeaders = await headers();

  const [product, patterns] = await Promise.all([
    lookupProduct(productCode),
    getAffiliatePatterns(),
  ]);

  if (!product) {
    redirect(`/products?search=${encodeURIComponent(productCode)}`);
  }

  const country = (
    sp['country'] ||
    reqHeaders.get('x-vercel-ip-country') ||
    reqHeaders.get('cf-ipcountry') ||
    'US'
  ).trim().toUpperCase();

  const destinationUrl = buildDestinationUrl(product, patterns, country);

  // Fire Strapi tracking after response streams — never blocks the page
  after(() => trackClickInStrapi(reqHeaders, product, destinationUrl));

  return (
    <GoRedirectClient
      destinationUrl={destinationUrl}
      productCode={product.productCode}
      platform={product.sourcePlatform || 'other'}
      productName={product.name}
    />
  );
}
