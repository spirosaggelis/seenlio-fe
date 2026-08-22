import { Metadata } from 'next';
import { getCategories, getProducts, PUBLISHED_PRODUCT_FILTER } from '@/lib/strapi';
import { resolveListingProducts } from '@/lib/affiliateListing';
import ProductCard from '@/components/ProductCard';
import ProductGrid from '@/components/ProductGrid';
import ProductFilterBar, { FilterCategory } from '@/components/ProductFilterBar';
import PaginationNav from '@/components/PaginationNav';
import {
  VALID_SOURCES,
  buildPriceFilter,
  listingHref,
  parseSort,
  parseSource,
  SORT_MAP,
  type SourceKey,
} from '@/lib/listingQuery';

/** Shop CTAs resolve geo on /go/[code]; page HTML can be cached. */
export const revalidate = 300;

const PAGE_SIZE = 24;

const LISTING_DESCRIPTION =
  'Browse all trending products featured in viral videos. Sorted by newest published.';

type ProductsSearch = {
  page?: string;
  category?: string;
  price?: string;
  sort?: string;
  source?: string;
  q?: string;
};

function parsePage(value: string | undefined): number {
  return Math.max(1, parseInt(value ?? '1', 10) || 1);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ProductsSearch>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const query = sp.q?.trim() || '';
  const hasFilters = Boolean(
    sp.category?.trim() ||
      sp.price?.trim() ||
      query ||
      (sp.source && VALID_SOURCES.includes(sp.source as SourceKey)) ||
      (sp.sort && sp.sort !== 'new'),
  );
  const canonical = hasFilters
    ? '/products'
    : page > 1
      ? `/products?page=${page}`
      : '/products';
  const title = query
    ? `Search: ${query}`
    : !hasFilters && page > 1
      ? `All Products — Page ${page}`
      : 'All Products';

  return {
    title,
    description: LISTING_DESCRIPTION,
    alternates: { canonical },
    openGraph: {
      title,
      description: LISTING_DESCRIPTION,
      url: canonical,
      images: [{ url: '/logo.png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: LISTING_DESCRIPTION,
      images: ['/logo.png'],
    },
  };
}

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
  sourceUrl?: string;
  affiliateLinks?: Array<{ platform: string; url: string; isActive?: boolean }>;
  affiliateHref?: string;
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

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    category?: string;
    price?: string;
    sort?: string;
    source?: string;
    q?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const categorySlug = sp.category?.trim() || '';
  const priceBucket = sp.price?.trim() || '';
  const query = sp.q?.trim() || '';
  const sourcePlatform = parseSource(sp.source);
  const sortKey = parseSort(sp.sort);

  // Build Strapi filter payload
  const filters: Record<string, unknown> = { ...PUBLISHED_PRODUCT_FILTER };
  if (categorySlug) {
    filters.categories = { slug: { $eq: categorySlug } };
  }
  if (sourcePlatform) {
    filters.sourcePlatform = { $eq: sourcePlatform };
  }
  const priceFilter = buildPriceFilter(priceBucket);
  if (priceFilter) Object.assign(filters, priceFilter);
  if (query) {
    if (/^VP[A-Z0-9]{3,}$/i.test(query)) {
      filters.productCode = { $containsi: query };
    } else {
      filters.$or = [
        { name: { $containsi: query } },
        { productCode: { $containsi: query } },
      ];
    }
  }

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

    products = await resolveListingProducts(
      (productsRes.data || []) as Product[],
    );
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

  const buildHref = (p: number) =>
    listingHref('/products', {
      query,
      category: categorySlug,
      price: priceBucket,
      source: sourcePlatform,
      sort: sortKey,
      page: p,
    });

  return (
    <div className='bg-[#0a0a0f]'>
      <div className='mx-auto max-w-7xl px-4 pt-16 pb-8'>
        {/* Page header */}
        <div className='mb-5 sm:mb-4'>
          <div className='flex items-baseline flex-wrap gap-x-4 gap-y-2'>
            <h1 className='text-4xl sm:text-5xl font-extrabold tracking-tight'>
              <span className='bg-linear-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent'>
                {query ? `Results for “${query}”` : 'All Products'}
              </span>
            </h1>
            {total > 0 && (
              <span className='text-sm text-gray-400'>
                {total} {total === 1 ? 'product' : 'products'}
              </span>
            )}
          </div>
          <div className='mt-3 h-px bg-linear-to-r from-purple-500/50 via-cyan-500/30 to-transparent' />
        </div>

        {/* Filters */}
        <ProductFilterBar
          categories={categories}
          totalResults={total}
          currentCategory={categorySlug}
          currentPrice={priceBucket}
          currentSource={sourcePlatform}
          currentSort={sortKey}
          currentQuery={query}
        />

        {/* Products */}
        <ProductGrid
          isEmpty={products.length === 0}
          emptyMessage={
            categorySlug || priceBucket || sourcePlatform || query
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
                  affiliateHref={product.affiliateHref!}
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

        <PaginationNav page={page} pageCount={pageCount} hrefFor={buildHref} />
      </div>
    </div>
  );
}
