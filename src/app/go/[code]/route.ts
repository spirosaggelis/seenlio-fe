import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

/**
 * Short-URL redirect: seenlio.com/go/VPXXXX
 *
 * 1. Looks up the product by productCode in Strapi
 * 2. Records an affiliate_click event (server-side, fire-and-forget)
 * 3. Builds the affiliate URL (with pattern from Settings)
 * 4. Redirects instantly (302) to the store
 *
 * Fallback: if product not found, redirects to seenlio.com/products?search=CODE
 */

const STRAPI_URL =
  process.env.STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  "http://localhost:1337";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || "";

// ── Amazon geo-redirect helpers ────────────────────────────────────────────

const COUNTRY_TO_DOMAIN: Record<string, string> = {
  DE: "amazon.de",
  AT: "amazon.de",
  CH: "amazon.de",
  FR: "amazon.fr",
  BE: "amazon.fr",
  IT: "amazon.it",
  ES: "amazon.es",
  NL: "amazon.nl",
  SE: "amazon.se",
  PL: "amazon.pl",
  GB: "amazon.co.uk",
  JP: "amazon.co.jp",
  AU: "amazon.com.au",
  IN: "amazon.in",
  CA: "amazon.ca",
  MX: "amazon.com.mx",
  BR: "amazon.com.br",
  AE: "amazon.ae",
  SA: "amazon.sa",
  TR: "amazon.com.tr",
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

interface ProductResult {
  id: number;
  documentId?: string;
  productCode: string;
  sourceUrl?: string;
  sourcePlatform?: string;
  affiliateLinks?: Array<{
    platform: string;
    url: string;
    isActive?: boolean;
  }>;
}

// ── Cache ──────────────────────────────────────────────────────────────────

let cachedPatterns: AffiliatePattern[] | null = null;
let patternsCachedAt = 0;
const PATTERN_CACHE_TTL = 5 * 60 * 1000; // 5 min

async function getAffiliatePatterns(): Promise<AffiliatePattern[]> {
  if (cachedPatterns && Date.now() - patternsCachedAt < PATTERN_CACHE_TTL) {
    return cachedPatterns;
  }
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
      cachedPatterns = json?.data?.affiliatePatterns || [];
      patternsCachedAt = Date.now();
      return cachedPatterns!;
    }
  } catch {
    // fall through
  }
  return cachedPatterns || [];
}

// ── Product lookup ─────────────────────────────────────────────────────────

