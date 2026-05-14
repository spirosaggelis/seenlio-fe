import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com';
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

interface ListicleRow {
  slug?: string;
  publishedOn?: string;
  updatedAt?: string;
  priorityScore?: number;
}

export async function GET() {
  const entries: ListicleRow[] = [];

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (STRAPI_API_TOKEN) headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;

    const params = new URLSearchParams({
      'fields[0]': 'slug',
      'fields[1]': 'publishedOn',
      'fields[2]': 'updatedAt',
      'fields[3]': 'priorityScore',
      'filters[listicleStatus][$eq]': 'published',
      'pagination[pageSize]': '200',
      'sort[0]': 'publishedOn:desc',
    });

    const res = await fetch(`${STRAPI_URL}/api/listicles?${params.toString()}`, {
      headers,
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      for (const row of data.data || []) {
        const attrs = (row.attributes || row) as ListicleRow;
        if (attrs.slug) entries.push(attrs);
      }
    }
  } catch {
    /* suppress */
  }

  const urls = entries
    .map((e) => {
      const lastmod = e.publishedOn || e.updatedAt || new Date().toISOString();
      // Higher priority for higher priorityScore — keeps the strongest hubs on top
      const priority = Math.min(
        0.9,
        Math.max(0.5, 0.5 + ((e.priorityScore || 0) / 100) * 0.4),
      ).toFixed(2);
      return `
  <url>
    <loc>${SITE_URL}/lists/${e.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
