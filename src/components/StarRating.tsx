interface StarRatingProps {
  rating: number;
  maxStars?: number;
  reviewCount?: number;
  compact?: boolean;
}

function StarIcon({ fill }: { fill: "full" | "half" | "empty" }) {
  if (fill === "full") {
    return (
      <svg viewBox="0 0 20 20" className="w-full h-full text-amber-400" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }

  if (fill === "half") {
    return (
      <svg viewBox="0 0 20 20" className="w-full h-full">
        <defs>
          <linearGradient id="halfStar">
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#374151" />
          </linearGradient>
        </defs>
        <path
          fill="url(#halfStar)"
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" className="w-full h-full text-gray-600" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function StarRating({
  rating,
  maxStars = 5,
  reviewCount,
  compact = false,
}: StarRatingProps) {
  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    if (rating >= i) {
      stars.push(<StarIcon key={i} fill="full" />);
    } else if (rating >= i - 0.5) {
      stars.push(<StarIcon key={i} fill="half" />);
    } else {
      stars.push(<StarIcon key={i} fill="empty" />);
    }
  }

  const starSize = compact ? "w-3 h-3" : "w-4 h-4";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {stars.map((star, i) => (
          <span key={i} className={starSize}>
            {star}
          </span>
        ))}
      </div>
      {!compact && (
        <span className="text-sm text-gray-400 font-medium">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount != null && (
        <span className="text-xs text-gray-500">
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}
