import { getCategories, getProducts, PUBLISHED_PRODUCT_FILTER } from '@/lib/strapi';
import { SITE_URL } from '@/lib/siteIdentity';
import {
  displayName,
  factualProductLine,
  isMarketplaceBlurb,
  scrubClosedRetailerClaims,
} from '@/lib/productSeo';

export const revalidate = 3600;

const PRODUCT_CAP = 40;

export async function GET() {
  const lines: string[] = [
    '# Seenlio catalog index',
    '',
    'Short index of categories and a capped set of current products. Prices are the stored listing currency, not a converted guess. "See price" means the catalog has no numeric price.',
    '',
    '## Categories',
  ];

  try {
    const res = await getCategories({
      fields: ['name', 'slug', 'description'],
      pagination: { pageSize: 20 },
    });
    const cats = (res.data || []) as Array<{ name?: string; slug?: string; description?: string }>;
    for (const cat of cats) {
      if (!cat.slug || !cat.name) continue;
      const blurb = scrubClosedRetailerClaims(
        (cat.description || 'Trending products in this category.').replace(/\s+/g, ' ').trim(),
      );
      lines.push(`- [${cat.name}](${SITE_URL}/categories/${cat.slug}): ${blurb}`);
    }
  } catch {
    lines.push('- Categories are listed on the site when the catalog is available.');
  }

  lines.push('', '## Products', '');

  try {
    const res = await getProducts({
      filters: { ...PUBLISHED_PRODUCT_FILTER },
      sort: ['trendScore:desc'],
      pagination: { pageSize: PRODUCT_CAP },
    });
    const products = (res.data || []) as Array<{
      name?: string;
      slug?: string;
      sourcePlatform?: string;
      shortDescription?: string;
      categories?: Array<{ name?: string }>;
      seo?: { metaTitle?: string };
      pricePoints?: Array<{ price?: number; currency?: string }>;
    }>;
    for (const product of products) {
      if (!product.slug || !product.name) continue;
      const title = displayName(product.name, product.seo?.metaTitle);
      const price = product.pricePoints?.[0];
      const priceLabel =
        price?.price != null
          ? `${price.price} ${(price.currency || 'USD').toUpperCase()}`
          : 'See price';
      const short = product.shortDescription?.replace(/\s+/g, ' ').trim();
      const reason =
        short && !isMarketplaceBlurb(short, product.name)
          ? short.slice(0, 180)
          : factualProductLine({
              name: product.name,
              sourcePlatform: product.sourcePlatform,
              categories: product.categories,
              seo: product.seo,
            });
      lines.push(`- [${title}](${SITE_URL}/products/${product.slug}): ${priceLabel}. ${reason}`);
    }
  } catch {
    lines.push('Product list unavailable.');
  }

  lines.push('', `Capped at ${PRODUCT_CAP} products, ordered by trend score. Full URL list: ${SITE_URL}/sitemap.xml`);

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
