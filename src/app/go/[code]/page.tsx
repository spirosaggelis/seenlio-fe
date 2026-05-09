import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import type { Metadata } from 'next';
import GoRedirectClient from './GoRedirectClient';
import {
  sendGA4Events,
  parseGaClientId,
  parseGaSessionId,
  generateClientId,
} from '@/lib/ga4-server';
import { resolveTrafficSource } from '@/lib/traffic-source';
import { parseDevice, readGeoHeaders } from '@/lib/request-enrichment';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// ── Config ─────────────────────────────────────────────────────────────────

const STRAPI_URL =
  process.env.STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';

// EU countries that map directly to one of the 5 affiliate stores
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

// All European country codes — determines whether to run the EU affiliate fallback chain
const EU_COUNTRIES = new Set([
  'DE',
  'AT',
  'CH',
  'FR',
  'BE',
  'LU',
  'IT',
  'ES',
  'PT',
  'GB',
  'IE',
  'NL',
  'SE',
  'PL',
  'DK',
  'FI',
  'NO',
  'GR',
  'CY',
  'MT',
  'CZ',
  'SK',
  'HU',
  'RO',
  'BG',
  'HR',
  'SI',
  'LT',
  'LV',
  'EE',
  'IS',
  'AL',
  'RS',
  'BA',
  'ME',
  'MK',
  'XK',
  'MD',
  'UA',
  'BY',
]);

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
        headers: STRAPI_TOKEN
          ? { Authorization: `Bearer ${STRAPI_TOKEN}` }
          : {},
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
        headers: STRAPI_TOKEN
          ? { Authorization: `Bearer ${STRAPI_TOKEN}` }
          : {},
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

// European Amazon domains in fallback priority order
const EU_DOMAINS = [
  'amazon.de',
  'amazon.co.uk',
  'amazon.fr',
  'amazon.it',
  'amazon.es',
  /*, 'amazon.nl', 'amazon.se', 'amazon.pl',*/
];

// 24h in-memory availability cache — persists across requests in the same process
const AVAILABILITY_CACHE = new Map<
  string,
  { available: boolean; checked: number }
>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

