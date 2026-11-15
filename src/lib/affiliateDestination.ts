import type { AffiliatePattern } from './affiliateTypes';
import { buildAmazonDestination } from './amazonRouting';
import {
  applyOutboundTracking,
  linkFacts,
  type OutboundTraffic,
} from './outboundTracking';
import { resolveTemuDestinationUrl } from './temuAffiliate';

export interface AffiliateLink {
  platform: string;
  url: string;
  isActive?: boolean;
}

export interface AffiliateProductInput {
  productCode: string;
  sourcePlatform?: string;
  sourceUrl?: string;
  affiliateLinks?: AffiliateLink[];
}

export interface AffiliateDestinationOverrides {
  platform?: string;
  rawUrl?: string;
  traffic?: OutboundTraffic;
}

export interface ResolvedAffiliateLink {
  url: string;
  store: string;
  tag: string;
}

export function getVisitorCountry(
  requestHeaders: Headers,
  countryOverride?: string | null,
): string {
  return (
    countryOverride ||
    requestHeaders.get('x-vercel-ip-country') ||
    requestHeaders.get('cf-ipcountry') ||
    'US'
  )
    .trim()
    .toUpperCase();
}

function activeRawUrl(product: AffiliateProductInput, overrides?: AffiliateDestinationOverrides): string {
  return (
    overrides?.rawUrl ??
    product.affiliateLinks?.find((link) => link.isActive !== false && link.url)?.url ??
    product.sourceUrl ??
    ''
  );
}

/**
 * Final outbound URL for /go/{code}.
 * Amazon is only .com, .de, or .co.uk. The retired seenlio-20 tag is never used.
 */
export function resolveAffiliateDestination(
  product: AffiliateProductInput,
  patterns: AffiliatePattern[],
  country: string,
  overrides?: AffiliateDestinationOverrides,
): ResolvedAffiliateLink {
  const platform = (overrides?.platform || product.sourcePlatform || '').toLowerCase();
  const rawUrl = activeRawUrl(product, overrides);
  const pattern = patterns.find((item) => item.platform === platform && item.isActive !== false);
  const traffic = overrides?.traffic;

  let url = '';
  if (platform === 'temu') {
    url = resolveTemuDestinationUrl(rawUrl, pattern, product.productCode, traffic);
  } else if (platform === 'amazon') {
    url = buildAmazonDestination({
      rawUrl,
      country,
      productCode: product.productCode,
      pattern,
      traffic,
    });
  } else if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (pattern) {
        if (
          pattern.paramName &&
          pattern.paramValue &&
          pattern.paramValue.trim().toLowerCase() !== 'seenlio-20'
        ) {
          parsed.searchParams.set(pattern.paramName, pattern.paramValue);
        }
        if (pattern.extraParams) {
          for (const [key, value] of Object.entries(pattern.extraParams)) {
            parsed.searchParams.set(key, value);
          }
        }
      }
      applyOutboundTracking(parsed, {
        platform: platform || 'other',
        productCode: product.productCode,
        traffic,
      });
      url = parsed.toString();
    } catch {
      url = '';
    }
  }

  const facts = linkFacts(url, platform || 'other');
  return { url, store: facts.store, tag: facts.tag };
}

export async function buildAffiliateDestinationUrl(
  product: AffiliateProductInput,
  patterns: AffiliatePattern[],
  country: string,
  overrides?: AffiliateDestinationOverrides,
): Promise<string> {
  const resolved = await resolveAffiliateDestination(product, patterns, country, overrides);
  return resolved.url;
}

export async function attachAffiliateHrefs<T extends AffiliateProductInput>(
  products: T[],
  patterns: AffiliatePattern[],
  country: string,
): Promise<(T & { affiliateHref: string })[]> {
  return Promise.all(
    products.map(async (product) => ({
      ...product,
      affiliateHref: await buildAffiliateDestinationUrl(product, patterns, country),
    })),
  );
}
