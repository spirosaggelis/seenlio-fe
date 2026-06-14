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

interface ListicleRow {
  slug?: string;
  publishedOn?: string;
  updatedAt?: string;
  priorityScore?: number;
}

export async function GET() {
  const entries: ListicleRow[] = [];

  try {
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
      headers: strapiHeaders(),
      next: { revalidate: SITEMAP_REVALIDATE },
    });
    if (res.ok) {
      const data = await res.json();
      for (const row of data.data || []) {
        const attrs = unwrapRow<ListicleRow>(row);
        if (attrs.slug) entries.push(attrs);
      }
    }
  } catch {
    /* suppress */
  }

  const urls = entries
    .map((e) => {
      const lastmod = toLastmod(e.publishedOn || e.updatedAt);
      const priority = Math.min(
        0.9,
        Math.max(0.5, 0.5 + ((e.priorityScore || 0) / 100) * 0.4),
      ).toFixed(2);
      return `
  <url>
    <loc>${SITE_URL}/lists/${e.slug}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new NextResponse(xml, { headers: SITEMAP_XML_HEADERS });
}
