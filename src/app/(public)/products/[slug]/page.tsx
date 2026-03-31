import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts, getSettings } from "@/lib/strapi";
import { buildAffiliateUrl } from "@/lib/analytics";
import TrendBadge from "@/components/TrendBadge";
import PriceDisplay from "@/components/PriceDisplay";
import StarRating from "@/components/StarRating";
import ProductCard from "@/components/ProductCard";
import ProductImageGallery from "@/components/ProductImageGallery";
import SectionHeader from "@/components/SectionHeader";
import ProductViewTracker from "./ProductViewTracker";
import StickyCtaBar from "./StickyCtaBar";

interface AffiliateLink {
  platform: string;
  url: string;
  commissionRate?: number;
  isActive?: boolean;
}

interface PricePoint {
  price: number;
  currency: string;
  originalPrice?: number;
}

interface MediaItem {
  url: string;
  type?: "image" | "video";
  isPrimary?: boolean;
  altText?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
}

interface ProductData {
  id: number;
  name: string;
  slug: string;
  productCode: string;
  description: string;
  shortDescription?: string;
  trendScore?: number;
  rating?: number;
  reviewCount?: number;
  sourceUrl?: string;
  sourcePlatform?: string;
  affiliateLinks?: AffiliateLink[];
  pricePoints?: PricePoint[];
  media?: MediaItem[];
  categories?: Category[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

const PLATFORM_LABELS: Record<string, string> = {
  amazon: "Amazon",
  aliexpress: "AliExpress",
  temu: "Temu",
  tiktok_shop: "TikTok Shop",
  other: "Store",
};

interface AffiliatePattern {
  platform: string;
  paramName: string;
  paramValue: string;
  regionalTags?: Record<string, string>;
  extraParams?: Record<string, string>;
  useGeoRedirect?: boolean;
  isActive?: boolean;
}

/** Extract ASIN from any amazon.com/dp/XXXXXXXXXX URL */
function extractAsin(url: string): string | null {
  const m = url.match(/\/dp\/([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
}

/** Build the href for a buy button using affiliate patterns from Settings */
function buildBuyHref(
  rawUrl: string,
  platform: string,
  productCode: string,
  patterns: AffiliatePattern[],
): string {
  const pattern = patterns.find(
    (p) => p.platform === platform && p.isActive !== false,
  );

  // Amazon with geo-redirect
  if (pattern?.useGeoRedirect && platform === "amazon") {
    const asin = extractAsin(rawUrl);
    if (asin) {
      return `/api/affiliate/amazon?asin=${asin}&productCode=${encodeURIComponent(productCode)}`;
    }
  }

  // Apply affiliate pattern: append paramName=paramValue + extraParams
  if (pattern) {
    try {
      const url = new URL(rawUrl);
      url.searchParams.set(pattern.paramName, pattern.paramValue);
      url.searchParams.set("utm_source", "seenlio");
      url.searchParams.set("utm_medium", platform);
      url.searchParams.set("utm_campaign", productCode);
      if (pattern.extraParams && typeof pattern.extraParams === "object") {
        for (const [k, v] of Object.entries(pattern.extraParams)) {
          url.searchParams.set(k, v);
        }
      }
      return url.toString();
    } catch {
      // Invalid URL — fall through to default
    }
  }

  // Fallback: just add UTM params
  return buildAffiliateUrl(rawUrl, productCode, platform);
}

interface RelatedProduct {
  id: number;
  name: string;
  slug: string;
  productCode: string;
  shortDescription?: string;
  trendScore?: number;
  rating?: number;
  reviewCount?: number;
  media?: MediaItem[];
  pricePoints?: Array<{ price: number; currency?: string; originalPrice?: number }>;
  categories?: Array<{ id: number; name: string; slug: string }>;
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getProduct(slug)) as ProductData | null;
  if (!product) return { title: "Product Not Found" };

  const ogImage = product.media?.find((m) => m.isPrimary && m.type !== "video")?.url
    || product.media?.find((m) => m.type !== "video")?.url;

  return {
    title: product.seo?.metaTitle || product.name,
    description:
      product.seo?.metaDescription ||
      product.shortDescription ||
      product.description?.slice(0, 160),
    openGraph: ogImage ? { images: [{ url: ogImage }] } : undefined,
  };
}

const platformGradients: Record<string, string> = {
  amazon: "from-amber-500 to-orange-600",
  aliexpress: "from-red-500 to-red-700",
  ebay: "from-blue-500 to-blue-700",
  walmart: "from-blue-600 to-blue-800",
  default: "from-purple-500 to-pink-600",
};

const platformIcons: Record<string, string> = {
  amazon: "🛒",
  aliexpress: "📦",
  ebay: "🏷️",
  walmart: "🏪",
  default: "🔗",
};

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProduct(slug) as Promise<ProductData | null>,
    getSettings(),
  ]);
  if (!product) notFound();

  const affiliatePatterns: AffiliatePattern[] =
    (settings as Record<string, unknown>)?.affiliatePatterns as AffiliatePattern[] ?? [];

  const currentPrice = product.pricePoints?.[0];
  const primaryImage =
    product.media?.find((m) => m.isPrimary && m.type !== "video")?.url ||
    product.media?.find((m) => m.type !== "video")?.url;
  const activeLinks =
    product.affiliateLinks?.filter((l) => l.isActive !== false) || [];

  // Build CTA buttons — use manual affiliate links if set, otherwise auto-build from sourceUrl + patterns
  const ctaButtons: Array<{
    platform: string;
    href: string;
    label: string;
    gradient: string;
    icon: string;
  }> = activeLinks.length > 0
    ? activeLinks.map((link) => {
        const platform = link.platform.toLowerCase();
        return {
          platform,
          href: buildBuyHref(link.url, platform, product.productCode, affiliatePatterns),
          label: `Shop on ${PLATFORM_LABELS[platform] ?? link.platform}`,
          gradient: platformGradients[platform] ?? platformGradients.default,
          icon: platformIcons[platform] ?? platformIcons.default,
        };
      })
    : product.sourceUrl
    ? (() => {
        const platform = (product.sourcePlatform ?? "other").toLowerCase();
        return [
          {
            platform,
            href: buildBuyHref(product.sourceUrl!, platform, product.productCode, affiliatePatterns),
            label: `Shop on ${PLATFORM_LABELS[platform] ?? "Store"}`,
            gradient: platformGradients[platform] ?? platformGradients.default,
            icon: platformIcons[platform] ?? platformIcons.default,
          },
        ];
      })()
    : [];


  // Fetch related products from the same category
  let relatedProducts: RelatedProduct[] = [];
  if (product.categories?.[0]) {
    try {
      const res = await getProducts({
        filters: {
          categories: { slug: { $eq: product.categories[0].slug } },
          slug: { $ne: product.slug },
          productStatus: { $in: ["approved", "video_queued", "video_ready", "published"] },
        },
        pagination: { pageSize: 4 },
        sort: ["trendScore:desc"],
      });
      relatedProducts = (res.data || []) as RelatedProduct[];
    } catch {
      // silently fail
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Analytics tracker */}
      <ProductViewTracker productCode={product.productCode} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        {/* Breadcrumbs */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-gray-500 overflow-x-auto">
          <Link href="/" className="hover:text-purple-400 transition-colors whitespace-nowrap">
            Home
          </Link>
          <svg className="w-4 h-4 shrink-0 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {product.categories?.[0] && (
            <>
              <Link
                href={`/categories/${product.categories[0].slug}`}
                className="hover:text-purple-400 transition-colors whitespace-nowrap"
              >
                {product.categories[0].name}
              </Link>
              <svg className="w-4 h-4 shrink-0 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
          <span className="text-gray-300 truncate">{product.name}</span>
        </nav>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Image gallery */}
          <ProductImageGallery
            media={product.media || []}
            productName={product.name}
          />

          {/* Product info */}
          <div className="space-y-5">
            {/* Product name */}
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                {product.name}
              </span>
            </h1>

            {/* Rating + Price row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {product.rating != null && product.rating > 0 && (
                <StarRating
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                />
              )}
              {currentPrice && (
                <PriceDisplay
                  price={currentPrice.price}
                  originalPrice={currentPrice.originalPrice}
                  currency="$"
                  size="lg"
                />
              )}
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                {product.productCode}
              </span>
              {product.trendScore != null && product.trendScore > 0 && (
                <TrendBadge score={product.trendScore} size="lg" showLabel />
              )}
              {product.categories?.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30 transition-colors"
                >
                  {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                </Link>
              ))}
            </div>

            {/* CTA — in viewport, before description */}
            {ctaButtons.length > 0 && (
              <div className="space-y-3 pt-1" id="cta-sentinel">
                <div className="grid gap-3">
                  {ctaButtons.map((btn, i) => (
                    <AffiliateButton
                      key={i}
                      href={btn.href}
                      platform={btn.platform}
                      label={btn.label}
                      productCode={product.productCode}
                      gradient={btn.gradient}
                      icon={btn.icon}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description — full width below the grid */}
        {product.description && (
          <div className="mt-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              About This Product
            </h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line max-w-4xl">
              {product.description}
            </p>
          </div>
        )}

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-24">
            <SectionHeader
              title="You Might Also Like"
              subtitle={`More from ${product.categories?.[0]?.name || "this category"}`}
              viewAllHref={
                product.categories?.[0]
                  ? `/categories/${product.categories[0].slug}`
                  : "/products"
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rp) => {
                const rpImage =
                  rp.media?.find((m) => m.isPrimary && m.type !== "video") ||
                  rp.media?.find((m) => m.type !== "video");
                return (
                  <ProductCard
                    key={rp.id}
                    name={rp.name}
                    slug={rp.slug}
                    productCode={rp.productCode}
                    shortDescription={rp.shortDescription}
                    imageUrl={rpImage?.url}
                    pricePoints={rp.pricePoints}
                    categories={rp.categories}
                    rating={rp.rating}
                    reviewCount={rp.reviewCount}
                    trendScore={rp.trendScore}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>
      {/* Sticky CTA bar — appears when main CTA scrolls out */}
      {ctaButtons.length > 0 && (
        <StickyCtaBar
          buttons={ctaButtons}
          productCode={product.productCode}
          price={currentPrice ? { price: currentPrice.price, currency: currentPrice.currency, originalPrice: currentPrice.originalPrice } : undefined}
          productName={product.name}
          imageUrl={primaryImage}
        />
      )}
    </div>
  );
}

/* Affiliate button as a client component inline */
function AffiliateButton({
  href,
  platform,
  label,
  productCode,
  gradient,
  icon,
}: {
  href: string;
  platform: string;
  label: string;
  productCode: string;
  gradient: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-product-code={productCode}
      data-platform={platform}
      className="group relative flex items-center justify-center gap-3 w-full rounded-xl px-6 py-4 font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient}`} />
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} blur-xl opacity-30 group-hover:opacity-50 transition-opacity`} />
      <span className="relative text-lg">{icon}</span>
      <span className="relative">{label}</span>
      <svg
        className="relative w-5 h-5 transition-transform group-hover:translate-x-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    </a>
  );
}
