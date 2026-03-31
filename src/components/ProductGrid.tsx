import { ReactNode } from "react";
import SectionHeader from "./SectionHeader";

interface ProductGridProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
  columns?: 3 | 4;
}

export default function ProductGrid({
  children,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  emptyMessage = "No products found",
  isEmpty = false,
  columns = 4,
}: ProductGridProps) {
  const gridCols =
    columns === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className="w-full">
      {title && (
        <SectionHeader
          title={title}
          subtitle={subtitle}
          viewAllHref={viewAllHref}
          viewAllLabel={viewAllLabel}
        />
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {/* Empty state illustration */}
          <div className="w-24 h-24 mb-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <p className="text-gray-400 text-lg font-medium">{emptyMessage}</p>
          <p className="text-gray-500 text-sm mt-1">
            Check back soon for new discoveries
          </p>
        </div>
      ) : (
        <div className={`grid ${gridCols} gap-6 stagger-grid`}>
          {children}
        </div>
      )}
    </div>
  );
}
