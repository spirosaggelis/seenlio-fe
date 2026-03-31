import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View all",
}: SectionHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-gray-400 text-sm sm:text-base max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="shrink-0 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors group flex items-center gap-1"
          >
            {viewAllLabel}
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
      <div className="mt-3 h-px bg-gradient-to-r from-purple-500/50 via-cyan-500/30 to-transparent" />
    </div>
  );
}
