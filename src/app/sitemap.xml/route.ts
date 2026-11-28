import { NextResponse } from 'next/server';
import {
  LEGAL_PAGE_LASTMOD,
  LOOKUP_PAGE_LASTMOD,
  SITE_URL,
  SITEMAP_XML_HEADERS,
  fetchCategorySitemapEntries,
  fetchListiclesMaxLastmod,
  fetchProductMonthBuckets,
  lastmodXml,
  latestIso,
} from '@/lib/sitemap';

export const revalidate = 600;

export async function GET() {
  const [categories, buckets, listsLastmod] = await Promise.all([
    fetchCategorySitemapEntries(),
    fetchProductMonthBuckets(),
    fetchListiclesMaxLastmod(),
  ]);
  const categoriesLastmod = latestIso(...categories.map((cat) => cat.lastmod));
  const pagesLastmod = latestIso(
    listsLastmod,
    ...buckets.map((bucket) => bucket.lastmod),
    LEGAL_PAGE_LASTMOD,
    LOOKUP_PAGE_LASTMOD,
  );

  const productNodes = buckets
    .map(
      ({ id, lastmod }) => `
  <sitemap>
    <loc>${SITE_URL}/products_${id}.xml</loc>${lastmodXml(lastmod)}
  </sitemap>`,
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/pages.xml</loc>${lastmodXml(pagesLastmod)}
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/categories.xml</loc>${lastmodXml(categoriesLastmod)}
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/lists.xml</loc>${lastmodXml(listsLastmod)}
  </sitemap>${productNodes}
</sitemapindex>`;

  return new NextResponse(xml, { headers: SITEMAP_XML_HEADERS });
}
