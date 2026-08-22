const PLATFORM_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  aliexpress: 'AliExpress',
  temu: 'Temu',
  tiktok_shop: 'TikTok Shop',
};

export function affiliateGoHref(productCode: string): string {
  return `/go/${encodeURIComponent(productCode)}`;
}

/** Seenlio-authored intro so product pages are not only marketplace copy. */
export function productEditorialIntro(product: {
  name: string;
  sourcePlatform?: string;
  trendScore?: number;
  categories?: Array<{ name?: string }>;
}): string {
  const platform =
    PLATFORM_LABELS[(product.sourcePlatform || '').toLowerCase()] ||
    'Amazon, Temu, and AliExpress';
  const category = product.categories?.find((c) => c.name)?.name;
  const where = category ? ` in ${category}` : '';
  const score =
    product.trendScore != null && product.trendScore > 0
      ? ` It currently scores ${Math.round(product.trendScore)} on Seenlio’s trend index.`
      : '';
  return `Seenlio spotted this product trending on ${platform}${where}.${score} We track viral consumer products so you can see what is taking off before it saturates.`;
}

export function breadcrumbJsonLd(
  siteUrl: string,
  crumbs: Array<{ name: string; path: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.path}`,
    })),
  };
}

export function offerValidUntil(days = 30): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
