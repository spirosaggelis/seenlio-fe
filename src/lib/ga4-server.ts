// Server-side GA4 via Measurement Protocol.
// Used for routes that redirect away (e.g. /go/[code]) where client-side
// GTM/GA4 cannot reliably deliver page_view before the browser navigates out.

const MEASUREMENT_ID =
  process.env.GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';
const API_SECRET = process.env.GA_API_SECRET || '';
const ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect';

export interface GA4Event {
  name: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export interface SendOptions {
  clientId: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  userId?: string;
  debug?: boolean;
}

/**
 * Parse the `_ga` cookie value to extract the GA4 client_id.
 * Cookie format: `GA1.1.<random>.<timestamp>` → client_id = `<random>.<timestamp>`.
 * Returns null if the cookie is missing or malformed.
 */
export function parseGaClientId(gaCookie: string | undefined | null): string | null {
  if (!gaCookie) return null;
  // Strip the GA1.<n>. prefix (versioned)
  const m = gaCookie.match(/^GA\d+\.\d+\.(\d+\.\d+)$/);
  return m ? m[1] : null;
}

/**
 * Parse the `_ga_<container>` cookie to extract the active session_id.
 * Cookie format (GA4): `GS1.1.<session_id>.<session_number>.<...>`.
 */
export function parseGaSessionId(gaContainerCookie: string | undefined | null): string | null {
  if (!gaContainerCookie) return null;
  const parts = gaContainerCookie.split('.');
  // GS1.1.<session_id>.<...>
  if (parts.length >= 3 && parts[2]) return parts[2];
  return null;
}

/** Generate a fallback client_id in GA4 format: `<random>.<timestamp_seconds>`. */
export function generateClientId(): string {
  const random = Math.floor(Math.random() * 1e10);
  const ts = Math.floor(Date.now() / 1000);
  return `${random}.${ts}`;
}

/**
 * Send one or more events to GA4 via Measurement Protocol.
 * Fire-and-forget — never throws to the caller, never blocks rendering.
 */
export async function sendGA4Events(
  events: GA4Event[],
  opts: SendOptions,
): Promise<void> {
  if (!MEASUREMENT_ID || !API_SECRET) {
    // Silent no-op in dev / missing config — log once for visibility.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[ga4-server] GA_MEASUREMENT_ID or GA_API_SECRET not set; skipping');
    }
    return;
  }

  // GA4 requires engagement_time_msec on each event for it to count toward sessions.
  const enrichedEvents = events.map((e) => ({
    name: e.name,
    params: {
      engagement_time_msec: 1,
      ...(opts.sessionId ? { session_id: opts.sessionId } : {}),
      ...e.params,
    },
  }));

  const body = {
    client_id: opts.clientId,
    ...(opts.userId ? { user_id: opts.userId } : {}),
    events: enrichedEvents,
  };

  const url = `${opts.debug ? DEBUG_ENDPOINT : ENDPOINT}?measurement_id=${encodeURIComponent(
    MEASUREMENT_ID,
  )}&api_secret=${encodeURIComponent(API_SECRET)}`;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (opts.userAgent) headers['User-Agent'] = opts.userAgent;
    // GA4 honors X-Forwarded-For for IP-based geo enrichment.
    if (opts.ipAddress) headers['X-Forwarded-For'] = opts.ipAddress;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3_000),
    });
    if (opts.debug) {
      const text = await res.text();
      console.log(`[ga4-server] debug response ${res.status}: ${text}`);
    }
  } catch (err) {
    console.log(`[ga4-server] send failed: ${err}`);
  }
}
