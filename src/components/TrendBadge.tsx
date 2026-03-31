interface TrendBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function TrendBadge({
  score,
  size = "md",
  showLabel = false,
}: TrendBadgeProps) {
  const clampedScore = Math.min(100, Math.max(0, score));

  const getColorClasses = () => {
    if (clampedScore >= 80)
      return {
        bg: "bg-red-500/20",
        border: "border-red-500/40",
        text: "text-red-400",
        glow: "shadow-red-500/25",
        pulse: true,
      };
    if (clampedScore >= 60)
      return {
        bg: "bg-orange-500/20",
        border: "border-orange-500/40",
        text: "text-orange-400",
        glow: "shadow-orange-500/25",
        pulse: false,
      };
    if (clampedScore >= 40)
      return {
        bg: "bg-yellow-500/20",
        border: "border-yellow-500/40",
        text: "text-yellow-400",
        glow: "shadow-yellow-500/25",
        pulse: false,
      };
    return {
      bg: "bg-gray-500/20",
      border: "border-gray-500/40",
      text: "text-gray-400",
      glow: "shadow-gray-500/25",
      pulse: false,
    };
  };

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px] gap-0.5",
    md: "px-2 py-1 text-xs gap-1",
    lg: "px-3 py-1.5 text-sm gap-1.5",
  };

  const colors = getColorClasses();

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-bold
        border backdrop-blur-sm
        ${colors.bg} ${colors.border} ${colors.text}
        ${colors.pulse ? "animate-trend-pulse" : ""}
        ${sizeClasses[size]}
        ${colors.pulse ? `shadow-lg ${colors.glow}` : ""}
      `}
    >
      <span className="leading-none">🔥</span>
      <span>{clampedScore}</span>
      {showLabel && <span className="font-medium opacity-80">trending</span>}
    </span>
  );
}
