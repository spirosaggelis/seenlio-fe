interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
}

export default function PriceDisplay({
  price,
  originalPrice,
  currency = "$",
  size = "md",
}: PriceDisplayProps) {
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const sizeClasses = {
    sm: { price: "text-base", original: "text-xs", badge: "text-[10px] px-1.5 py-0.5" },
    md: { price: "text-xl", original: "text-sm", badge: "text-xs px-2 py-0.5" },
    lg: { price: "text-3xl", original: "text-lg", badge: "text-sm px-2.5 py-1" },
  };

  const s = sizeClasses[size];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className={`${s.price} font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent`}
      >
        {currency}
        {price.toFixed(2)}
      </span>

      {hasDiscount && (
        <>
          <span className={`${s.original} text-gray-500 line-through`}>
            {currency}
            {originalPrice.toFixed(2)}
          </span>
          <span
            className={`${s.badge} rounded-full font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30`}
          >
            -{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}
