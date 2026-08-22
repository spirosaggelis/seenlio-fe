import Link from 'next/link';

interface PaginationNavProps {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}

export default function PaginationNav({
  page,
  pageCount,
  hrefFor,
}: PaginationNavProps) {
  if (pageCount <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < pageCount;

  const window: (number | 'ellipsis')[] = [];
  const pushPage = (p: number) => {
    if (p >= 1 && p <= pageCount && !window.includes(p)) window.push(p);
  };
  pushPage(1);
  if (page - 1 > 2) window.push('ellipsis');
  for (let p = page - 1; p <= page + 1; p++) pushPage(p);
  if (page + 1 < pageCount - 1) window.push('ellipsis');
  pushPage(pageCount);

  return (
    <nav
      aria-label='Pagination'
      className='mt-10 flex items-center justify-center gap-1.5 sm:gap-2'
    >
      {hasPrev ? (
        <Link
          href={hrefFor(page - 1)}
          className='h-9 sm:h-10 px-2.5 sm:px-4 inline-flex items-center rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition text-sm'
          rel='prev'
          aria-label='Previous page'
        >
          <span className='sm:hidden'>←</span>
          <span className='hidden sm:inline'>← Prev</span>
        </Link>
      ) : (
        <span className='h-9 sm:h-10 px-2.5 sm:px-4 inline-flex items-center rounded-lg border border-white/5 text-gray-600 cursor-not-allowed text-sm'>
          <span className='sm:hidden'>←</span>
          <span className='hidden sm:inline'>← Prev</span>
        </span>
      )}

      {window.map((p, idx) => {
        if (p === 'ellipsis') {
          return (
            <span
              key={`e${idx}`}
              className='w-9 sm:w-10 h-9 sm:h-10 inline-flex items-center justify-center text-gray-500 text-sm'
            >
              …
            </span>
          );
        }
        const isCurrent = p === page;
        return isCurrent ? (
          <span
            key={p}
            aria-current='page'
            className='w-9 sm:w-10 h-9 sm:h-10 inline-flex items-center justify-center rounded-lg bg-purple-500/20 border border-purple-400/50 text-white font-semibold text-sm'
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            className='w-9 sm:w-10 h-9 sm:h-10 inline-flex items-center justify-center rounded-lg border border-white/10 text-gray-300 hover:border-purple-500/40 hover:text-purple-300 transition text-sm'
          >
            {p}
          </Link>
        );
      })}

      {hasNext ? (
        <Link
          href={hrefFor(page + 1)}
          className='h-9 sm:h-10 px-2.5 sm:px-4 inline-flex items-center rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition text-sm'
          rel='next'
          aria-label='Next page'
        >
          <span className='sm:hidden'>→</span>
          <span className='hidden sm:inline'>Next →</span>
        </Link>
      ) : (
        <span className='h-9 sm:h-10 px-2.5 sm:px-4 inline-flex items-center rounded-lg border border-white/5 text-gray-600 cursor-not-allowed text-sm'>
          <span className='sm:hidden'>→</span>
          <span className='hidden sm:inline'>Next →</span>
        </span>
      )}
    </nav>
  );
}
