import { proxyImage } from '@/lib/imageProxy';
import { resolveProductImage, type ImageSource } from '@/lib/productImage';

export interface PublishRecord {
  platform: string;
  publishStatus?: string;
  externalUrl?: string;
  externalId?: string;
  publishedAt?: string;
}

export interface VideoItem {
  id: number;
  title?: string;
  createdAt?: string;
  generatedAt?: string;
  publishRecords?: PublishRecord[];
}

/** Public video surfaced on the site — YouTube only (no local MinIO assets). */
export type PickedVideo = {
  kind: 'youtube';
  id: string;
  title?: string;
  thumbnailUrl: string;
  embedUrl: string;
  watchUrl: string;
  uploadDate: string;
};

export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function pickUploadDate(
  publishedAt?: string,
  generatedAt?: string,
  createdAt?: string,
): string {
  const raw = publishedAt || generatedAt || createdAt;
  if (!raw) return new Date().toISOString();
  return raw;
}

export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Returns the published YouTube short for a product, if any. */
export function pickProductVideo(videos: VideoItem[] | undefined): PickedVideo | null {
  if (!videos || videos.length === 0) return null;

  const sorted = [...videos].sort((a, b) =>
    (a.createdAt ?? '').localeCompare(b.createdAt ?? ''),
  );

  for (const v of sorted) {
    const yt = v.publishRecords?.find(
      (r) =>
        r.platform === 'youtube' &&
        (r.publishStatus === 'published' || !!r.externalUrl),
    );
    if (yt?.externalUrl) {
      const id = extractYoutubeId(yt.externalUrl);
      if (id) {
        return {
          kind: 'youtube',
          id,
          title: v.title,
          thumbnailUrl: youtubeThumbnail(id),
          embedUrl: `https://www.youtube.com/embed/${id}`,
          watchUrl: `https://www.youtube.com/watch?v=${id}`,
          uploadDate: pickUploadDate(yt.publishedAt, v.generatedAt, v.createdAt),
        };
      }
    }
  }

  return null;
}

export function publicVideoThumbnail(video: PickedVideo): string {
  return youtubeThumbnail(video.id);
}

export function publicVideoStreamUrl(video: PickedVideo): string {
  return video.embedUrl;
}

/** Proxied product image for OG / fallbacks when no YouTube thumb is used. */
export function publicProductImageUrl(product: ImageSource): string {
  const raw = resolveProductImage(product);
  return raw ? proxyImage(raw) : '';
}

export function buildVideoObjectJsonLd(options: {
  name: string;
  description: string;
  pageUrl: string;
  video: PickedVideo;
  durationSeconds?: number;
}) {
  const { name, description, pageUrl, video, durationSeconds } = options;
  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title || name,
    description,
    thumbnailUrl: publicVideoThumbnail(video),
    uploadDate: video.uploadDate,
    url: pageUrl,
    embedUrl: video.embedUrl,
    contentUrl: video.watchUrl,
  };

  if (durationSeconds && durationSeconds > 0) {
    base.duration = `PT${Math.round(durationSeconds)}S`;
  }

  return base;
}
