import { NextResponse } from 'next/server';
import {
  SITE_URL,
  SITEMAP_XML_HEADERS,
  fetchListiclesMaxLastmod,
  fetchProductsMaxContentLastmod,
  fetchSiteContentMaxLastmod,
  lastmodXml,
} from '@/lib/sitemap';

const LEGAL_LASTMOD = '2026-11-19T00:00:00.000Z';
const LOOKUP_LASTMOD = '2026-08-23T00:00:00.000Z';

export async function GET() {
  const [siteLastmod, productsLastmod, listiclesLastmod] = await Promise.all([
    fetchSiteContentMaxLastmod(),
    fetchProductsMaxContentLastmod(),
    fetchListiclesMaxLastmod(),
  ]);

  const pages = [
    { loc: SITE_URL, priority: '1.0', changefreq: 'daily', lastmod: siteLastmod },
    { loc: `${SITE_URL}/products`, priority: '0.9', changefreq: 'daily', lastmod: productsLastmod },
    { loc: `${SITE_URL}/trending`, priority: '0.9', changefreq: 'daily', lastmod: productsLastmod },
    { loc: `${SITE_URL}/lists`, priority: '0.8', changefreq: 'weekly', lastmod: listiclesLastmod },
    { loc: `${SITE_URL}/about`, priority: '0.7', changefreq: 'monthly', lastmod: siteLastmod },
    { loc: `${SITE_URL}/lookup`, priority: '0.5', changefreq: 'weekly', lastmod: LOOKUP_LASTMOD },
    { loc: `${SITE_URL}/privacy`, priority: '0.3', changefreq: 'yearly', lastmod: LEGAL_LASTMOD },
    { loc: `${SITE_URL}/terms`, priority: '0.3', changefreq: 'yearly', lastmod: LEGAL_LASTMOD },
    { loc: `${SITE_URL}/cookies`, priority: '0.3', changefreq: 'yearly', lastmod: LEGAL_LASTMOD },
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
