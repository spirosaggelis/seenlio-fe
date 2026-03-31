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
  // Northern / Eastern Europe
  NL: "amazon.nl",
  SE: "amazon.se",
  PL: "amazon.pl",
  // UK
  GB: "amazon.co.uk",
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
      method: "HEAD",
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Seenlio/1.0; +https://seenlio.com)",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(5_000),
    });
    const available = res.status < 400;
    availabilityCache.set(key, { available, checked: Date.now() });
    return available;
  } catch {
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

  const targetDomain = COUNTRY_TO_DOMAIN[country] ?? null;

  // Build final destination URL
  let finalDomain = "amazon.com";

  if (targetDomain && targetDomain !== "amazon.com") {
    const available = await isAvailableOnDomain(asin, targetDomain);
    if (available) {
      finalDomain = targetDomain;
    }
  }

  // Get the right affiliate tag for this domain
  const { defaultTag, regionalTags } = await getAffiliateConfig();
  const affiliateTag = regionalTags[finalDomain] || defaultTag;

  const params = new URLSearchParams();
  if (affiliateTag) params.set("tag", affiliateTag);
  params.set("utm_source", "seenlio");
  params.set("utm_medium", "amazon");
  if (productCode) params.set("utm_campaign", productCode);

  const dest = `https://www.${finalDomain}/dp/${asin}?${params.toString()}`;

  return NextResponse.redirect(dest, { status: 302 });
}
