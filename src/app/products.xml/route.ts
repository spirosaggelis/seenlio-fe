import { NextResponse } from 'next/server';
import {
  SITE_URL,
  SITEMAP_XML_HEADERS,
  fetchProductMonthBuckets,
  lastmodXml,
} from '@/lib/sitemap';

export async function GET() {
  const buckets = await fetchProductMonthBuckets();

  const sitemapNodes = buckets.map(({ id, lastmod }) => `
  <sitemap>
    <loc>${SITE_URL}/products_${id}.xml</loc>${lastmodXml(lastmod)}
  </sitemap>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapNodes}
</sitemapindex>`;

  return new NextResponse(xml, { headers: SITEMAP_XML_HEADERS });
}
