/**
 * Shared helpers for dashboard pages (date range, internal base URL).
 * Site analytics data comes from BigQuery (GA4 export); see lib/bq/.
 */

export function parseDateRange(searchParams: { get: (k: string) => string | null }) {
  const to = searchParams.get('to') ?? new Date().toISOString().split('T')[0];
  const from =
    searchParams.get('from') ??
    new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0];
  return { from, to };
}

/** Get the Next.js base URL for internal API calls (server-side only) */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}