async function lookupProduct(
  code: string,
): Promise<ProductResult | null> {
  try {
    const res = await fetch(
      `${STRAPI_URL}/api/products?filters[productCode][$eq]=${encodeURIComponent(code)}&filters[productStatus][$eq]=published&populate[0]=affiliateLinks&fields[0]=id&fields[1]=productCode&fields[2]=sourceUrl&fields[3]=sourcePlatform`,
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

// ── URL building ───────────────────────────────────────────────────────────

function extractAsin(url: string): string | null {
  const m = url.match(/\/dp\/([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
}

function buildStoreUrl(
  product: ProductResult,
  patterns: AffiliatePattern[],
  country: string,
): string {
  const platform = product.sourcePlatform || "";

  // Prefer active affiliate link stored on the product
  const activeLink = product.affiliateLinks?.find(
    (l) => l.isActive !== false && l.url,
  );

  const rawUrl = activeLink?.url || product.sourceUrl || "";
  if (!rawUrl) return `https://seenlio.com/products`;

  const pattern = patterns.find(
    (p) => p.platform === platform && p.isActive !== false,
  );

  // Amazon geo-redirect
  if (platform === "amazon" && pattern?.useGeoRedirect) {
    const asin = extractAsin(rawUrl);
    if (asin) {
      const targetDomain = COUNTRY_TO_DOMAIN[country] ?? "amazon.com";
      const regionalTags = pattern.regionalTags || {};
      const tag = regionalTags[targetDomain] || pattern.paramValue || "";
      const params = new URLSearchParams();
      if (tag) params.set("tag", tag);
      params.set("utm_source", "seenlio");
      params.set("utm_medium", "amazon");
      params.set("utm_campaign", product.productCode);
      return `https://www.${targetDomain}/dp/${asin}?${params.toString()}`;
    }
  }

  // Other platforms: apply affiliate pattern
  try {
    const url = new URL(rawUrl);
    if (pattern) {
      url.searchParams.set(pattern.paramName, pattern.paramValue);
      if (pattern.extraParams && typeof pattern.extraParams === "object") {
        for (const [k, v] of Object.entries(pattern.extraParams)) {
          url.searchParams.set(k, v);
        }
      }
    }
    url.searchParams.set("utm_source", "seenlio");
    url.searchParams.set("utm_medium", platform || "other");
    url.searchParams.set("utm_campaign", product.productCode);
    return url.toString();
  } catch {
    return rawUrl;
  }
}

// ── Analytics (fire-and-forget) ────────────────────────────────────────────

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || "default-salt-change-me";
  return createHash("sha256")
    .update(ip + salt)
    .digest("hex")
    .slice(0, 16);
}

function detectDevice(
  ua: string,
): "mobile" | "desktop" | "tablet" | "unknown" {
  if (!ua) return "unknown";
  const lower = ua.toLowerCase();
  if (/tablet|ipad/.test(lower)) return "tablet";
  if (/mobile|android|iphone|ipod|windows phone/.test(lower)) return "mobile";
  return "desktop";
}

function classifyReferrer(
  referrer: string,
): string {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (/tiktok\.com/.test(host)) return "tiktok";
    if (/youtube\.com|youtu\.be/.test(host)) return "youtube";
    if (/instagram\.com/.test(host)) return "instagram";
    if (/facebook\.com|fb\.com/.test(host)) return "facebook";
    if (/twitter\.com|x\.com/.test(host)) return "twitter";
    if (/pinterest\.com/.test(host)) return "pinterest";
    if (/google\./.test(host)) return "google";
    return "other";
  } catch {
    return "direct";
  }
}

async function trackClick(
  req: NextRequest,
  product: ProductResult,
  destinationUrl: string,
): Promise<void> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ua = req.headers.get("user-agent") || "";
  const referrer = req.headers.get("referer") || "";

  const data: Record<string, unknown> = {
    event_type: "affiliate_click",
    page: `/go/${product.productCode}`,
    ip_hash: hashIp(ip),
    country:
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      null,
    device_type: detectDevice(ua),
    referrer: referrer || null,
    referrer_source: classifyReferrer(referrer),
    click_source: "short_url",
    affiliate_platform: product.sourcePlatform || null,
    product: product.id,
    metadata: {
      product_code: product.productCode,
      destination: destinationUrl,
      source: "short_url",
    },
  };

  try {
    await fetch(`${STRAPI_URL}/api/site-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({ data }),
    });
  } catch {
    // Never let tracking failure block the redirect
  }
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const productCode = code.toUpperCase();

  // Look up product and affiliate patterns in parallel
  const [product, patterns] = await Promise.all([
    lookupProduct(productCode),
    getAffiliatePatterns(),
  ]);

  if (!product) {
    return NextResponse.redirect(
      new URL(`/products?search=${encodeURIComponent(productCode)}`, request.url),
      { status: 302 },
    );
  }

  // Detect country for geo-aware affiliate links
  const country = (
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    "US"
  )
    .trim()
    .toUpperCase();

  const destinationUrl = buildStoreUrl(product, patterns, country);

  // Track server-side (Strapi site-events) after response
  after(() => trackClick(request, product, destinationUrl));

  // Serve a minimal HTML page so the browser runs JS and fires GTM/dataLayer.
  // meta-refresh is the fallback for no-JS environments.
  // The page is invisible and redirects in <100 ms.
  const platform = product.sourcePlatform || "amazon";
  const dest = destinationUrl.replace(/'/g, "\\'");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=${destinationUrl}">
<title>Redirecting…</title>
<script>
(function(){
  var dl = window.dataLayer = window.dataLayer || [];
  dl.push({
    event: 'affiliate_click',
    product_code: '${productCode}',
    platform: '${platform}',
    click_source: 'short_url',
    destination_url: '${dest}'
  });
  // Also hit /api/analytics so Strapi records it client-side
  try {
    var body = JSON.stringify([{
      event_type: 'affiliate_click',
      product_code: '${productCode}',
      affiliate_platform: '${platform}',
      click_source: 'short_url',
      page: '/go/${productCode}',
      metadata: { url: '${dest}' }
    }]);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', new Blob([body], {type:'application/json'}));
    } else {
      fetch('/api/analytics', {method:'POST', headers:{'Content-Type':'application/json'}, body: body, keepalive: true});
    }
  } catch(e){}
  window.location.replace('${dest}');
})();
</script>
</head>
<body></body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
