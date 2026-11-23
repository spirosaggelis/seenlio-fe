/** Rewritten editorial body must be at least this long to be indexed. */
export const SEO_READY_MIN_WORDS = 150;

export type IndexableProduct = {
  seoReady?: boolean | null;
  seo?: {
    structuredData?: {
      editorialIntro?: string | null;
    } | null;
  } | null;
};

export function editorialIntroText(product: IndexableProduct): string {
  const intro = product.seo?.structuredData?.editorialIntro;
  return typeof intro === 'string' ? intro.trim() : '';
}

export function wordCount(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Indexable when the CMS flag is on, or when it is unset and the page has a
 * rewritten editorial intro of at least ~150 words. An explicit false always
 * stays out of the index and the sitemaps.
 */
export function isProductIndexable(product: IndexableProduct): boolean {
  if (product.seoReady === true) return true;
  if (product.seoReady === false) return false;
  const intro = editorialIntroText(product);
  if (!intro) return false;
  return wordCount(intro) >= SEO_READY_MIN_WORDS;
}
