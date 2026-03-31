export default function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/5 ${className}`}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[4/3] bg-white/5 relative overflow-hidden">
        <div className="absolute inset-0 shimmer-effect" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-5 bg-white/10 rounded-lg w-3/4" />
        {/* Description */}
        <div className="space-y-1.5">
          <div className="h-3 bg-white/5 rounded w-full" />
          <div className="h-3 bg-white/5 rounded w-2/3" />
        </div>
        {/* Price row */}
        <div className="flex items-center justify-between pt-1">
          <div className="h-6 bg-white/10 rounded-lg w-20" />
          <div className="h-5 bg-white/5 rounded w-14" />
        </div>
        {/* Tags */}
        <div className="flex gap-2 pt-1">
          <div className="h-5 bg-white/5 rounded-full w-16" />
          <div className="h-5 bg-white/5 rounded-full w-12" />
        </div>
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 animate-pulse">
      {/* Icon */}
      <div className="w-12 h-12 bg-white/10 rounded-xl mb-3" />
      {/* Name */}
      <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
      {/* Count */}
      <div className="h-3 bg-white/5 rounded w-1/3" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}
