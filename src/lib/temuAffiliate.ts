import type { AffiliatePattern } from './affiliateTypes';
import { applyOutboundTracking, type OutboundTraffic } from './outboundTracking';

export interface TemuLinkInput {
  url?: string;
  isActive?: boolean;
}

export interface TemuProductInput {
  sourcePlatform?: string;
  affiliateLinks?: TemuLinkInput[];
}

/** A click only counts when the link is a temu.to short link. */
export function isTemuToUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    return host === 'temu.to' || host.endsWith('.temu.to');
  } catch {
    return false;
  }
}

export function hasTemuToLink(product: TemuProductInput): boolean {
  return (product.affiliateLinks || []).some(
    (link) => link.isActive !== false && !!link.url && isTemuToUrl(link.url),
  );
}

/** The Temu affiliate account is closed. Listings without a temu.to link stay off the site. */
export function isHiddenTemuProduct(product: TemuProductInput): boolean {
  return (product.sourcePlatform || '').toLowerCase() === 'temu' && !hasTemuToLink(product);
}

/** Strapi filter: published products that are not untracked Temu listings. */
export function visibleCatalogFilters(
  filters?: Record<string, unknown>,
): Record<string, unknown> {
  const visible = {
    $or: [
      { sourcePlatform: { $null: true } },
      { sourcePlatform: { $ne: 'temu' } },
      { affiliateLinks: { url: { $contains: 'temu.to' } } },
    ],
  };
  if (!filters || Object.keys(filters).length === 0) return visible;
  return { $and: [filters, visible] };
}

/**
 * Only official temu.to links go out. Bare temu.com product pages are not affiliate clicks.
 */
export function resolveTemuDestinationUrl(
  rawUrl: string,
  _pattern: AffiliatePattern | undefined,
  productCode: string,
  traffic?: OutboundTraffic,
): string {
  if (!rawUrl || !isTemuToUrl(rawUrl)) return '';
  try {
    const url = new URL(rawUrl);
    applyOutboundTracking(url, { platform: 'temu', productCode, traffic });
    return url.toString();
  } catch {
    return '';
  }
}
