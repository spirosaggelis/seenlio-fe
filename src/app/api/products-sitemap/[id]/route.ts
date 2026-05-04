import { NextResponse } from 'next/server';
import { proxyImage } from '@/lib/imageProxy';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://viralproducts.com";
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

const MAX_IMAGES_PER_URL = 5;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface SitemapMedia {
  url?: string;
  type?: string;
  isPrimary?: boolean;
}

interface SitemapProduct {
  slug: string;
  updatedAt?: string;
  media?: SitemapMedia[];
}

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
        `${STRAPI_URL}/api/products?fields[0]=slug&fields[1]=updatedAt&populate[media][fields][0]=url&populate[media][fields][1]=type&populate[media][fields][2]=isPrimary&pagination[pageSize]=100&pagination[page]=${page}&filters[productStatus][$eq]=published&filters[createdAt][$gte]=${startDate}&filters[createdAt][$lte]=${endDate}`,
        { headers, next: { revalidate: 3600 } }
      );

      if (!productsRes.ok) break;

      const productsData = await productsRes.json();
      for (const product of (productsData.data || []) as SitemapProduct[]) {
        const images = (product.media || [])
          .filter((m) => m.type !== 'video' && m.url)
          .sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary))
          .slice(0, MAX_IMAGES_PER_URL)
          .map((m) => proxyImage(m.url!))
          .filter(Boolean);

        const imageBlocks = images
          .map(
            (u) =>
              `\n    <image:image><image:loc>${escapeXml(u)}</image:loc></image:image>`,
          )
          .join('');

        urls += `
  <url>
    <loc>${SITE_URL}/products/${product.slug}</loc>
    <lastmod>${new Date(product.updatedAt || new Date()).toISOString()}</lastmod>
    <priority>0.8</priority>${imageBlocks}
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
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
