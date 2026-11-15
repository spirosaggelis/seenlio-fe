import type { AffiliatePattern } from './affiliateTypes';
import { applyOutboundTracking, type OutboundTraffic } from './outboundTracking';

/** Retired Associates ID. Never attach this to an outbound link. */
export const RETIRED_AMAZON_TAG = 'seenlio-20';

/** US tag used when the database has no replacement for amazon.com. */
export const DEFAULT_US_AMAZON_TAG = 'seenlio05-20';

export const AMAZON_COM = 'amazon.com';
export const AMAZON_DE = 'amazon.de';
export const AMAZON_UK = 'amazon.co.uk';

/** EU member states. UK is not in this set; it has its own store. */
const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE',
]);

export function amazonDomainForCountry(country: string): string {
  const code = (country || '').trim().toUpperCase();
  if (code === 'GB' || code === 'UK') return AMAZON_UK;
  if (EU_COUNTRIES.has(code)) return AMAZON_DE;
  return AMAZON_COM;
}

export function currencyForCountry(country: string): 'USD' | 'EUR' | 'GBP' {
  const domain = amazonDomainForCountry(country);
  if (domain === AMAZON_UK) return 'GBP';
  if (domain === AMAZON_DE) return 'EUR';
  return 'USD';
}

export const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/** Drop blank values and the retired tag. */
export function usableAmazonTag(value: string | undefined | null): string {
  const tag = (value || '').trim();
  if (!tag || tag.toLowerCase() === RETIRED_AMAZON_TAG) return '';
  return tag;
}

/**
 * Store tag from Settings. US falls back to seenlio05-20.
 * DE and UK never inherit the US tag or the retired tag.
 */
export function amazonTagForDomain(
  domain: string,
  pattern?: Pick<AffiliatePattern, 'regionalTags' | 'paramValue'> | null,
): string {
  const regional = usableAmazonTag(pattern?.regionalTags?.[domain]);
  if (regional) return regional;
  if (domain === AMAZON_COM) {
    return usableAmazonTag(pattern?.paramValue) || DEFAULT_US_AMAZON_TAG;
  }
  return '';
}

export function extractAsin(url: string): string | null {
  const match = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : null;
}

function applyAmazonTag(url: URL, tag: string) {
  const current = (url.searchParams.get('tag') || '').trim();
  if (tag) {
    url.searchParams.set('tag', tag);
    return;
  }
  if (!current || current.toLowerCase() === RETIRED_AMAZON_TAG) {
    url.searchParams.delete('tag');
  }
}

export function buildAmazonDestination(options: {
  rawUrl?: string;
  asin?: string;
  country: string;
  productCode: string;
  pattern?: AffiliatePattern | null;
  traffic?: OutboundTraffic;
}): string {
  const domain = amazonDomainForCountry(options.country);
  const tag = amazonTagForDomain(domain, options.pattern);
  const asin = (options.asin || extractAsin(options.rawUrl || '') || '').toUpperCase();

  let url: URL;
  if (/^[A-Z0-9]{10}$/.test(asin)) {
    url = new URL(`https://www.${domain}/dp/${asin}`);
  } else if (options.rawUrl) {
    try {
      url = new URL(options.rawUrl);
      url.protocol = 'https:';
      url.hostname = `www.${domain}`;
    } catch {
      return '';
    }
  } else {
    return '';
  }

  applyAmazonTag(url, tag);
  applyOutboundTracking(url, {
    platform: 'amazon',
    productCode: options.productCode,
    traffic: options.traffic,
  });
  return url.toString();
}
