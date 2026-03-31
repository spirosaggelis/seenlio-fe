import { Metadata } from "next";
import { getTrendingProducts } from "@/lib/strapi";
import ProductCard from "@/components/ProductCard";
import ProductGrid from "@/components/ProductGrid";

export const metadata: Metadata = {
  title: "Trending Products",
  description:
    "See the hottest trending products going viral right now, ranked by trend score.",
};

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

const rankStyles: Record<number, { bg: string; text: string; shadow: string }> = {
  1: {
    bg: "bg-gradient-to-br from-amber-400 to-yellow-600",
    text: "text-white",
    shadow: "shadow-lg shadow-amber-500/30",
  },
  2: {
    bg: "bg-gradient-to-br from-gray-300 to-gray-500",
    text: "text-white",
    shadow: "shadow-lg shadow-gray-400/30",
  },
  3: {
    bg: "bg-gradient-to-br from-orange-400 to-orange-700",
    text: "text-white",
    shadow: "shadow-lg shadow-orange-500/30",
  },
};

export default async function TrendingPage() {
  let products: Product[] = [];

  try {
    products = (await getTrendingProducts()) as Product[];
  } catch {
    // Strapi may not be running
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        {/* Page header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-6">
            <span className="text-lg">🔥</span>
            Updated in real-time
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              Trending Products
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Products ranked by their viral trend score — a combination of social
            mentions, search volume, and community engagement.
          </p>
        </div>

        {/* Product grid */}
        <ProductGrid
          isEmpty={products.length === 0}
          emptyMessage="No trending products yet"
        >
          {products.map((product, index) => {
            const rank = index + 1;
            const primaryImage =
              product.media?.find((m) => m.isPrimary && m.type !== "video") ||
              product.media?.find((m) => m.type !== "video");
            const style = rankStyles[rank];

            return (
              <div
                key={product.id}
                className="relative opacity-0 animate-fade-in-up"
                style={{
                  animationDelay: `${index * 60}ms`,
                  animationFillMode: "forwards",
                }}
              >
                {/* Rank badge */}
                <div className="absolute top-3 left-3 z-20">
                  <span
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-extrabold border border-white/20 backdrop-blur-sm ${
                      style
                        ? `${style.bg} ${style.text} ${style.shadow}`
                        : "bg-white/10 text-gray-300 shadow-none"
                    }`}
                  >
                    #{rank}
                  </span>
                </div>

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
