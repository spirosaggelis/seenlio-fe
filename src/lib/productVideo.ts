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
  storageUrl?: string;
  thumbnailUrl?: string;
  aspectRatio?: string;
  duration?: number;
  createdAt?: string;
  generatedAt?: string;
  publishRecords?: PublishRecord[];
}

export type PickedVideo =
  | {
      kind: 'youtube';
      id: string;
      title?: string;
      thumbnailUrl: string;
      embedUrl: string;
      watchUrl: string;
      uploadDate: string;
    }
  | {
      kind: 'native';
      src: string;
      poster?: string;
      aspectRatio?: string;
      title?: string;
      thumbnailUrl?: string;
      uploadDate?: string;
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
          thumbnailUrl: v.thumbnailUrl || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          embedUrl: `https://www.youtube.com/embed/${id}`,
          watchUrl: `https://www.youtube.com/watch?v=${id}`,
          uploadDate: pickUploadDate(yt.publishedAt, v.generatedAt, v.createdAt),
        };
      }
    }
  }

  const first = sorted[0];
  if (first?.storageUrl) {
    return {
      kind: 'native',
      src: first.storageUrl,
      poster: first.thumbnailUrl,
      aspectRatio: first.aspectRatio,
      title: first.title,
      thumbnailUrl: first.thumbnailUrl,
      uploadDate: pickUploadDate(undefined, first.generatedAt, first.createdAt),
    };
  }
  return null;
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
    thumbnailUrl: video.kind === 'youtube' ? video.thumbnailUrl : video.thumbnailUrl || video.poster,
    uploadDate: video.uploadDate,
    url: pageUrl,
  };

  if (durationSeconds && durationSeconds > 0) {
    base.duration = `PT${Math.round(durationSeconds)}S`;
  }

  if (video.kind === 'youtube') {
    base.embedUrl = video.embedUrl;
    base.contentUrl = video.watchUrl;
  } else {
    base.contentUrl = video.src;
    if (video.poster) base.thumbnailUrl = video.thumbnailUrl || video.poster;
  }

  return base;
}
