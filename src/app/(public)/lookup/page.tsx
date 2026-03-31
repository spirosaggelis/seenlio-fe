"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import { trackSearch } from "@/lib/analytics";

interface Product {
  id: number;
  name: string;
  slug: string;
  productCode: string;
  shortDescription?: string;
  trendScore?: number;
  rating?: number;
  reviewCount?: number;
  media?: Array<{ url: string; type?: "image" | "video"; isPrimary?: boolean; altText?: string }>;
  pricePoints?: Array<{ price: number; currency?: string; originalPrice?: number }>;
  categories?: Array<{ id: number; name: string; slug: string }>;
}

function LookupContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchedCode, setSearchedCode] = useState("");

  const handleSearch = useCallback(async (code: string) => {
    if (!code) return;
    setLoading(true);
    setSearched(true);
    setSearchedCode(code);

    try {
      const strapiUrl =
        process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const res = await fetch(
        `${strapiUrl}/api/products/lookup/${encodeURIComponent(code)}`
      );
      if (res.ok) {
        const data = await res.json();
        const found = data?.data || null;
        setProduct(found);
        trackSearch(code, found ? 1 : 0);
      } else {
        setProduct(null);
        trackSearch(code, 0);
      }
    } catch {
      setProduct(null);
    }
    setLoading(false);
  }, []);

  // Auto-search if code was passed via URL
  useState(() => {
    if (initialCode) {
      handleSearch(initialCode);
    }
  });

  const primaryImage =
    product?.media?.find((m) => m.isPrimary && m.type !== "video") || product?.media?.find((m) => m.type !== "video");

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-20 sm:py-32">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm text-gray-400 mb-6">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            Quick product lookup
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Find Your Product
            </span>
          </h1>

          <p className="mt-4 text-lg text-gray-400 max-w-lg mx-auto">
            Enter the product code from the video to instantly find product
            details, pricing, and where to buy.
          </p>
        </div>

        {/* Search bar */}
        <SearchBar
          onSearch={handleSearch}
          loading={loading}
          placeholder="Enter product code (e.g. VP-1234)"
          size="lg"
        />

        {/* Results */}
        {searched && !loading && (
          <div className="mt-12 animate-fade-in-up" style={{ animationFillMode: "forwards" }}>
            {product ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Product found for code <span className="font-mono text-cyan-400 font-bold">{searchedCode}</span>
                </div>

                <div className="max-w-sm">
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
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
                  </svg>
                </div>
                <p className="text-gray-300 text-lg font-medium">
                  No product found
                </p>
                <p className="mt-2 text-gray-500 text-sm max-w-md mx-auto">
                  No product matches the code{" "}
                  <span className="font-mono text-gray-400">&ldquo;{searchedCode}&rdquo;</span>.
                  Make sure you entered the code exactly as shown in the video.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instructions when nothing searched yet */}
        {!searched && (
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                  </svg>
                ),
                title: "Watch the video",
                desc: "Spot the product code displayed in the video",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                ),
                title: "Enter the code",
                desc: "Type the product code in the search bar above",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                ),
                title: "Get the product",
                desc: "View details and buy from your favorite store",
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 opacity-0 animate-fade-in-up"
                style={{
                  animationDelay: `${400 + i * 150}ms`,
                  animationFillMode: "forwards",
                }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-3">
                  {step.icon}
                </div>
                <h3 className="text-white font-semibold text-sm">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LookupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LookupContent />
    </Suspense>
  );
}