async function isAvailableOnDomain(
  asin: string,
  domain: string,
): Promise<boolean> {
  const key = `${asin}:${domain}`;
  const hit = AVAILABILITY_CACHE.get(key);
  if (hit && Date.now() - hit.checked < CACHE_TTL) {
    console.log(`[go] cache hit ${domain} → available=${hit.available}`);
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
    // Cancel body immediately — we only care about the status
    res.body?.cancel();
    // 2xx = available, 3xx redirect = available (product exists, Amazon is routing it)
    const available = res.status < 400;
    console.log(
      `[go] GET ${domain}/dp/${asin} → ${res.status} available=${available}`,
    );
    AVAILABILITY_CACHE.set(key, { available, checked: Date.now() });
    return available;
  } catch (err) {
    console.log(`[go] GET ${domain}/dp/${asin} → ERROR: ${err}`);
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

async function buildDestinationUrl(
  product: Product,
  patterns: AffiliatePattern[],
  country: string,
): Promise<string> {
  const platform = product.sourcePlatform || '';
  const activeLink = product.affiliateLinks?.find(
    (l) => l.isActive !== false && l.url,
  );
  const rawUrl = activeLink?.url || product.sourceUrl || '';
  if (!rawUrl) return 'https://seenlio.com/products';

  const pattern = patterns.find(
    (p) => p.platform === platform && p.isActive !== false,
  );

  if (platform === 'amazon' && pattern?.useGeoRedirect) {
    const asin = extractAsin(rawUrl);
    console.log(
      `[go] amazon geo-redirect | country=${country} asin=${asin} rawUrl=${rawUrl}`,
    );
    if (asin) {
      const preferredDomain = COUNTRY_TO_DOMAIN[country] ?? null;

      // Only run EU chain for European visitors
      if (!EU_COUNTRIES.has(country)) {
        // Non-EU: keep original URL with default affiliate tag
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

      // EU: preferred affiliate domain first (if mapped), then rest of EU_DOMAINS in priority order
      const checkOrder = preferredDomain
        ? [preferredDomain, ...EU_DOMAINS.filter((d) => d !== preferredDomain)]
        : EU_DOMAINS;

      console.log(`[go] checkOrder=${checkOrder.join(', ')}`);

      for (const domain of checkOrder) {
        if (await isAvailableOnDomain(asin, domain)) {
          return buildAmazonUrl(asin, domain, product.productCode, pattern);
        }
      }

      // Nothing found in EU — keep original URL with affiliate tag
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
  const cookieStore = await cookies();

  const [product, patterns] = await Promise.all([
    lookupProduct(productCode),
    getAffiliatePatterns(),
  ]);

  if (!product) {
    redirect(`/products?search=${encodeURIComponent(productCode)}`);
  }

  const geo = readGeoHeaders((n) => reqHeaders.get(n));
  const country = sp['country']?.trim().toUpperCase() || geo.country || '';

  console.log(
    `[go] product=${product.productCode} platform=${product.sourcePlatform} country=${country} patterns=${patterns.length}`,
  );
  const destinationUrl = await buildDestinationUrl(product, patterns, country);
  console.log(`[go] destinationUrl=${destinationUrl}`);

  // Server-side GA4 tracking — fires reliably regardless of redirect timing,
  // ad blockers, or in-app browsers. Client-side GTM is disabled on /go/* in
  // GtmScript.tsx, so this is the single source of truth for /go events.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com';
  const pageLocation = `${siteUrl}/go/${product.productCode}`;
  const referrer = reqHeaders.get('referer') || '';
  const userAgent = reqHeaders.get('user-agent') || '';
  const xff = reqHeaders.get('x-forwarded-for') || '';
  const ipAddress = xff.split(',')[0]?.trim() || '';

  // client_id: prefer existing GA `_ga` cookie (links the same user across the
  // site), then our persistent fallback set by middleware (`seenlio_cid`),
  // then a fresh random id as last resort.
  const gaCookie = cookieStore.get('_ga')?.value;
  const seenlioCid = cookieStore.get('seenlio_cid')?.value;
  const clientId =
    parseGaClientId(gaCookie) || seenlioCid || generateClientId();

  // session_id: prefer the GA4 session cookie (`_ga_<container>`); fall back
  // to our rolling 30-min session cookie set by middleware.
  let sessionId: string | undefined;
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith('_ga_')) {
      const sid = parseGaSessionId(c.value);
      if (sid) {
        sessionId = sid;
        break;
      }
    }
  }
  const seenlioSid = cookieStore.get('seenlio_sid')?.value;
  if (!sessionId && seenlioSid) sessionId = seenlioSid;

  // A "new session" for our purposes = no `_ga_*` AND the seenlio_sid cookie
  // wasn't on the request (middleware just minted it). We detect the latter
  // by absence: if the request came in without seenlio_sid, this is a session
  // start. We need to fire `session_start` so GA4 counts it as a real session.
  const isNewSession = !sessionId || (!gaCookie && !seenlioSid);

  // Resolve traffic source from referer + query params (utm_*, fbclid, gclid).
  const traffic = resolveTrafficSource(referrer, sp);
  const device = parseDevice(userAgent);

  // Shared params attached to every /go event so they are queryable as custom
  // dimensions in GA4 (geo.* and device.* are NOT auto-filled for MP requests).
  const sharedAttribution = {
    source: traffic.source,
    medium: traffic.medium,
    campaign: traffic.campaign,
    term: traffic.term,
    content: traffic.content,
    country,
    region: geo.region,
    city: geo.city,
    device_category: device.category,
    browser: device.browser,
    os: device.os,
  };

  const events = [];
  if (isNewSession) {
    events.push({
      name: 'session_start',
      params: {
        ...sharedAttribution,
        page_location: pageLocation,
        page_referrer: referrer,
      },
    });
  }
  events.push({
    name: 'page_view',
    params: {
      page_location: pageLocation,
      page_title: `Redirect — ${product.productCode}`,
      page_referrer: referrer,
      ...sharedAttribution,
    },
  });
  events.push({
    name: 'affiliate_click',
    params: {
      product_code: product.productCode,
      platform: product.sourcePlatform || 'other',
      destination_url: destinationUrl,
      click_source: 'short_url',
      ...sharedAttribution,
    },
  });

  // Fire-and-forget — do not await; the redirect interstitial renders immediately.
  void sendGA4Events(events, { clientId, sessionId, userAgent, ipAddress });

  return (
    <GoRedirectClient
      destinationUrl={destinationUrl}
      platform={product.sourcePlatform || 'other'}
      productName={product.name}
    />
  );
}
