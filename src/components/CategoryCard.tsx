import Link from "next/link";
import Image from "next/image";
import CategoryIcon from "./CategoryIcon";

interface CategoryCardProps {
  name: string;
  slug: string;
  iconImageUrl?: string;
  productCount?: number;
  color?: string;
  description?: string;
}

const colorMap: Record<string, { from: string; to: string; border: string; glow: string }> = {
  purple: {
    from: "from-purple-600/20",
    to: "to-purple-900/10",
    border: "hover:border-purple-500/50",
    glow: "hover:shadow-purple-500/20",
  },
  cyan: {
    from: "from-cyan-600/20",
    to: "to-cyan-900/10",
    border: "hover:border-cyan-500/50",
    glow: "hover:shadow-cyan-500/20",
  },
  pink: {
    from: "from-pink-600/20",
    to: "to-pink-900/10",
    border: "hover:border-pink-500/50",
    glow: "hover:shadow-pink-500/20",
  },
  amber: {
    from: "from-amber-600/20",
    to: "to-amber-900/10",
    border: "hover:border-amber-500/50",
    glow: "hover:shadow-amber-500/20",
  },
  emerald: {
    from: "from-emerald-600/20",
    to: "to-emerald-900/10",
    border: "hover:border-emerald-500/50",
    glow: "hover:shadow-emerald-500/20",
  },
  red: {
    from: "from-red-600/20",
    to: "to-red-900/10",
    border: "hover:border-red-500/50",
    glow: "hover:shadow-red-500/20",
  },
};

export default function CategoryCard({
  name,
  slug,
  iconImageUrl,
  productCount,
  color = "purple",
  description,
}: CategoryCardProps) {
  const c = colorMap[color] || colorMap.purple;

  return (
    <Link
      href={`/categories/${slug}`}
      className={`group relative flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${c.from} ${c.to} backdrop-blur-xl p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${c.border} ${c.glow} overflow-hidden`}
    >
      {/* Glass overlay on hover */}
      <div className="absolute inset-0 rounded-2xl bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Subtle gradient glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10" />
      </div>

      {/* Icon */}
      <div className="relative mb-3 transition-transform duration-300 group-hover:scale-110 drop-shadow-lg">
        {iconImageUrl ? (
          <Image src={iconImageUrl} alt={name} width={48} height={48} className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <CategoryIcon slug={slug} className="w-12 h-12" />
        )}
      </div>

      {/* Name */}
      <span className="relative text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
        {name}
      </span>

      {/* Description */}
      {description && (
        <p className="relative mt-1 text-xs text-gray-500 line-clamp-2">
          {description}
        </p>
      )}

      {/* Product count */}
      {productCount !== undefined && (
        <span className="relative mt-1.5 text-xs text-gray-500 font-medium">
          {productCount} {productCount === 1 ? "product" : "products"}
        </span>
      )}
    </Link>
  );
}
