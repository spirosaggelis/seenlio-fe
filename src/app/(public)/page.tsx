import { getRollingPageViewCount } from '@/lib/bq/rollingPageViews';
import { getTrendingProducts, getCategories, getProducts, getPublishedListicles, PUBLISHED_PRODUCT_FILTER } from "@/lib/strapi";
import { resolveListingProducts } from "@/lib/affiliateListing";
import HeroSection from "@/components/HeroSection";
import SectionHeader from "@/components/SectionHeader";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import ListicleCard, { type ListicleCardData } from "@/components/ListicleCard";
import { getSocialProfileUrls, organizationJsonLd } from '@/lib/siteIdentity';

/** Shop CTAs resolve geo on /go/[code]; page HTML can be cached. */
export const revalidate = 300;

interface Category {
  id: number;
  name: string;
  slug: string;
  color?: string;
  description?: string;
  iconImage?: { url: string } | null;
}

interface MediaItem {
  url: string;
  type?: "image" | "video";
  isPrimary?: boolean;
  altText?: string;
}

interface PricePoint {
  price: number;
  currency?: string;
  originalPrice?: number;
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
  pricePoints?: PricePoint[];
  categories?: Array<{ id: number; name: string; slug: string }>;
}

export default async function HomePage() {
  let trending: Product[] = [];
  let categories: Category[] = [];
  let recent: Product[] = [];
  let listicles: ListicleCardData[] = [];
  let productCount = 0;
  let pageViews = 0;

  try {
    const [trendingData, categoryData, recentData, productCountData, pageViewCount, listicleData] = await Promise.all([
      getTrendingProducts(),
      getCategories({ pagination: { pageSize: 10 } }),
      getProducts({
        filters: { ...PUBLISHED_PRODUCT_FILTER },
        sort: ["createdAt:desc"],
        pagination: { pageSize: 8 },
      }),
      getProducts({
        filters: { ...PUBLISHED_PRODUCT_FILTER },
        fields: ["id"],
        pagination: { pageSize: 1 },
      }),
      getRollingPageViewCount(365),
      getPublishedListicles({ pagination: { pageSize: 3 } }),
    ]);
    trending = await resolveListingProducts(
      (trendingData || []) as Product[],
    );
    categories = (categoryData.data || []) as Category[];
    recent = await resolveListingProducts(
      (recentData.data || []) as Product[],
    );
    productCount = productCountData.meta?.pagination?.total ?? 0;
    pageViews = pageViewCount;
    listicles = (listicleData || []) as ListicleCardData[];
  } catch {
    // Strapi / BigQuery may not be configured locally
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com';
  const orgJsonLd = organizationJsonLd(await getSocialProfileUrls());
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Seenlio',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/products?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      {/* Hero */}
      <HeroSection productCount={productCount} pageViews={pageViews} />

      <div className="mx-auto max-w-7xl px-4 pb-24 space-y-20">
        {/* Trending Now */}
        <section>
          <SectionHeader
            title="Trending Now"
            subtitle="Highest-scoring finds from the last 30 days"
            viewAllHref="/trending"
          />
          {trending.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trending.slice(0, 8).map((product, i) => {
                const primaryImage =
                  product.media?.find((m) => m.isPrimary && m.type !== "video") ||
                  product.media?.find((m) => m.type !== "video");
                return (
                  <div
                    key={product.id}
                    className="opacity-0 animate-fade-in-up"
                    style={{
                      animationDelay: `${i * 80}ms`,
                      animationFillMode: "forwards",
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
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500">No trending products yet. Check back soon!</p>
            </div>
          )}
        </section>

        {/* Browse Categories */}
        {categories.length > 0 && (
          <section>
            <SectionHeader
              title="Browse Categories"
              subtitle="Explore products by category"
            />
            <div className={`grid gap-4 mx-auto ${
              categories.length <= 3
                ? 'grid-cols-1 sm:grid-cols-3 max-w-3xl'
                : categories.length <= 4
                  ? 'grid-cols-2 sm:grid-cols-4 max-w-4xl'
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 w-full'
            }`}>
              {categories.map((cat, i) => (
                <div
                  key={cat.id}
                  className="opacity-0 animate-fade-in-up"
                  style={{
                    animationDelay: `${i * 60}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  <CategoryCard
                    name={cat.name}
                    slug={cat.slug}
                    iconImageUrl={cat.iconImage?.url}
                    color={cat.color}
                    description={cat.description}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {listicles.length > 0 && (
          <section>
            <SectionHeader
              title="Editor Round-ups"
              subtitle="The lists worth reading — not another marketplace dump"
              viewAllHref="/lists"
            />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {listicles.map((list) => (
                <ListicleCard key={list.slug} list={list} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Discovered */}
        {recent.length > 0 && (
          <section>
            <SectionHeader
              title="Recently Discovered"
              subtitle="Fresh finds just added to our collection"
              viewAllHref="/products"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recent.slice(0, 8).map((product, i) => {
                const primaryImage =
                  product.media?.find((m) => m.isPrimary && m.type !== "video") ||
                  product.media?.find((m) => m.type !== "video");
                return (
                  <div
                    key={product.id}
                    className="opacity-0 animate-fade-in-up"
                    style={{
                      animationDelay: `${i * 80}ms`,
                      animationFillMode: "forwards",
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
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
