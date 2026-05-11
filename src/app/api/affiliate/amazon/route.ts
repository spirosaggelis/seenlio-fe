import { NextRequest, NextResponse } from "next/server";

// Country code → Amazon regional domain
const COUNTRY_TO_DOMAIN: Record<string, string> = {
  // Germanic / DACH
  DE: "amazon.de",
  AT: "amazon.de",
  CH: "amazon.de",
  // French-speaking Europe
  FR: "amazon.fr",
  BE: "amazon.fr",
  LU: "amazon.fr",
  // Southern Europe
  IT: "amazon.it",
  ES: "amazon.es",
  PT: "amazon.es",
  // Northern / Eastern Europe
  NL: "amazon.nl",
  SE: "amazon.se",
  PL: "amazon.pl",
  // UK / Ireland
  GB: "amazon.co.uk",
  IE: "amazon.co.uk",
  // Asia-Pacific
  JP: "amazon.co.jp",
  AU: "amazon.com.au",
  IN: "amazon.in",
  SG: "amazon.sg",
  // Americas (non-US)
  CA: "amazon.ca",
  MX: "amazon.com.mx",
  BR: "amazon.com.br",
  // UAE
  AE: "amazon.ae",
  SA: "amazon.sa",
  EG: "amazon.eg",
  TR: "amazon.com.tr",
};

// All European country codes — determines whether to run the EU fallback chain
const EU_COUNTRIES = new Set([
  "DE", "AT", "CH", "FR", "BE", "LU", "IT", "ES", "PT", "GB", "IE",
  "NL", "SE", "PL", "DK", "FI", "NO", "GR", "CY", "MT", "CZ", "SK",
  "HU", "RO", "BG", "HR", "SI", "LT", "LV", "EE", "IS", "AL", "RS",
  "BA", "ME", "MK", "XK", "MD", "UA", "BY",
]);

// European Amazon storefronts in fallback priority order
const EU_DOMAINS = [
  "amazon.de",
  "amazon.co.uk",
  "amazon.fr",
  "amazon.it",
  "amazon.es",
];

// In-memory availability cache: "{asin}:{domain}" → { available, checked }
const availabilityCache = new Map<
  string,
  { available: boolean; checked: number }
>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cache affiliate patterns from Strapi Settings
let cachedRegionalTags: Record<string, string> | null = null;
let cachedDefaultTag: string | null = null;
let cacheChecked = 0;
const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getAffiliateConfig(): Promise<{
  defaultTag: string;
  regionalTags: Record<string, string>;
}> {
  if (cachedRegionalTags && Date.now() - cacheChecked < SETTINGS_CACHE_TTL_MS) {
    return { defaultTag: cachedDefaultTag || "", regionalTags: cachedRegionalTags };
  }

  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
  const token = process.env.STRAPI_API_TOKEN;

  try {
    const res = await fetch(
      `${strapiUrl}/api/setting?populate=affiliatePatterns`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        next: { revalidate: 300 },
      },
    );

    if (res.ok) {
      const json = await res.json();
      const settings = json?.data;
      const patterns = settings?.affiliatePatterns || [];
      const amazonPattern = patterns.find(
        (p: Record<string, unknown>) =>
          p.platform === "amazon" && p.isActive !== false,
      );

      if (amazonPattern) {
        cachedDefaultTag = amazonPattern.paramValue || "";
        cachedRegionalTags =
          (amazonPattern.regionalTags as Record<string, string>) || {};
        cacheChecked = Date.now();
        return { defaultTag: cachedDefaultTag || "", regionalTags: cachedRegionalTags };
      }
    }
  } catch {
    // Fall through to env var fallback
  }

  // Fallback to env var
  const envTag = process.env.AMAZON_ASSOCIATE_TAG || "";
  cachedDefaultTag = envTag;
  cachedRegionalTags = {};
  cacheChecked = Date.now();
  return { defaultTag: envTag, regionalTags: {} };
}

async function isAvailableOnDomain(
  asin: string,
  domain: string,
): Promise<boolean> {
  const key = `${asin}:${domain}`;
  const hit = availabilityCache.get(key);
  if (hit && Date.now() - hit.checked < CACHE_TTL_MS) {
    return hit.available;
  }

  try {
    const res = await fetch(`https://www.${domain}/dp/${asin}`, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(4_000),
    });
    res.body?.cancel();
    const available = res.status < 400;
    availabilityCache.set(key, { available, checked: Date.now() });
    return available;
  } catch {
    availabilityCache.set(key, { available: false, checked: Date.now() });
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const asin = searchParams.get("asin")?.trim().toUpperCase();
  const productCode = searchParams.get("productCode") || "";

  // Dev/testing override: ?country=DE
  const countryOverride = searchParams.get("country");

  if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
    return NextResponse.redirect("https://www.amazon.com", { status: 302 });
  }

  // Geo detection
  const country = (
    countryOverride ||
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    "US"
  )
    .trim()
    .toUpperCase();

  const preferredDomain = COUNTRY_TO_DOMAIN[country] ?? null;
  const { defaultTag, regionalTags } = await getAffiliateConfig();

  const buildUrl = (domain: string): string => {
    const affiliateTag = regionalTags[domain] || defaultTag;
    const params = new URLSearchParams();
    if (affiliateTag) params.set("tag", affiliateTag);
    params.set("utm_source", "seenlio");
    params.set("utm_medium", "amazon");
    if (productCode) params.set("utm_campaign", productCode);
    return `https://www.${domain}/dp/${asin}?${params.toString()}`;
  };

  // EU visitors: try preferred storefront first, then walk the EU fallback chain.
  if (EU_COUNTRIES.has(country)) {
    const checkOrder = preferredDomain
      ? [preferredDomain, ...EU_DOMAINS.filter((d) => d !== preferredDomain)]
      : EU_DOMAINS;

    for (const domain of checkOrder) {
      if (await isAvailableOnDomain(asin, domain)) {
        return NextResponse.redirect(buildUrl(domain), { status: 302 });
      }
    }

    // Nothing in the EU stocked it — fall back to amazon.com (default tag).
    return NextResponse.redirect(buildUrl("amazon.com"), { status: 302 });
  }

  // Non-EU: check the preferred regional storefront once; default to .com.
  if (preferredDomain && preferredDomain !== "amazon.com") {
    if (await isAvailableOnDomain(asin, preferredDomain)) {
      return NextResponse.redirect(buildUrl(preferredDomain), { status: 302 });
    }
  }

  return NextResponse.redirect(buildUrl("amazon.com"), { status: 302 });
}
