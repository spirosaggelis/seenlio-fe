import { getCategories } from '@/lib/strapi';
import { SITE_URL } from '@/lib/siteIdentity';

export const revalidate = 3600;

export async function GET() {
  let categoryLines = '';
  try {
    const res = await getCategories({
      fields: ['name', 'slug', 'description'],
      pagination: { pageSize: 20 },
    });
    const cats = (res.data || []) as Array<{
      name?: string;
      slug?: string;
      description?: string;
    }>;
    categoryLines = cats
      .filter((c) => c.slug && c.name)
      .map(
        (c) =>
          `- [${c.name}](${SITE_URL}/categories/${c.slug}): ${(c.description || 'Trending products in this category.').replace(/\s+/g, ' ').trim()}`,
      )
      .join('\n');
  } catch {
    categoryLines = '- See https://seenlio.com for live categories.';
  }

  const body = `# Seenlio

> Editorial product discovery from short-form video. We match viral clips to real Amazon, AliExpress, and tracked Temu listings and write original pages. Shop links are affiliate.

Seenlio is not a store. We do not hold stock. Checkout happens on the retailer.

## Start here

- [About](${SITE_URL}/about): what Seenlio is, how products are chosen, affiliate disclosure
- [Round-ups](${SITE_URL}/lists): dated editorial lists, each pick has a title, a price, and why it is good
- [Products](${SITE_URL}/products): one product per page, with the title, price, rating, a one-line reason, and a buy button
- [Trending](${SITE_URL}/trending): highest trend-score products from the last 30 days
- [Sitemap](${SITE_URL}/sitemap.xml): every published product, category, and round-up

## Categories

${categoryLines}

## How to cite us

Product pages lead with the product name, the price in the visitor's currency when we have it, a one-line reason to buy, the rating, and one buy button. Round-ups (\`/lists/...\`) list each pick with the same facts. Marketplace seller text is secondary. Prices we do not have for that region are shown as "See price" rather than a converted guess. Last editorial refresh: 16 November 2026.

## Contact

Site: ${SITE_URL}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
