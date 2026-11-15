/** Publisher links: /go/CODE?s=fb|ig|yt|pin|tt&ch=... */
export const CHANNEL_SOURCES = ['fb', 'ig', 'yt', 'pin', 'tt'] as const;

export type ChannelSource = (typeof CHANNEL_SOURCES)[number];

export interface OutboundTraffic {
  source: string;
  channel: string;
}

export function parseOutboundTraffic(input: {
  s?: string | null;
  ch?: string | null;
}): OutboundTraffic {
  const raw = (input.s || '').trim().toLowerCase();
  const source = (CHANNEL_SOURCES as readonly string[]).includes(raw) ? raw : '';
  const channel = (input.ch || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 64);
  return { source, channel };
}

/**
 * UTMs on every store. AliExpress also gets a sub_id per platform
 * so the publisher can see which account sent the click.
 */
export function applyOutboundTracking(
  url: URL,
  options: { platform: string; productCode: string; traffic?: OutboundTraffic },
) {
  const source = options.traffic?.source || '';
  const channel = options.traffic?.channel || '';
  url.searchParams.set('utm_source', source || 'seenlio');
  url.searchParams.set('utm_medium', (options.platform || 'affiliate').toLowerCase());
  if (options.productCode) url.searchParams.set('utm_campaign', options.productCode);
  if (channel) url.searchParams.set('utm_content', channel);

  if ((options.platform || '').toLowerCase() === 'aliexpress') {
    const subId = [source, channel].filter(Boolean).join('_').slice(0, 64);
    if (subId) url.searchParams.set('sub_id', subId);
  }
}

export function linkFacts(url: string, platform: string): { store: string; tag: string } {
  try {
    const parsed = new URL(url);
    const store = parsed.hostname.replace(/^www\./, '');
    const tag =
      parsed.searchParams.get('tag') ||
      parsed.searchParams.get('sub_id') ||
      '';
    return { store, tag };
  } catch {
    return { store: platform, tag: '' };
  }
}
