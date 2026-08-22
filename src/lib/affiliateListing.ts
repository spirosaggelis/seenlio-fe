import type { AffiliateProductInput } from './affiliateDestination';
import { affiliateGoHref } from './productSeo';

/**
 * Shop links go through /go/[code] so listing HTML can be cached.
 * Geo / affiliate resolution happens on click, not at render time.
 */
export async function resolveListingProducts<T extends AffiliateProductInput>(
  products: T[],
): Promise<(T & { affiliateHref: string })[]> {
  return products.map((product) => ({
    ...product,
    affiliateHref: affiliateGoHref(product.productCode),
  }));
}
