import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://viralproducts.com";

export async function GET() {
  const pages = [
    { loc: SITE_URL, priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE_URL}/products`, priority: '0.9', changefreq: 'daily' },
    { loc: `${SITE_URL}/trending`, priority: '0.9', changefreq: 'daily' },
    { loc: `${SITE_URL}/lookup`, priority: '0.5', changefreq: 'weekly' },
    { loc: `${SITE_URL}/privacy`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${SITE_URL}/terms`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${SITE_URL}/cookies`, priority: '0.3', changefreq: 'yearly' }
  ];

  const urls = pages.map(p => `
  <url>
    <loc>${p.loc}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

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
