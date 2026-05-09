// Map a referrer URL to GA4-style source/medium pairs, mirroring the basic
// classification GA4 applies to client-side traffic. Used on /go/* where
// we send events via Measurement Protocol and must pass attribution
// explicitly — GA4 does not infer source/medium from `page_referrer` for MP.

export interface TrafficSource {
  source: string;
  medium: string;
  campaign?: string;
  term?: string;
  content?: string;
}

const SOCIAL_HOSTS: Record<string, string> = {
  'facebook.com': 'facebook',
  'm.facebook.com': 'facebook',
  'l.facebook.com': 'facebook',
  'lm.facebook.com': 'facebook',
  'web.facebook.com': 'facebook',
  'instagram.com': 'instagram',
  'l.instagram.com': 'instagram',
  'tiktok.com': 'tiktok',
  'www.tiktok.com': 'tiktok',
  'x.com': 'twitter',
  'twitter.com': 'twitter',
  't.co': 'twitter',
  'pinterest.com': 'pinterest',
  'pin.it': 'pinterest',
  'linkedin.com': 'linkedin',
  'lnkd.in': 'linkedin',
  'reddit.com': 'reddit',
  'youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'snapchat.com': 'snapchat',
  'whatsapp.com': 'whatsapp',
};

const SEARCH_HOSTS: Record<string, string> = {
  'google.com': 'google',
  'www.google.com': 'google',
  'bing.com': 'bing',
  'www.bing.com': 'bing',
  'duckduckgo.com': 'duckduckgo',
  'yahoo.com': 'yahoo',
  'search.yahoo.com': 'yahoo',
};

function stripWww(host: string): string {
  return host.replace(/^www\./, '').toLowerCase();
}

function matchHost(host: string, table: Record<string, string>): string | null {
  const lower = host.toLowerCase();
  if (table[lower]) return table[lower];
  const stripped = stripWww(lower);
  if (table[stripped]) return table[stripped];
  // Match any subdomain of a known host (e.g. m.facebook.com → facebook.com)
  for (const known of Object.keys(table)) {
    if (lower.endsWith('.' + known)) return table[known];
  }
  return null;
}

/**
 * Resolve traffic source with this priority:
 *   1. utm_* query params (always wins)
 *   2. gclid → google/cpc
 *   3. fbclid → facebook/paid_social (best guess; could be organic)
 *   4. referer host classification (social, search, referral)
 *   5. (direct) / (none)
 */
export function resolveTrafficSource(
  referer: string,
  query: Record<string, string>,
): TrafficSource {
  const utmSource = query['utm_source'];
  const utmMedium = query['utm_medium'];
  if (utmSource) {
    return {
      source: utmSource,
      medium: utmMedium || 'referral',
      campaign: query['utm_campaign'],
      term: query['utm_term'],
      content: query['utm_content'],
    };
  }

  if (query['gclid']) {
    return { source: 'google', medium: 'cpc', campaign: query['utm_campaign'] };
  }
  if (query['fbclid']) {
    return { source: 'facebook', medium: 'paid_social', campaign: query['utm_campaign'] };
  }

  if (referer) {
    try {
      const refUrl = new URL(referer);
      const host = refUrl.hostname;
      const social = matchHost(host, SOCIAL_HOSTS);
      if (social) return { source: social, medium: 'social' };
      const search = matchHost(host, SEARCH_HOSTS);
      if (search) return { source: search, medium: 'organic' };
      return { source: stripWww(host), medium: 'referral' };
    } catch {
      // fall through
    }
  }

  return { source: '(direct)', medium: '(none)' };
}
