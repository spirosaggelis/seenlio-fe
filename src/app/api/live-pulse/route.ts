import { getProducts, PUBLISHED_PRODUCT_FILTER, trendingRecencyFilter } from '@/lib/strapi';

export const revalidate = 300;

/** Small payload for the footer marquee. Loaded in the browser on product pages. */
export async function GET() {
  try {
    const res = await getProducts({
      filters: { ...PUBLISHED_PRODUCT_FILTER, ...trendingRecencyFilter() },
      sort: ['trendScore:desc'],
      pagination: { pageSize: 14 },
      fields: ['id', 'name', 'slug', 'trendScore'],
      populate: { pricePoints: true },
    });
    const products = ((res.data || []) as Array<{
      id?: number;
      name?: string;
      slug?: string;
      trendScore?: number;
      pricePoints?: Array<{ price?: number; currency?: string }>;
    }>)
      .filter((p) => p.id && p.slug && p.name)
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        trendScore: p.trendScore ?? 0,
        price: p.pricePoints?.[0]?.price,
        currency: p.pricePoints?.[0]?.currency,
      }));
    return Response.json({ products });
  } catch {
    return Response.json({ products: [] });
  }
}
