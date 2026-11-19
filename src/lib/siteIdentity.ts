export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com';

/** One Seenlio brand account per network. Niche channels are retired. */
export const BRAND_ACCOUNTS = [
  { platform: 'youtube', handle: '@seenlio', url: 'https://www.youtube.com/@seenlio' },
  { platform: 'instagram', handle: 'seenlio_com', url: 'https://www.instagram.com/seenlio_com' },
  { platform: 'facebook', handle: 'Seenlio', url: 'https://www.facebook.com/seenlio' },
  { platform: 'pinterest', handle: 'seenlio', url: 'https://www.pinterest.com/seenlio' },
  { platform: 'tiktok', handle: 'seenlio', url: 'https://www.tiktok.com/@seenlio' },
] as const;

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
  return BRAND_ACCOUNTS.map((account) => account.url);
}

export function organizationJsonLd(sameAs: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Seenlio',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      'Seenlio is an editorial product-discovery site. We watch short-form video trends, match them to real Amazon and AliExpress listings, and publish unique write-ups and round-ups. Shop links are affiliate. Checkout is on the retailer.',
    sameAs,
  };
}
