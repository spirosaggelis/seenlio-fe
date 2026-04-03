import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCategory, getProducts } from "@/lib/strapi";
import ProductCard from "@/components/ProductCard";
import ProductGrid from "@/components/ProductGrid";
import CategoryBrowseTracker from "@/components/CategoryBrowseTracker";
import CategoryIcon from "@/components/CategoryIcon";

interface MediaItem {
  url: string;
  type?: "image" | "video";
  isPrimary?: boolean;
  altText?: string;
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
  pricePoints?: Array<{ price: number; currency?: string; originalPrice?: number }>;
  categories?: Array<{ id: number; name: string; slug: string }>;
}

interface CategoryData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  iconImage?: { url: string } | null;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

const accentMap: Record<string, { from: string; to: string; border: string; glow: string }> = {
  purple: { from: "from-purple-500", to: "to-purple-700", border: "border-purple-500/30", glow: "shadow-purple-500/20" },
  cyan: { from: "from-cyan-500", to: "to-cyan-700", border: "border-cyan-500/30", glow: "shadow-cyan-500/20" },
  pink: { from: "from-pink-500", to: "to-pink-700", border: "border-pink-500/30", glow: "shadow-pink-500/20" },
  amber: { from: "from-amber-500", to: "to-amber-700", border: "border-amber-500/30", glow: "shadow-amber-500/20" },
  emerald: { from: "from-emerald-500", to: "to-emerald-700", border: "border-emerald-500/30", glow: "shadow-emerald-500/20" },
  red: { from: "from-red-500", to: "to-red-700", border: "border-red-500/30", glow: "shadow-red-500/20" },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getCategory(slug)) as CategoryData | null;
  if (!category) return { title: "Category Not Found" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seenlio.com";
  const categoryUrl = `${siteUrl}/categories/${category.slug}`;

  const rawTitle = category.seo?.metaTitle || category.name;
  const suffix = " | Seenlio";
  const maxTitleLen = 65 - suffix.length;
  const title =
    rawTitle.length > maxTitleLen
      ? rawTitle.slice(0, maxTitleLen).trimEnd() + "…" + suffix
      : rawTitle + suffix;

  const rawDesc =
    category.seo?.metaDescription ||
    category.description ||
    `Browse trending ${category.name} products on Seenlio.`;
  const description =
    rawDesc.length > 155 ? rawDesc.slice(0, 152).trimEnd() + "…" : rawDesc;

  return {
    title,
    description,
    alternates: {
      canonical: categoryUrl,
    },
    openGraph: {
      title,
      description,
      url: categoryUrl,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [category, productsRes] = await Promise.all([
    getCategory(slug) as Promise<CategoryData | null>,
    getProducts({
      filters: {
        categories: { slug: { $eq: slug } },
        productStatus: { $in: ["approved", "video_queued", "video_ready", "published"] },
      },
      sort: ["trendScore:desc"],
      pagination: { pageSize: 48 },
    }),
  ]);
  if (!category) notFound();

  const products = (productsRes.data || []) as Product[];
  const accent = accentMap[category.color || "purple"] || accentMap.purple;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <CategoryBrowseTracker slug={slug} />
      {/* Category hero header */}
      <div className="relative overflow-hidden border-b border-white/5">
        {/* Background glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b ${accent.from} ${accent.to} opacity-10 blur-[120px]`} />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-purple-400 transition-colors">
              Home
            </Link>
            <svg className="w-4 h-4 shrink-0 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/products" className="hover:text-purple-400 transition-colors">
              Products
            </Link>
            <svg className="w-4 h-4 shrink-0 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-300">{category.name}</span>
          </nav>

          <div className="flex items-center gap-5">
            {/* Category icon */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${accent.from} ${accent.to} bg-opacity-20 flex items-center justify-center border ${accent.border} shadow-lg ${accent.glow} overflow-hidden`}>
              {category.iconImage?.url ? (
                <Image src={category.iconImage.url} alt={category.name} width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                <CategoryIcon slug={category.slug} className="w-10 h-10" />
              )}
            </div>

            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                <span className={`bg-gradient-to-r ${accent.from} ${accent.to} bg-clip-text text-transparent`}>
                  {category.name}
                </span>
              </h1>
              {category.description && (
                <p className="mt-2 text-gray-400 max-w-2xl text-lg">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          {/* Product count */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {products.length} {products.length === 1 ? "product" : "products"} found
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <ProductGrid
          isEmpty={products.length === 0}
          emptyMessage={`No products in ${category.name} yet`}
        >
          {products.map((product, i) => {
            const primaryImage =
              product.media?.find((m) => m.isPrimary && m.type !== "video") ||
              product.media?.find((m) => m.type !== "video");
            return (
              <div
                key={product.id}
                className="opacity-0 animate-fade-in-up"
                style={{
                  animationDelay: `${i * 60}ms`,
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
        </ProductGrid>
      </div>
    </div>
  );
}
