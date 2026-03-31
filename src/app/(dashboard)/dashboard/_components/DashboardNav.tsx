'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    href: '/dashboard/overview',
    label: 'Overview',
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' />
      </svg>
    ),
  },
  {
    href: '/dashboard/traffic',
    label: 'Traffic',
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' />
      </svg>
    ),
  },
  {
    href: '/dashboard/products',
    label: 'Products',
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' />
      </svg>
    ),
  },
  {
    href: '/dashboard/search',
    label: 'Search',
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' />
      </svg>
    ),
  },
  {
    href: '/dashboard/pipeline',
    label: 'Pipeline',
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z' />
        <path strokeLinecap='round' strokeLinejoin='round' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
      </svg>
    ),
  },
  {
    href: '/dashboard/channels',
    label: 'Channels',
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.125c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125z' />
      </svg>
    ),
  },
  {
    href: '/dashboard/affiliate',
    label: 'Affiliate',
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244' />
      </svg>
    ),
  },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className='w-60 flex-shrink-0 flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)]'>
      {/* Logo */}
      <div className='px-6 py-5 border-b border-[var(--border-subtle)]'>
        <Link href='/' className='flex items-center gap-2'>
          <Image src='/logo.png' alt='Seenlio' width={120} height={36} className='h-8 w-auto' />
        </Link>
        <p className='text-xs text-[var(--fg-muted)] mt-1'>Analytics</p>
      </div>

      {/* Nav */}
      <nav className='flex-1 px-3 py-4 space-y-1'>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all',
                active
                  ? 'bg-[var(--accent-purple)] bg-opacity-20 text-[var(--accent-purple-light)] border border-[var(--accent-purple)] border-opacity-30'
                  : 'text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)]',
              ].join(' ')}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className='px-4 py-4 border-t border-[var(--border-subtle)]'>
        <Link
          href='/'
          className='flex items-center gap-2 text-xs text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors'
        >
          <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3' />
          </svg>
          Back to site
        </Link>
      </div>
    </aside>
  );
}
