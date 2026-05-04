import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts, getSettings, PUBLISHED_PRODUCT_FILTER } from "@/lib/strapi";
import { proxyImage } from "@/lib/imageProxy";
import TrendBadge from "@/components/TrendBadge";
import PriceDisplay from "@/components/PriceDisplay";
import StarRating from "@/components/StarRating";
import ProductCard from "@/components/ProductCard";
import PlatformBadge from "@/components/PlatformBadge";
import ProductImageGallery from "@/components/ProductImageGallery";
import SectionHeader from "@/components/SectionHeader";
import ProductViewTracker from "./ProductViewTracker";
import StickyCtaBar from "./StickyCtaBar";
import AffiliateButton from "./AffiliateButton";

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
  isActive?: boolean;
}

interface PublishRecord {
  platform: string;
  publishStatus?: string;
  externalUrl?: string;
  externalId?: string;
  publishedAt?: string;
}

interface VideoItem {
  id: number;
  title?: string;
  storageUrl?: string;
  thumbnailUrl?: string;
  aspectRatio?: string;
  createdAt?: string;
  publishRecords?: PublishRecord[];
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
  videos?: VideoItem[];
  categories?: Category[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

type PickedVideo =
  | { kind: 'youtube'; id: string; title?: string }
  | { kind: 'native'; src: string; poster?: string; aspectRatio?: string; title?: string };

function pickProductVideo(videos: VideoItem[] | undefined): PickedVideo | null {
  if (!videos || videos.length === 0) return null;

  const sorted = [...videos].sort((a, b) =>
    (a.createdAt ?? '').localeCompare(b.createdAt ?? ''),
  );

  for (const v of sorted) {
    const yt = v.publishRecords?.find(
      (r) =>
        r.platform === 'youtube' &&
        (r.publishStatus === 'published' || !!r.externalUrl),
    );
    if (yt?.externalUrl) {
      const id = extractYoutubeId(yt.externalUrl);
      if (id) return { kind: 'youtube', id, title: v.title };
    }
  }

  const first = sorted[0];
  if (first?.storageUrl) {
    return {
      kind: 'native',
      src: first.storageUrl,
      poster: first.thumbnailUrl,
      aspectRatio: first.aspectRatio,
      title: first.title,
    };
  }
  return null;
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

function buildAffiliateUrl(baseUrl: string, productCode: string, platform: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', 'seenlio');
  url.searchParams.set('utm_medium', platform);
  url.searchParams.set('utm_campaign', productCode);
  return url.toString();
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seenlio.com";
  const productUrl = `${siteUrl}/products/${product.slug}`;

  // Build SEO-safe title (max ~60 chars before suffix)
  const rawTitle = product.seo?.metaTitle || product.name;
  const suffix = " | Seenlio";
  const maxTitleLen = 65 - suffix.length;
  const title =
    rawTitle.length > maxTitleLen
      ? rawTitle.slice(0, maxTitleLen).trimEnd() + "…" + suffix
      : rawTitle + suffix;

  // Build SEO-safe description (max 155 chars)
  const rawDesc =
    product.seo?.metaDescription ||
    product.shortDescription ||
    product.description ||
    product.name;
  const description =
    rawDesc.length > 155 ? rawDesc.slice(0, 152).trimEnd() + "…" : rawDesc;

  const rawOgImage =
    product.media?.find((m) => m.isPrimary && m.type !== "video")?.url ||
    product.media?.find((m) => m.type !== "video")?.url;
  const ogImage = rawOgImage ? proxyImage(rawOgImage) : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title,
      description,
      url: productUrl,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
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

  const productVideo = pickProductVideo(product.videos);
  const currentPrice = product.pricePoints?.[0];
  const rawPrimaryImage =
    product.media?.find((m) => m.isPrimary && m.type !== "video")?.url ||
    product.media?.find((m) => m.type !== "video")?.url;
  const primaryImage = rawPrimaryImage ? proxyImage(rawPrimaryImage) : undefined;
  const galleryMedia = (product.media || []).map((m) =>
    m.type === "video" ? m : { ...m, url: proxyImage(m.url) },
  );
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
  // Filter to only active categories for display
  const activeCategories = product.categories?.filter(
    (c) => c.isActive !== false,
  ) ?? [];

  let relatedProducts: RelatedProduct[] = [];
  if (activeCategories[0]) {
    try {
      const res = await getProducts({
        filters: {
          ...PUBLISHED_PRODUCT_FILTER,
          categories: { slug: { $eq: activeCategories[0].slug } },
          slug: { $ne: product.slug },
        },
        pagination: { pageSize: 4 },
        sort: ["trendScore:desc"],
      });
      relatedProducts = (res.data || []) as RelatedProduct[];
    } catch {
      // silently fail
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seenlio.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description || product.name,
    image: product.media
      ?.filter((m) => m.type !== "video" && m.url)
      .map((m) => proxyImage(m.url)) || [],
    sku: product.productCode,
    url: `${siteUrl}/products/${product.slug}`,
    ...(product.rating != null && product.rating > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            bestRating: 5,
            ...(product.reviewCount ? { reviewCount: product.reviewCount } : {}),
          },
        }
      : {}),
    ...(currentPrice
      ? {
          offers: {
            "@type": "Offer",
            price: currentPrice.price,
            priceCurrency: currentPrice.currency || "USD",
            availability: "https://schema.org/InStock",
            url: ctaButtons[0]?.href || `${siteUrl}/products/${product.slug}`,
          },
        }
      : {}),
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Analytics tracker */}
      <ProductViewTracker productCode={product.productCode} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        {/* Breadcrumbs */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-gray-500 overflow-x-auto">
          <Link href="/" className="hover:text-purple-400 transition-colors whitespace-nowrap">
            Home
          </Link>
          <svg className="w-4 h-4 shrink-0 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {activeCategories[0] && (
            <>
              <Link
                href={`/categories/${activeCategories[0].slug}`}
                className="hover:text-purple-400 transition-colors whitespace-nowrap"
              >
                {activeCategories[0].name}
              </Link>
              <svg className="w-4 h-4 shrink-0 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
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
            media={galleryMedia}
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
              {product.sourcePlatform && (
                <PlatformBadge platform={product.sourcePlatform} size="md" />
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                {product.productCode}
              </span>
              {product.trendScore != null && product.trendScore > 0 && (
                <TrendBadge score={product.trendScore} size="lg" showLabel />
              )}
              {activeCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30 transition-colors"
                >
                  {cat.name}
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

        {/* Description + video — combined section */}
        {(product.description || productVideo) && (
          <div className="mt-10 relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#0f0a1f] via-[#0a0a14] to-[#0a1420]">
            {/* decorative glow blobs */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl"
            />

            <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12 md:items-center">
              {/* text side */}
              <div className="min-w-0">
                {productVideo && (
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-pink-200">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inset-0 animate-ping rounded-full bg-pink-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-400" />
                    </span>
                    {productVideo.kind === 'youtube' ? 'Shorts · On YouTube' : 'Our Video'}
                  </div>
                )}

                {product.description && (
                  <>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 mb-3">
                      About This Product
                    </h3>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </>
                )}
              </div>

              {/* phone frame side */}
              {productVideo && (
                <div className="relative mx-auto md:mx-0 w-[260px] sm:w-[280px] shrink-0">
                  {/* outer glow */}
                  <div
                    aria-hidden
                    className="absolute -inset-4 rounded-[2.5rem] bg-linear-to-br from-purple-500/30 via-pink-500/20 to-cyan-500/30 blur-2xl"
                  />
                  {/* phone bezel */}
                  <div className="relative rounded-[2rem] border border-white/15 bg-[#0a0a0f] p-2 shadow-[0_20px_80px_-20px_rgba(139,92,246,0.5)]">
                    {/* notch */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-2 z-10 h-5 w-20 rounded-b-2xl bg-black/80 border border-white/10 border-t-0" />
                    {/* screen */}
                    <div
                      className="relative w-full overflow-hidden rounded-[1.5rem] bg-black"
                      style={{ aspectRatio: '9 / 16' }}
                    >
                      {productVideo.kind === 'youtube' ? (
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${productVideo.id}?rel=0&modestbranding=1`}
                          title={productVideo.title || product.name}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          className="absolute inset-0 w-full h-full object-cover"
                          src={productVideo.src}
                          poster={productVideo.poster}
                          controls
                          playsInline
                          preload="metadata"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-24">
            <SectionHeader
              title="You Might Also Like"
              subtitle={`More from ${activeCategories[0]?.name || "this category"}`}
              viewAllHref={
                activeCategories[0]
                  ? `/categories/${activeCategories[0].slug}`
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