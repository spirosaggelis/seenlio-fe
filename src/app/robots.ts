import type { MetadataRoute } from 'next';

const PUBLIC_CRAWL = {
  allow: '/',
  disallow: ['/dashboard/', '/api/', '/go/'],
} as const;

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com';
  const agents = [
    '*',
    'GPTBot',
    'ChatGPT-User',
    'OAI-SearchBot',
    'PerplexityBot',
    'ClaudeBot',
    'Google-Extended',
    'Bingbot',
    'Applebot',
  ];

  return {
    rules: agents.map((userAgent) => ({
      userAgent,
      allow: PUBLIC_CRAWL.allow,
      disallow: [...PUBLIC_CRAWL.disallow],
    })),
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
