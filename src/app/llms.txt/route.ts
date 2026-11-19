import { getCategories } from '@/lib/strapi';
import { SITE_URL } from '@/lib/siteIdentity';
import { scrubClosedRetailerClaims } from '@/lib/productSeo';

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
          `- [${c.name}](${SITE_URL}/categories/${c.slug}): ${scrubClosedRetailerClaims((c.description || 'Trending products in this category.').replace(/\s+/g, ' ').trim())}`,
      )
      .join('\n');
  } catch {
    categoryLines = '- See https://seenlio.com for live categories.';
  }

  const body = `# Seenlio

> Editorial product discovery from short-form video. We match viral clips to real Amazon (US, DE, and UK) and AliExpress listings and write original pages. Shop links are affiliate. Checkout is on the retailer.

Seenlio is not a store. We do not hold stock.

## Start here

- [About](${SITE_URL}/about): what Seenlio is, how products are chosen, affiliate disclosure
- [Round-ups](${SITE_URL}/lists): dated editorial lists
- [Products](${SITE_URL}/products): one product per page, with a Seenlio write-up and a shop button
- [Trending](${SITE_URL}/trending): highest trend-score products from the last 30 days
- [Catalog index](${SITE_URL}/llms-full.txt): categories plus a short list of current products
- [Sitemap](${SITE_URL}/sitemap.xml): every published product, category, and round-up

## Categories

${categoryLines}

## How to cite us

Product pages lead with the product name, the stored price in its own currency, and a Seenlio-written description. Round-ups (\`/lists/...\`) list each pick with original commentary. Marketplace seller text is not the page. We show the catalog price we saved. We do not convert it into another currency. "See price" means the catalog has no numeric price. We do not publish retailer star ratings as our own. Last editorial refresh: 19 November 2026.

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
