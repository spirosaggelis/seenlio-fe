import { NextResponse } from 'next/server';
import {
  LEGAL_PAGE_LASTMOD,
  LOOKUP_PAGE_LASTMOD,
  SITE_URL,
  SITEMAP_XML_HEADERS,
  fetchListiclesMaxLastmod,
  fetchProductMonthBuckets,
  lastmodXml,
  latestIso,
} from '@/lib/sitemap';

export const revalidate = 600;

export async function GET() {
  const [buckets, listiclesLastmod] = await Promise.all([
    fetchProductMonthBuckets(),
    fetchListiclesMaxLastmod(),
  ]);
  const productsLastmod = latestIso(...buckets.map((bucket) => bucket.lastmod));
  const siteLastmod = latestIso(productsLastmod, listiclesLastmod);

  const pages = [
    { loc: SITE_URL, priority: '1.0', changefreq: 'daily', lastmod: siteLastmod },
    { loc: `${SITE_URL}/products`, priority: '0.9', changefreq: 'daily', lastmod: productsLastmod },
    { loc: `${SITE_URL}/trending`, priority: '0.9', changefreq: 'daily', lastmod: productsLastmod },
    { loc: `${SITE_URL}/lists`, priority: '0.8', changefreq: 'weekly', lastmod: listiclesLastmod },
    { loc: `${SITE_URL}/about`, priority: '0.7', changefreq: 'monthly', lastmod: siteLastmod },
    { loc: `${SITE_URL}/lookup`, priority: '0.5', changefreq: 'weekly', lastmod: LOOKUP_PAGE_LASTMOD },
    { loc: `${SITE_URL}/privacy`, priority: '0.3', changefreq: 'yearly', lastmod: LEGAL_PAGE_LASTMOD },
    { loc: `${SITE_URL}/terms`, priority: '0.3', changefreq: 'yearly', lastmod: LEGAL_PAGE_LASTMOD },
    { loc: `${SITE_URL}/cookies`, priority: '0.3', changefreq: 'yearly', lastmod: LEGAL_PAGE_LASTMOD },
  ];

  const urls = pages.map((p) => `
  <url>
    <loc>${p.loc}</loc>${lastmodXml(p.lastmod)}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new NextResponse(xml, { headers: SITEMAP_XML_HEADERS });
}
