import { NextResponse } from 'next/server';
import {
  SITE_URL,
  SITEMAP_XML_HEADERS,
  fetchCategorySitemapEntries,
  lastmodXml,
} from '@/lib/sitemap';

export const revalidate = 600;

export async function GET() {
  const categories = await fetchCategorySitemapEntries();
  const urls = categories
    .map((cat) => `
  <url>
    <loc>${SITE_URL}/categories/${cat.slug}</loc>${lastmodXml(cat.lastmod)}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new NextResponse(xml, { headers: SITEMAP_XML_HEADERS });
}
