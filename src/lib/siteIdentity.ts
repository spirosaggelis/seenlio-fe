import { getChannels } from '@/lib/strapi';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com';

/** Fallback if Strapi is down — public profile URLs only, no secrets. */
const FALLBACK_SOCIAL_URLS = [
  'https://www.youtube.com/@seenlio',
  'https://www.youtube.com/@seenlio.kitchen',
  'https://www.youtube.com/@seenlio.gadgets',
  'https://www.youtube.com/@seenlioclean',
  'https://www.pinterest.com/seenlio',
  'https://www.instagram.com/seenlio.kitchen',
  'https://www.instagram.com/seenlio.gadgets',
  'https://www.instagram.com/seenlio.clean',
  'https://www.facebook.com/seenlio.kitchen',
  'https://www.facebook.com/seenlio.gadgets',
  'https://www.facebook.com/seenlio.clean',
];

export function socialProfileUrl(
  platform: string,
  accountName: string,
  accountId?: string,
): string | null {
  const handle = accountName.replace(/^@/, '').trim();
  if (!handle) return null;
  switch (platform) {
    case 'youtube':
      if (accountId && /^UC[A-Za-z0-9_-]+$/.test(accountId)) {
        return `https://www.youtube.com/channel/${accountId}`;
      }
      return `https://www.youtube.com/@${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'instagram':
      return `https://www.instagram.com/${handle}`;
    case 'pinterest':
      return `https://www.pinterest.com/${handle}`;
    case 'facebook':
      return `https://www.facebook.com/${handle}`;
    default:
      return null;
  }
}

export async function getSocialProfileUrls(): Promise<string[]> {
  try {
    const res = await getChannels();
    const urls = new Set<string>();
    for (const raw of (res.data || []) as Array<{
      isActive?: boolean;
      platformAccounts?: Array<{
        platform?: string;
        accountName?: string;
        accountId?: string;
        isActive?: boolean;
      }>;
    }>) {
      if (raw.isActive === false) continue;
      for (const acc of raw.platformAccounts || []) {
        if (acc.isActive === false) continue;
        if (acc.platform === 'tiktok') continue;
        const url = socialProfileUrl(
          acc.platform || '',
          acc.accountName || '',
          acc.accountId,
        );
        if (url) urls.add(url);
      }
    }
    if (urls.size > 0) return [...urls];
  } catch {
    // Strapi may be down locally
  }
  return FALLBACK_SOCIAL_URLS;
}

export function organizationJsonLd(sameAs: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Seenlio',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      'Seenlio is an editorial product-discovery site. We watch short-form video trends, match them to real Amazon, Temu, and AliExpress listings, and publish unique write-ups and round-ups. Shop links are affiliate.',
    sameAs,
  };
}
