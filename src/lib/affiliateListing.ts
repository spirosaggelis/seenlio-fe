import type { AffiliateProductInput } from './affiliateDestination';
import { affiliateGoHref } from './productSeo';
import { isHiddenTemuProduct } from './temuAffiliate';

/**
 * Shop links go through /go/[code] so listing HTML can be cached.
 * Geo / affiliate resolution happens on click, not at render time.
 * Temu products without a temu.to link are left out of the catalog.
 */
export async function resolveListingProducts<T extends AffiliateProductInput>(
  products: T[],
): Promise<(T & { affiliateHref: string })[]> {
  return products
    .filter((product) => !isHiddenTemuProduct(product))
    .map((product) => ({
      ...product,
      affiliateHref: affiliateGoHref(product.productCode),
    }));
}
