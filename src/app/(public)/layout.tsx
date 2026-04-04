import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ScrollToTop from '@/components/ScrollToTop';
import MobileMenu from '@/components/MobileMenu';

export const metadata: Metadata = {
  title: {
    default: "Seenlio — Discover What's Trending",
    template: '%s | Seenlio',
  },
  description:
    'Discover the most trending consumer products featured in viral videos. Find kitchen gadgets, tech accessories, home tools, and the next big thing — before everyone else.',
  openGraph: {
    title: "Seenlio — Discover What's Trending",
    description:
      'Discover the most trending consumer products featured in viral videos. Find the next big thing before everyone else.',
    siteName: 'Seenlio',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Seenlio — Discover What's Trending",
    description:
      'Discover the most trending consumer products featured in viral videos.',
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com',
  ),
};

function NavBar() {
  const links = [
    { href: '/', label: 'Home' },
    { href: '/trending', label: 'Trending' },
    { href: '/products', label: 'Products' },
    { href: '/lookup', label: 'Lookup' },
    { href: '/about', label: 'About' },
  ];

  return (
    <header className='fixed top-0 left-0 right-0 z-50 glass-heavy'>
      <nav className='mx-auto flex max-w-7xl items-center justify-between px-6 py-4'>
        <Link href='/' className='flex items-center'>
          <Image
            src='/logo.png'
            alt='Seenlio'
            width={200}
            height={60}
            className='h-14 w-auto'
            priority
          />
        </Link>

        <div className='hidden md:flex items-center gap-8'>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className='nav-link'>
              {link.label}
            </Link>
          ))}
        </div>

        <MobileMenu links={links} />
      </nav>
    </header>
  );
}

// MobileMenu moved to components/MobileMenu.tsx (client component)

function Footer() {
  return (
    <footer className='mt-24 relative'>
      <div className='h-px bg-gradient-to-r from-transparent via-[var(--accent-purple)] to-transparent opacity-40' />

      <div className='mx-auto max-w-7xl px-6 py-16'>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12'>
          <div>
            <Link href='/' className='flex items-center mb-4'>
              <Image
                src='/logo.png'
                alt='Seenlio'
                width={100}
                height={30}
                className='h-8 w-auto'
              />
            </Link>
            <p className='text-sm text-[var(--fg-muted)] leading-relaxed'>
              Discover trending products before they go mainstream. Curated from
              viral videos across the internet.
            </p>
          </div>

          <div>
            <h4 className='text-sm font-semibold text-[var(--fg-primary)] mb-4 uppercase tracking-wider'>
              Explore
            </h4>
            <ul className='space-y-3'>
              {[
                { href: '/trending', label: 'Trending' },
                { href: '/products', label: 'All Products' },
                { href: '/lookup', label: 'Product Lookup' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='text-sm text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className='text-sm font-semibold text-[var(--fg-primary)] mb-4 uppercase tracking-wider'>
              Connect
            </h4>
            <ul className='space-y-3'>
              {['Twitter / X', 'Instagram', 'TikTok', 'YouTube'].map(
                (platform) => (
                  <li key={platform}>
                    <span className='text-sm text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors cursor-pointer'>
                      {platform}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div>
            <h4 className='text-sm font-semibold text-[var(--fg-primary)] mb-4 uppercase tracking-wider'>
              Legal
            </h4>
            <ul className='space-y-3'>
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms & Conditions' },
                { href: '/cookies', label: 'Cookie Policy' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='text-sm text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className='mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4'>
          <div className='h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent hidden sm:block' />
          <p className='text-xs text-[var(--fg-faint)] px-4 whitespace-nowrap'>
            &copy; {new Date().getFullYear()} Seenlio. All rights reserved.
          </p>
          <div className='h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent hidden sm:block' />
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      <div className='h-[72px]' />
      <main className='min-h-[calc(100vh-72px)]'>{children}</main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
