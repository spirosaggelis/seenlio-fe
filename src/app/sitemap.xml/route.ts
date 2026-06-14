import { NextResponse } from 'next/server';
import {
  SITE_URL,
  SITEMAP_XML_HEADERS,
  fetchCategoriesMaxUpdatedAt,
  fetchListiclesMaxLastmod,
  fetchProductsMaxUpdatedAt,
  fetchSiteContentMaxLastmod,
  lastmodXml,
} from '@/lib/sitemap';

export async function GET() {
  const [pagesLastmod, categoriesLastmod, productsLastmod, listsLastmod] =
    await Promise.all([
      fetchSiteContentMaxLastmod(),
      fetchCategoriesMaxUpdatedAt(),
      fetchProductsMaxUpdatedAt(),
      fetchListiclesMaxLastmod(),
    ]);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/pages.xml</loc>${lastmodXml(pagesLastmod)}
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/categories.xml</loc>${lastmodXml(categoriesLastmod)}
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/products.xml</loc>${lastmodXml(productsLastmod)}
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/lists.xml</loc>${lastmodXml(listsLastmod)}
  </sitemap>
</sitemapindex>`;

  return new NextResponse(xml, { headers: SITEMAP_XML_HEADERS });
}
