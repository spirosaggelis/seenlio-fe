import { NextResponse } from 'next/server';
import { proxyImage } from '@/lib/imageProxy';
import {
  pickProductVideo,
  publicVideoStreamUrl,
  publicVideoThumbnail,
  type PickedVideo,
  type PublishRecord,
  type VideoItem,
} from '@/lib/productVideo';
import {
  SITE_URL,
  SITEMAP_XML_HEADERS,
  strapiHeaders,
  unwrapRow,
  toLastmod,
  lastmodXml,
  SITEMAP_REVALIDATE,
} from '@/lib/sitemap';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

const MAX_IMAGES_PER_URL = 5;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeRelationList<T>(raw: unknown): T[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : ((raw as { data?: unknown[] }).data ?? []);
  return list.map((row) => unwrapRow<T>(row));
}

function normalizeVideos(raw: unknown): VideoItem[] {
  return normalizeRelationList<VideoItem & { publishRecords?: unknown }>(raw).map(
    (video) => ({
      ...video,
      publishRecords: normalizeRelationList<PublishRecord>(video.publishRecords),
    }),
  );
}

function buildVideoSitemapBlock(
  video: PickedVideo,
  productName: string,
  description: string,
): string {
  const title = escapeXml((video.title || productName).slice(0, 100));
  const desc = escapeXml(description.slice(0, 2048));
  const pubDate = toLastmod(video.uploadDate) ?? new Date().toISOString();
  const thumbnail = publicVideoThumbnail(video);

  return `
    <video:video>
      <video:thumbnail_loc>${escapeXml(thumbnail)}</video:thumbnail_loc>
      <video:title>${title}</video:title>
      <video:description>${desc}</video:description>
      <video:player_loc>${escapeXml(publicVideoStreamUrl(video))}</video:player_loc>
      <video:publication_date>${pubDate}</video:publication_date>
    </video:video>`;
}

interface SitemapMedia {
  url?: string;
  type?: string;
  isPrimary?: boolean;
}

interface SitemapProduct {
  slug: string;
  name?: string;
  shortDescription?: string;
  description?: string;
  updatedAt?: string;
  media?: SitemapMedia[];
  videos?: unknown;
}

function productSitemapQuery(page: number, startDate: string, endDate: string): string {
  const params = new URLSearchParams({
    'fields[0]': 'slug',
    'fields[1]': 'updatedAt',
    'fields[2]': 'name',
    'fields[3]': 'shortDescription',
    'fields[4]': 'description',
    'pagination[pageSize]': '100',
    'pagination[page]': String(page),
    'filters[productStatus][$eq]': 'published',
    'filters[createdAt][$gte]': startDate,
    'filters[createdAt][$lte]': endDate,
    'populate[media][fields][0]': 'url',
    'populate[media][fields][1]': 'type',
    'populate[media][fields][2]': 'isPrimary',
    'populate[videos][fields][0]': 'title',
    'populate[videos][fields][1]': 'createdAt',
    'populate[videos][fields][2]': 'generatedAt',
    'populate[videos][populate][publishRecords][fields][0]': 'platform',
    'populate[videos][populate][publishRecords][fields][1]': 'publishStatus',
    'populate[videos][populate][publishRecords][fields][2]': 'externalUrl',
    'populate[videos][populate][publishRecords][fields][3]': 'publishedAt',
  });
  return params.toString();
}

export async function GET(request: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
  const params = await Promise.resolve(context.params);
  const { id } = params;

  const [yearStr, monthStr] = id.split("_");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month)) {
    return new NextResponse("Invalid sitemap ID", { status: 400 });
  }

  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  let urls = '';

  try {
    let page = 1;
    let hasMore = true;

    const headers = strapiHeaders();

    while (hasMore) {
      const productsRes = await fetch(
        `${STRAPI_URL}/api/products?${productSitemapQuery(page, startDate, endDate)}`,
        { headers, next: { revalidate: SITEMAP_REVALIDATE } },
      );

      if (!productsRes.ok) break;

      const productsData = await productsRes.json();
      for (const row of productsData.data || []) {
        const product = unwrapRow<SitemapProduct>(row);
        const images = (product.media || [])
          .filter((m) => m.type !== 'video' && m.url)
          .sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary))
          .slice(0, MAX_IMAGES_PER_URL)
          .map((m) => proxyImage(m.url!))
          .filter(Boolean);

        const imageBlocks = images
          .map(
            (u) =>
              `\n    <image:image><image:loc>${escapeXml(u)}</image:loc></image:image>`,
          )
          .join('');

        urls += `
  <url>
    <loc>${SITE_URL}/products/${product.slug}</loc>${lastmodXml(toLastmod(product.updatedAt))}
    <priority>0.8</priority>${imageBlocks}
  </url>`;

        const productVideo = pickProductVideo(normalizeVideos(product.videos));
        if (productVideo) {
          const videoDescription =
            product.shortDescription ||
            product.description ||
            product.name ||
            'Viral product short on Seenlio';
          urls += `
  <url>
    <loc>${SITE_URL}/products/${product.slug}/watch</loc>${lastmodXml(toLastmod(productVideo.uploadDate))}
    <priority>0.6</priority>${buildVideoSitemapBlock(
      productVideo,
      product.name || product.slug,
      videoDescription,
    )}
  </url>`;
        }
      }

      const pagination = productsData?.meta?.pagination;
      if (pagination && page < pagination.pageCount) {
        page++;
      } else {
        hasMore = false;
      }
    }
  } catch {
    // Suppress fetch errors
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${urls}
</urlset>`;

  return new NextResponse(xml, { headers: SITEMAP_XML_HEADERS });
}
