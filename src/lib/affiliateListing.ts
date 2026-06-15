import { headers } from 'next/headers';
import type { AffiliatePattern } from './affiliateTypes';
import {
  attachAffiliateHrefs,
  getVisitorCountry,
  type AffiliateProductInput,
} from './affiliateDestination';
import { getSettings } from './strapi';

/** Resolve final affiliate URLs for listing grids (same logic as /go). */
export async function resolveListingProducts<T extends AffiliateProductInput>(
  products: T[],
): Promise<(T & { affiliateHref: string })[]> {
  if (products.length === 0) return [];

  const [reqHeaders, settings] = await Promise.all([headers(), getSettings()]);
  const patterns =
    ((settings as Record<string, unknown> | null)?.affiliatePatterns as
      | AffiliatePattern[]
      | undefined) ?? [];
  const country = getVisitorCountry(reqHeaders);

  return attachAffiliateHrefs(products, patterns, country);
}
