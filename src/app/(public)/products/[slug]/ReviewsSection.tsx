'use client';

interface ReviewsSectionProps {
  rating: number;
  reviewCount: number;
  productName: string;
  sourcePlatform?: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  aliexpress: 'AliExpress',
  temu: 'Temu',
  tiktok_shop: 'TikTok Shop',
};

export default function ReviewsSection({ rating, reviewCount, sourcePlatform }: ReviewsSectionProps) {
  if (!rating || rating <= 0 || !reviewCount || reviewCount <= 0) return null;

  const platform = sourcePlatform ? PLATFORM_LABELS[sourcePlatform.toLowerCase()] ?? sourcePlatform : null;
  const percentage = ((rating / 5) * 100).toFixed(0);

  return (
    <section className="mt-16">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Customer Rating
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          {/* Big rating number */}
          <div className="flex flex-col items-center">
            <div className="text-6xl font-extrabold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              {rating.toFixed(1)}
            </div>
            <span className="text-sm text-gray-500 mt-1">out of 5</span>
          </div>

          {/* Stars and details */}
          <div className="flex flex-col items-center sm:items-start gap-3">
            {/* Stars */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const fill = Math.min(1, Math.max(0, rating - star + 1));
                return (
                  <div key={star} className="relative w-7 h-7">
                    <svg className="w-7 h-7 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                      <svg className="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Review count */}
            <p className="text-gray-300 text-base">
              Based on <span className="font-semibold text-white">{reviewCount.toLocaleString()}</span> reviews
              {platform && (
                <span className="text-gray-500"> on {platform}</span>
              )}
            </p>

            {/* Satisfaction bar */}
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Satisfaction</span>
                <span className="text-emerald-400 font-medium">{percentage}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-emerald-400 transition-all duration-700"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
