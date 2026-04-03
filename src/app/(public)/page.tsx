import { getTrendingProducts, getCategories, getProducts } from "@/lib/strapi";
import HeroSection from "@/components/HeroSection";
import SectionHeader from "@/components/SectionHeader";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";

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
  let productCount = 0;
  let pageViews = 0;

  try {
    const [trendingData, categoryData, recentData, productCountData, pageViewData] = await Promise.all([
      getTrendingProducts(),
      getCategories({ pagination: { pageSize: 10 } }),
      getProducts({
        filters: { productStatus: { $eq: "published" } },
        sort: ["createdAt:desc"],
        pagination: { pageSize: 8 },
      }),
      getProducts({
        fields: ["id"],
        pagination: { pageSize: 1 },
      }),
      getProducts({
        fields: ["id"],
        pagination: { pageSize: 1 },
      }).then(() =>
        // Fetch page view count from site-events
        fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/site-events?filters[event_type][$eq]=page_view&pagination[pageSize]=1&fields[0]=id`, {
          headers: {
            ...(process.env.STRAPI_API_TOKEN ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` } : {}),
          },
          next: { revalidate: 300 },
        }).then(r => r.ok ? r.json() : { meta: { pagination: { total: 0 } } })
      ),
    ]);
    trending = (trendingData || []) as Product[];
    categories = (categoryData.data || []) as Category[];
    recent = (recentData.data || []) as Product[];
    productCount = productCountData.meta?.pagination?.total ?? 0;
    pageViews = pageViewData?.meta?.pagination?.total ?? 0;
  } catch {
    // Strapi may not be running yet
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero */}
      <HeroSection productCount={productCount} pageViews={pageViews} />

      <div className="mx-auto max-w-7xl px-4 pb-24 space-y-20">
        {/* Trending Now */}
        <section>
          <SectionHeader
            title="Trending Now"
            subtitle="The hottest products going viral right now"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
