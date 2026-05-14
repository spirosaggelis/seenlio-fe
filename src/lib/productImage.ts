/**
 * Resolve the best display image for a Strapi product.
 *
 * Products store imagery in two places:
 *   - `featuredImage` — a single upload-file (optional, often null)
 *   - `media` — a repeatable component (`product.media`) with `url`, `type`,
 *     `isPrimary` fields. Most products only have `media`.
 *
 * The product-detail page picks media[isPrimary] first, then media[0]. Listicle
 * pages should match that fallback chain so images aren't randomly missing.
 */

interface MediaItem {
  url?: string;
  type?: string | null;
  isPrimary?: boolean | null;
}

interface FeaturedImage {
  url?: string;
  formats?: Record<string, { url?: string } | undefined>;
}

export interface ImageSource {
  featuredImage?: FeaturedImage | null;
  media?: MediaItem[] | null;
}

export function resolveProductImage(p: ImageSource): string | undefined {
  if (p.featuredImage?.url) return p.featuredImage.url;
  if (Array.isArray(p.media)) {
    const primary = p.media.find(
      (m) => m && m.url && m.isPrimary && m.type !== 'video',
    );
    if (primary?.url) return primary.url;
    const first = p.media.find((m) => m && m.url && m.type !== 'video');
    if (first?.url) return first.url;
  }
  return undefined;
}
