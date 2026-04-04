import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://viralproducts.com";
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET() {
  const months = new Set<string>();

  try {
    let page = 1;
    let hasMore = true;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    while (hasMore) {
      const res = await fetch(
        `${STRAPI_URL}/api/products?fields[0]=createdAt&pagination[pageSize]=100&pagination[page]=${page}&filters[productStatus][$eq]=published`,
        { headers, next: { revalidate: 3600 } }
      );
      
      if (!res.ok) break;
      
      const data = await res.json();
      for (const product of data.data || []) {
        const date = new Date(product.createdAt || new Date());
        months.add(`${date.getFullYear()}_${date.getMonth() + 1}`);
      }
      
      const pagination = data?.meta?.pagination;
      if (pagination && page < pagination.pageCount) {
        page++;
      } else {
        hasMore = false;
      }
    }
  } catch {
    // Suppress fetch errors
  }

  // Fallback if empty to ensure valid XML rendering
  if (months.size === 0) {
    months.add(`${new Date().getFullYear()}_${new Date().getMonth() + 1}`);
  }

  const sitemapNodes = Array.from(months).map((id) => {
    return `
  <sitemap>
    <loc>${SITE_URL}/products_${id}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapNodes}
</sitemapindex>`;

  return new NextResponse(xml, { 
    headers: { 
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    } 
  });
}
