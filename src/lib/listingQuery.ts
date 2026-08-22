export type SortKey = 'trend' | 'new' | 'price-asc' | 'price-desc' | 'rating';
export type SourceKey = 'amazon' | 'aliexpress' | 'temu';

export const VALID_SOURCES: SourceKey[] = ['amazon', 'aliexpress', 'temu'];
export const VALID_SORTS: SortKey[] = [
  'trend',
  'new',
  'price-asc',
  'price-desc',
  'rating',
];

export const SORT_MAP: Record<SortKey, string[]> = {
  trend: ['trendScore:desc'],
  new: ['sitePublishedAt:desc', 'createdAt:desc'],
  'price-asc': ['pricePoints.price:asc'],
  'price-desc': ['pricePoints.price:desc'],
  rating: ['rating:desc', 'reviewCount:desc'],
};

export function parseSort(
  value: string | undefined,
  fallback: SortKey = 'new',
): SortKey {
  return VALID_SORTS.includes(value as SortKey) ? (value as SortKey) : fallback;
}

export function parseSource(value: string | undefined): SourceKey | '' {
  return VALID_SOURCES.includes(value as SourceKey) ? (value as SourceKey) : '';
}

export function buildPriceFilter(
  bucket: string | undefined,
): Record<string, unknown> | null {
  if (!bucket) return null;
  const [loStr, hiStr] = bucket.split('-');
  const lo = loStr ? parseFloat(loStr) : NaN;
  const hi = hiStr ? parseFloat(hiStr) : NaN;
  const range: Record<string, number> = {};
  if (!Number.isNaN(lo) && lo > 0) range.$gte = lo;
  if (!Number.isNaN(hi) && hi > 0) range.$lte = hi;
  if (Object.keys(range).length === 0) return null;
  return { pricePoints: { price: range } };
}

export function listingHref(
  basePath: string,
  opts: {
    query?: string;
    category?: string;
    price?: string;
    source?: string;
    sort?: SortKey;
    defaultSort?: SortKey;
    page?: number;
  },
): string {
  const params = new URLSearchParams();
  if (opts.query) params.set('q', opts.query);
  if (opts.category) params.set('category', opts.category);
  if (opts.price) params.set('price', opts.price);
  if (opts.source) params.set('source', opts.source);
  const defaultSort = opts.defaultSort ?? 'new';
  if (opts.sort && opts.sort !== defaultSort) params.set('sort', opts.sort);
  if (opts.page && opts.page > 1) params.set('page', String(opts.page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
