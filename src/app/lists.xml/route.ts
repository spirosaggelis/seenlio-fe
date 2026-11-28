import { NextResponse } from 'next/server';
import {
  SITE_URL,
  SITEMAP_XML_HEADERS,
  strapiFetch,
  unwrapRow,
  toLastmod,
} from '@/lib/sitemap';

interface ListicleRow {
  slug?: string;
  updatedAt?: string;
  priorityScore?: number;
}

export const revalidate = 600;

export async function GET() {
  const entries: ListicleRow[] = [];

  try {
    let page = 1;
    let pageCount = 1;
    while (page <= pageCount && page <= 20) {
      const params = new URLSearchParams({
        'fields[0]': 'slug',
        'fields[1]': 'updatedAt',
        'fields[2]': 'priorityScore',
        'filters[listicleStatus][$eq]': 'published',
        'pagination[pageSize]': '100',
        'pagination[page]': String(page),
        'sort[0]': 'publishedOn:desc',
      });
      const data = await strapiFetch('/listicles', params);
      for (const row of data.data || []) {
        const attrs = unwrapRow<ListicleRow>(row);
        if (attrs.slug) entries.push(attrs);
      }
      pageCount = data.meta?.pagination?.pageCount ?? 1;
      page += 1;
    }
  } catch {
    /* suppress */
  }

  const urls = entries
    .map((e) => {
      const lastmod = toLastmod(e.updatedAt);
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
