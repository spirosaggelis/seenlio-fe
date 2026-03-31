import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

// geoip-lite uses binary data files that may not resolve in Next.js bundler — load gracefully
let geoip: { lookup: (ip: string) => { country?: string } | null } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  geoip = require('geoip-lite');
} catch {
  // Country detection unavailable (e.g. local dev) — that's fine
}

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType =
  | 'page_view'
  | 'product_view'
  | 'product_click'
  | 'affiliate_click'
  | 'search'
  | 'category_browse'
  | 'filter_use';

type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';

type ReferrerSource =
  | 'direct'
  | 'google'
  | 'facebook'
  | 'twitter'
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'other_social'
  | 'other_search'
  | 'other';

type AffiliatePlatform = 'amazon' | 'aliexpress' | 'temu' | 'tiktok_shop' | 'other';

interface SiteEventPayload {
  event_type: EventType;
  session_id?: string;
  page?: string;
  product_code?: string;
  query?: string;
  results_count?: number;
  filters_json?: Record<string, unknown>;
  affiliate_platform?: AffiliatePlatform;
  duration_ms?: number;
  referrer?: string;
  metadata?: Record<string, unknown>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'default-salt-change-me';
  return createHash('sha256').update(ip + salt).digest('hex').slice(0, 16);
}

function detectDevice(ua: string): DeviceType {
  if (!ua) return 'unknown';
  const lower = ua.toLowerCase();
  if (/tablet|ipad/.test(lower)) return 'tablet';
  if (/mobile|android|iphone|ipod|windows phone/.test(lower)) return 'mobile';
  return 'desktop';
}

function classifyReferrer(referrer: string): ReferrerSource {
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (/google\./.test(host) || /bing\./.test(host) || /yahoo\./.test(host) || /duckduckgo\./.test(host)) {
      return host.includes('google') ? 'google' : 'other_search';
    }
    if (/facebook\.com|fb\.com|instagram\.com/.test(host)) {
      return host.includes('instagram') ? 'instagram' : 'facebook';
    }
    if (/twitter\.com|x\.com/.test(host)) return 'twitter';
    if (/tiktok\.com/.test(host)) return 'tiktok';
    if (/youtube\.com|youtu\.be/.test(host)) return 'youtube';
    if (/pinterest\.com|reddit\.com|linkedin\.com|snapchat\.com/.test(host)) return 'other_social';
    return 'other';
  } catch {
    return 'direct';
  }
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  );
}

async function lookupProductId(productCode: string): Promise<number | null> {
  const strapiUrl = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL;
  const apiToken = process.env.STRAPI_API_TOKEN;
  if (!strapiUrl || !apiToken || !productCode) return null;
  try {
    const res = await fetch(
      `${strapiUrl}/api/products?filters[productCode][$eq]=${encodeURIComponent(productCode)}&fields[0]=id`,
      { headers: { Authorization: `Bearer ${apiToken}` }, next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function writeSiteEvent(payload: Record<string, unknown>): Promise<void> {
  const strapiUrl = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL;
  const apiToken = process.env.STRAPI_API_TOKEN;
  if (!strapiUrl || !apiToken) {
    console.warn('[analytics] Missing STRAPI_URL or STRAPI_API_TOKEN');
    return;
  }
  const res = await fetch(`${strapiUrl}/api/site-events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ data: payload }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`[analytics] Strapi write failed ${res.status}:`, text);
  }
}

async function processEvent(event: SiteEventPayload, req: NextRequest): Promise<void> {
  const ip = getIp(req);
  const ua = req.headers.get('user-agent') || '';
  const ipHash = hashIp(ip);
  const deviceType = detectDevice(ua);
  const referrer = event.referrer || req.headers.get('referer') || '';
  const referrerSource = classifyReferrer(referrer);
  const country = geoip?.lookup(ip)?.country ?? null;

  // Resolve product relation if productCode supplied
  let productId: number | null = null;
  if (event.product_code) {
    productId = await lookupProductId(event.product_code);
  }

  const data: Record<string, unknown> = {
    event_type: event.event_type,
    session_id: event.session_id ?? null,
    page: event.page ?? null,
    query: event.query ?? null,
    results_count: event.results_count ?? null,
    filters_json: event.filters_json ?? null,
    ip_hash: ipHash,
    country,
    device_type: deviceType,
    referrer: referrer || null,
    referrer_source: referrerSource,
    affiliate_platform: event.affiliate_platform ?? null,
    duration_ms: event.duration_ms ?? null,
    metadata: event.metadata ?? null,
  };

  if (productId) {
    data.product = productId;
  }

  await writeSiteEvent(data);
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Support both single event and batch array
    const events: SiteEventPayload[] = Array.isArray(body) ? body : [body];

    // Process all events; fire-and-forget — never block the response on Strapi
    void Promise.allSettled(events.map((e) => processEvent(e, req)));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // always 200 — analytics must never surface errors
  }
}
