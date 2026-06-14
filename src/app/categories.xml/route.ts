import { NextResponse } from 'next/server';
import {
  SITE_URL,
  SITEMAP_XML_HEADERS,
  strapiHeaders,
  unwrapRow,
  toLastmod,
  SITEMAP_REVALIDATE,
} from '@/lib/sitemap';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function GET() {
  let urls = '';

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(
        `${STRAPI_URL}/api/categories?fields[0]=slug&fields[1]=updatedAt&pagination[pageSize]=100&pagination[page]=${page}&filters[isActive][$eq]=true`,
        { headers: strapiHeaders(), next: { revalidate: SITEMAP_REVALIDATE } },
      );

      if (!res.ok) break;

      const data = await res.json();
      for (const row of data.data || []) {
        const cat = unwrapRow<{ slug?: string; updatedAt?: string }>(row);
        const lastmod = toLastmod(cat.updatedAt);
        urls += `
  <url>
    <loc>${SITE_URL}/categories/${cat.slug}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new NextResponse(xml, { headers: SITEMAP_XML_HEADERS });
}
