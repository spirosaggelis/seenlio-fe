import { Metadata } from 'next';
import Link from 'next/link';
import { getCategories, getProducts, PUBLISHED_PRODUCT_FILTER } from '@/lib/strapi';
import ProductCard from '@/components/ProductCard';
import ProductGrid from '@/components/ProductGrid';
import ProductFilterBar, { FilterCategory } from '@/components/ProductFilterBar';

const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: 'All Products',
  description:
    'Browse all trending products featured in viral videos. Sorted by trend score.',
  alternates: { canonical: '/products' },
  openGraph: {
    title: 'All Products',
    description: 'Browse all trending products featured in viral videos. Sorted by trend score.',
    url: '/products',
    images: [{ url: '/logo.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Products',
    description: 'Browse all trending products featured in viral videos. Sorted by trend score.',
    images: ['/logo.png'],
  },
};

interface MediaItem {
  url: string;
  type?: 'image' | 'video';
  isPrimary?: boolean;
  altText?: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  productCode: string;
  sourcePlatform?: string;
  shortDescription?: string;
  trendScore?: number;
  rating?: number;
  reviewCount?: number;
  media?: MediaItem[];
  pricePoints?: Array<{
    price: number;
    currency?: string;
    originalPrice?: number;
  }>;
  categories?: Array<{ id: number; name: string; slug: string }>;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

type SortKey = 'trend' | 'new' | 'price-asc' | 'price-desc' | 'rating';

const SORT_MAP: Record<SortKey, string[]> = {
  trend: ['trendScore:desc'],
  new: ['createdAt:desc'],
  'price-asc': ['pricePoints.price:asc'],
  'price-desc': ['pricePoints.price:desc'],
  rating: ['rating:desc', 'reviewCount:desc'],
};

function buildPriceFilter(bucket: string | undefined): Record<string, unknown> | null {
  if (!bucket) return null;
  const [loStr, hiStr] = bucket.split('-');
  const lo = loStr ? parseFloat(loStr) : NaN;
  const hi = hiStr ? parseFloat(hiStr) : NaN;
  const range: Record<string, number> = {};
  if (!isNaN(lo) && lo > 0) range.$gte = lo;
  if (!isNaN(hi) && hi > 0) range.$lte = hi;
  if (Object.keys(range).length === 0) return null;
  return { pricePoints: { price: range } };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; price?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const categorySlug = sp.category?.trim() || '';
  const priceBucket = sp.price?.trim() || '';
  const sortKey: SortKey = (['trend', 'new', 'price-asc', 'price-desc', 'rating'] as const).includes(
    sp.sort as SortKey,
  )
    ? (sp.sort as SortKey)
    : 'trend';

  // Build Strapi filter payload
  const filters: Record<string, unknown> = { ...PUBLISHED_PRODUCT_FILTER };
  if (categorySlug) {
    filters.categories = { slug: { $eq: categorySlug } };
  }
  const priceFilter = buildPriceFilter(priceBucket);
  if (priceFilter) Object.assign(filters, priceFilter);

  let products: Product[] = [];
  let pagination: PaginationMeta = { page, pageSize: PAGE_SIZE, pageCount: 1, total: 0 };
  let categories: FilterCategory[] = [];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      getProducts({
        filters,
        sort: SORT_MAP[sortKey],
        pagination: { page, pageSize: PAGE_SIZE },
      }),
      getCategories({ fields: ['id', 'name', 'slug', 'sortOrder'] }),
    ]);

    products = (productsRes.data || []) as Product[];
    const meta = (productsRes as { meta?: { pagination?: PaginationMeta } }).meta?.pagination;
    if (meta) pagination = meta;

    categories = (categoriesRes.data || []).map((c: unknown) => {
      const obj = c as Record<string, unknown>;
      return {
        id: Number(obj.id ?? 0),
        name: String(obj.name ?? ''),
        slug: String(obj.slug ?? ''),
      };
    });
  } catch {
    // Strapi may not be running
  }

  const { pageCount, total } = pagination;
  const hasPrev = page > 1;
  const hasNext = page < pageCount;

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (categorySlug) params.set('category', categorySlug);
    if (priceBucket) params.set('price', priceBucket);
    if (sortKey !== 'trend') params.set('sort', sortKey);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/products?${qs}` : '/products';
  };

  return (
    <div className='bg-[#0a0a0f]'>
      <div className='mx-auto max-w-7xl px-4 pt-16 pb-8'>
        {/* Page header */}
        <div className='mb-8'>
          <div className='flex items-baseline flex-wrap gap-x-4 gap-y-2'>
            <h1 className='text-4xl sm:text-5xl font-extrabold tracking-tight'>
              <span className='bg-linear-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent'>
                All Products
              </span>
            </h1>
            {total > 0 && (
              <span className='text-sm text-gray-400'>
                {total} {total === 1 ? 'product' : 'products'}
              </span>
            )}
          </div>
          <div className='mt-4 h-px bg-linear-to-r from-purple-500/50 via-cyan-500/30 to-transparent' />
        </div>

        {/* Filters */}
        <ProductFilterBar
          categories={categories}
          totalResults={total}
          currentCategory={categorySlug}
          currentPrice={priceBucket}
          currentSort={sortKey}
        />

        {/* Products */}
        <ProductGrid
          isEmpty={products.length === 0}
          emptyMessage={
            categorySlug || priceBucket
              ? 'No products match these filters. Try clearing one.'
              : 'No products available yet'
          }
        >
          {products.map((product, i) => {
            const primaryImage =
              product.media?.find((m) => m.isPrimary && m.type !== 'video') ||
              product.media?.find((m) => m.type !== 'video');
            return (
              <div
                key={product.id}
                className='opacity-0 animate-fade-in-up'
                style={{
                  animationDelay: `${i * 50}ms`,
                  animationFillMode: 'forwards',
                }}
              >
                <ProductCard
                  name={product.name}
                  slug={product.slug}
                  productCode={product.productCode}
                  sourcePlatform={product.sourcePlatform}
                  shortDescription={product.shortDescription}
                  imageUrl={primaryImage?.url}
                  pricePoints={product.pricePoints}
                  categories={product.categories}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  trendScore={product.trendScore}
                />
              </div>
            );
          })}
        </ProductGrid>

        {/* Pagination */}
        {pageCount > 1 && (
          <nav
            aria-label='Pagination'
            className='mt-10 flex items-center justify-center gap-1.5 sm:gap-2'
          >
            {hasPrev ? (
              <Link
                href={buildHref(page - 1)}
                className='h-9 sm:h-10 px-2.5 sm:px-4 inline-flex items-center rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition text-sm'
                rel='prev'
                aria-label='Previous page'
              >
                <span className='sm:hidden'>←</span>
                <span className='hidden sm:inline'>← Prev</span>
              </Link>
            ) : (
              <span className='h-9 sm:h-10 px-2.5 sm:px-4 inline-flex items-center rounded-lg border border-white/5 text-gray-600 cursor-not-allowed text-sm'>
                <span className='sm:hidden'>←</span>
                <span className='hidden sm:inline'>← Prev</span>
              </span>
            )}

            {(() => {
              const window: (number | 'ellipsis')[] = [];
              const pushPage = (p: number) => {
                if (p >= 1 && p <= pageCount && !window.includes(p)) window.push(p);
              };
              pushPage(1);
              if (page - 1 > 2) window.push('ellipsis');
              for (let p = page - 1; p <= page + 1; p++) pushPage(p);
              if (page + 1 < pageCount - 1) window.push('ellipsis');
              pushPage(pageCount);
              return window.map((p, idx) => {
                if (p === 'ellipsis') {
                  return (
                    <span
                      key={`e${idx}`}
                      className='w-9 sm:w-10 h-9 sm:h-10 inline-flex items-center justify-center text-gray-500 text-sm'
                    >
                      …
                    </span>
                  );
                }
                const isCurrent = p === page;
                return isCurrent ? (
                  <span
                    key={p}
                    aria-current='page'
                    className='w-9 sm:w-10 h-9 sm:h-10 inline-flex items-center justify-center rounded-lg bg-purple-500/20 border border-purple-400/50 text-white font-semibold text-sm'
                  >
                    {p}
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={buildHref(p)}
                    className='w-9 sm:w-10 h-9 sm:h-10 inline-flex items-center justify-center rounded-lg border border-white/10 text-gray-300 hover:border-purple-500/40 hover:text-purple-300 transition text-sm'
                  >
                    {p}
                  </Link>
                );
              });
            })()}

            {hasNext ? (
              <Link
                href={buildHref(page + 1)}
                className='h-9 sm:h-10 px-2.5 sm:px-4 inline-flex items-center rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition text-sm'
                rel='next'
                aria-label='Next page'
              >
                <span className='sm:hidden'>→</span>
                <span className='hidden sm:inline'>Next →</span>
              </Link>
            ) : (
              <span className='h-9 sm:h-10 px-2.5 sm:px-4 inline-flex items-center rounded-lg border border-white/5 text-gray-600 cursor-not-allowed text-sm'>
                <span className='sm:hidden'>→</span>
                <span className='hidden sm:inline'>Next →</span>
              </span>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
