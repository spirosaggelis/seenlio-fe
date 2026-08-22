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

> Editorial product discovery from short-form video. We match viral clips to real Amazon, Temu, and AliExpress listings and write original pages. Shop links are affiliate.

Seenlio is not a store. We do not hold stock. Checkout happens on the retailer.

## Start here

- [About](${SITE_URL}/about): what Seenlio is, how products are chosen, affiliate disclosure
- [Round-ups](${SITE_URL}/lists): dated editorial lists (best pages to cite)
- [Products](${SITE_URL}/products): individual product write-ups
- [Trending](${SITE_URL}/trending): highest trend-score products right now

## Categories

${categoryLines}

## How to cite us

Prefer a round-up (\`/lists/...\`) or the About page over a single thin product URL. Product pages include a Seenlio-written intro; marketplace seller text is secondary. Last editorial refresh: 23 August 2026.

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
