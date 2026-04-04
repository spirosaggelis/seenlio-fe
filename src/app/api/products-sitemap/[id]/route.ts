import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://viralproducts.com";
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export async function GET(request: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
  const params = await Promise.resolve(context.params);
  const { id } = params;
  
  const [yearStr, monthStr] = id.split("_");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month)) {
    return new NextResponse("Invalid sitemap ID", { status: 400 });
  }

  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  let urls = '';

  try {
    let page = 1;
    let hasMore = true;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.STRAPI_API_TOKEN}`;
    }

    while (hasMore) {
      const productsRes = await fetch(
        `${STRAPI_URL}/api/products?fields[0]=slug&fields[1]=updatedAt&pagination[pageSize]=100&pagination[page]=${page}&filters[productStatus][$eq]=published&filters[createdAt][$gte]=${startDate}&filters[createdAt][$lte]=${endDate}`,
        { headers, next: { revalidate: 3600 } }
      );
      
      if (!productsRes.ok) break;
      
      const productsData = await productsRes.json();
      for (const product of productsData.data || []) {
        urls += `
  <url>
    <loc>${SITE_URL}/products/${product.slug}</loc>
    <lastmod>${new Date(product.updatedAt || new Date()).toISOString()}</lastmod>
    <priority>0.8</priority>
  </url>`;
      }

      const pagination = productsData?.meta?.pagination;
      if (pagination && page < pagination.pageCount) {
        page++;
      } else {
        hasMore = false;
      }
    }
  } catch {
    // Suppress fetch errors
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new NextResponse(xml, { 
    headers: { 
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    } 
  });
}
