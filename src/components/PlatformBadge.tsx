interface PlatformBadgeProps {
  platform: string;
  size?: 'sm' | 'md';
}

interface PlatformStyle {
  label: string;
  gradient: string;
  text: string;
  shadow: string;
  dot: string;
}

const PLATFORMS: Record<string, PlatformStyle> = {
  amazon: {
    label: 'Amazon',
    gradient: 'from-[#FF9900] to-[#FF6A00]',
    text: 'text-black',
    shadow: 'shadow-[0_2px_10px_-2px_rgba(255,153,0,0.6)]',
    dot: 'bg-black/60',
  },
  aliexpress: {
    label: 'AliExpress',
    gradient: 'from-[#E62E04] to-[#FF3B00]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_10px_-2px_rgba(230,46,4,0.6)]',
    dot: 'bg-white/80',
  },
  temu: {
    label: 'Temu',
    gradient: 'from-[#FB7701] to-[#FF5200]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_10px_-2px_rgba(251,119,1,0.6)]',
    dot: 'bg-white/80',
  },
  tiktok_shop: {
    label: 'TikTok',
    gradient: 'from-[#FE2C55] via-[#ff4084] to-[#25F4EE]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_10px_-2px_rgba(254,44,85,0.6)]',
    dot: 'bg-white/80',
  },
  other: {
    label: 'Other',
    gradient: 'from-gray-600 to-gray-500',
    text: 'text-white',
    shadow: 'shadow-[0_2px_10px_-2px_rgba(0,0,0,0.5)]',
    dot: 'bg-white/70',
  },
};

export default function PlatformBadge({ platform, size = 'sm' }: PlatformBadgeProps) {
  const style = PLATFORMS[platform.toLowerCase()] ?? PLATFORMS.other;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${padding} rounded-full font-bold tracking-wide bg-linear-to-r ${style.gradient} ${style.text} ${style.shadow}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
