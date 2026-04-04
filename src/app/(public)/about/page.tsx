import type { Metadata } from 'next';
import Link from 'next/link';
import { getProducts, PUBLISHED_PRODUCT_FILTER } from '@/lib/strapi';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Meet Seenlio — the engine behind trending product discovery. We surface the products breaking the internet before everyone else.',
  openGraph: {
    title: 'About Seenlio',
    description:
      'We surface the products breaking the internet before everyone else.',
  },
};

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const TIMELINE = [
  {
    icon: '💡',
    title: 'The spark',
    text: 'We noticed millions of people scrambling to find the exact product from a viral video — with no easy way to do it.',
  },
  {
    icon: '🔍',
    title: 'The hunt begins',
    text: 'We built intelligence that watches trending content across platforms and matches it to real, purchasable products.',
  },
  {
    icon: '🚀',
    title: 'Seenlio is born',
    text: 'A single destination where trend meets shelf. No more doom-scrolling comment sections — just the product, the data, and the link.',
  },
];

const VALUES = [
  {
    gradient: 'from-purple-500 to-pink-500',
    glow: 'rgba(139, 92, 246, 0.15)',
    title: 'Speed',
    description:
      'Trends move fast. Our pipeline detects, verifies, and publishes products within hours of them going viral — not days.',
  },
  {
    gradient: 'from-cyan-500 to-blue-500',
    glow: 'rgba(6, 182, 212, 0.15)',
    title: 'Transparency',
    description:
      'Every product has a trend score, real ratings, and multi-platform pricing. We show you the data so you decide — no hidden agendas.',
  },
  {
    gradient: 'from-pink-500 to-orange-400',
    glow: 'rgba(236, 72, 153, 0.15)',
    title: 'Independence',
    description:
      'We don\'t sell products. We\'re not a marketplace. We\'re an editorial discovery engine — our only bias is what\'s genuinely trending.',
  },
];

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K+`;
  return String(n);
}

async function fetchStats() {
  try {
    const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    const token = process.env.STRAPI_API_TOKEN;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const [productData, viewData] = await Promise.all([
      getProducts({ filters: { ...PUBLISHED_PRODUCT_FILTER }, fields: ['id'], pagination: { pageSize: 1 } }),
      fetch(`${STRAPI_URL}/api/site-events?filters[event_type][$eq]=page_view&pagination[pageSize]=1&fields[0]=id`, {
        headers,
        next: { revalidate: 300 },
      }).then(r => r.ok ? r.json() : { meta: { pagination: { total: 0 } } }),
    ]);

    return {
      products: productData.meta?.pagination?.total ?? 0,
      views: viewData?.meta?.pagination?.total ?? 0,
    };
  } catch {
    return { products: 0, views: 0 };
  }
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default async function AboutPage() {
  const stats = await fetchStats();

  const STATS = [
    { value: stats.products > 0 ? formatCount(stats.products) : '0', label: 'Products tracked', color: 'text-purple-400' },
    { value: stats.views > 0 ? formatCount(stats.views) : '0', label: 'Views analysed', color: 'text-cyan-400' },
    { value: '4', label: 'Platforms monitored', color: 'text-pink-400' },
    { value: '24/7', label: 'Real-time pipeline', color: 'text-amber-400' },
  ];

  return (
    <div className='min-h-screen'>
      {/* ─── Hero ───────────────────────────────────────────────────────── */}
      <section className='relative overflow-hidden py-28 sm:py-40'>
        {/* Background orbs */}
        <div className='absolute top-0 left-1/3 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[140px] animate-float' />
        <div className='absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[120px] animate-float-delayed' />
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-pink-500/10 rounded-full blur-[160px] animate-float-slow' />

        {/* Grid overlay */}
        <div
          className='absolute inset-0 opacity-[0.03]'
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating shapes */}
        <div className='absolute top-24 right-[12%] w-20 h-20 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm rotate-12 animate-float-slow hidden lg:block' />
        <div className='absolute bottom-28 left-[8%] w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm -rotate-6 animate-float-delayed hidden lg:block' />
        <div className='absolute top-44 left-[5%] w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm rotate-45 animate-float hidden lg:block' />
        <div className='absolute bottom-20 right-[6%] w-16 h-16 rounded-xl bg-pink-500/10 border border-pink-500/20 backdrop-blur-sm rotate-[20deg] animate-float hidden lg:block' />

        <div className='relative z-10 text-center max-w-4xl mx-auto px-4'>
          {/* Pill */}
          <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm text-gray-300 mb-8 animate-fade-in'>
            <span className='relative flex h-2 w-2'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75' />
              <span className='relative inline-flex rounded-full h-2 w-2 bg-purple-500' />
            </span>
            Our story
          </div>

          <h1 className='text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] animate-fade-in-up'>
            <span className='text-white'>We Find What&apos;s</span>
            <br />
            <span className='bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]'>
              Breaking The Internet
            </span>
            <br />
            <span className='text-white'>So You Don&apos;t Have To</span>
          </h1>

          <p className='mt-8 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up [animation-delay:200ms]'>
            Seenlio is the engine behind trending product discovery. We watch
            what goes viral, identify the exact products, and bring them to you
            — with real data, fair prices, and zero guesswork.
          </p>
        </div>
      </section>

      <div className='mx-auto max-w-6xl px-4 pb-32 space-y-32'>
        {/* ─── Stats bar ────────────────────────────────────────────────── */}
        <section className='animate-fade-in-up [animation-delay:400ms]'>
          <div className='glass-heavy rounded-[var(--radius-xl)] p-8 sm:p-10'>
            <div className='h-px bg-gradient-to-r from-transparent via-[var(--accent-purple)] to-transparent opacity-60 -mt-8 sm:-mt-10 mb-8 sm:mb-10 rounded-full' />
            <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
              {STATS.map((stat) => (
                <div key={stat.label} className='text-center'>
                  <div
                    className={`text-3xl sm:text-4xl font-extrabold ${stat.color}`}
                  >
                    {stat.value}
                  </div>
                  <div className='text-xs text-gray-500 mt-2 font-medium uppercase tracking-wider'>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Origin story timeline ────────────────────────────────────── */}
        <section>
          <div className='text-center mb-16'>
            <h2 className='text-3xl sm:text-4xl font-bold text-white mb-4'>
              How it{' '}
              <span className='gradient-text-warm'>started</span>
            </h2>
            <p className='text-gray-400 max-w-xl mx-auto'>
              Every great product starts with a simple frustration.
            </p>
          </div>

          <div className='relative'>
            {/* Vertical line */}
            <div className='absolute left-6 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/40 via-pink-500/40 to-cyan-500/40 sm:-translate-x-px' />

            <div className='space-y-16 sm:space-y-20'>
              {TIMELINE.map((step, i) => (
                <div
                  key={step.title}
                  className={`relative flex items-start gap-6 sm:gap-12 opacity-0 animate-fade-in-up ${
                    i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                  }`}
                  style={{
                    animationDelay: `${i * 200}ms`,
                    animationFillMode: 'forwards',
                  }}
                >
                  {/* Node */}
                  <div className='absolute left-6 sm:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[var(--bg-secondary)] border-2 border-purple-500/40 flex items-center justify-center text-xl z-10 shadow-lg shadow-purple-500/10'>
                    {step.icon}
                  </div>

                  {/* Content card */}
                  <div
                    className={`ml-20 sm:ml-0 sm:w-[calc(50%-3rem)] glass-card p-6 sm:p-8 ${
                      i % 2 === 0 ? 'sm:mr-auto sm:text-right' : 'sm:ml-auto'
                    }`}
                  >
                    <h3 className='text-lg font-semibold text-white mb-2'>
                      {step.title}
                    </h3>
                    <p className='text-gray-400 text-sm leading-relaxed'>
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Values ───────────────────────────────────────────────────── */}
        <section>
          <div className='text-center mb-16'>
            <h2 className='text-3xl sm:text-4xl font-bold text-white mb-4'>
              What we{' '}
              <span className='gradient-text'>stand for</span>
            </h2>
            <p className='text-gray-400 max-w-xl mx-auto'>
              These aren&apos;t wall posters. They&apos;re the decisions we make
              every day.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {VALUES.map((v, i) => (
              <div
                key={v.title}
                className='group relative glass-card p-8 opacity-0 animate-fade-in-up'
                style={{
                  animationDelay: `${i * 120}ms`,
                  animationFillMode: 'forwards',
                }}
              >
                {/* Glow on hover */}
                <div
                  className='absolute -inset-px rounded-[var(--radius-lg)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl'
                  style={{ background: v.glow }}
                />

                {/* Gradient bar */}
                <div
                  className={`h-1 w-12 rounded-full bg-gradient-to-r ${v.gradient} mb-6`}
                />

                <h3 className='text-xl font-semibold text-white mb-3'>
                  {v.title}
                </h3>
                <p className='text-gray-400 text-sm leading-relaxed'>
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── How it works ─────────────────────────────────────────────── */}
        <section>
          <div className='text-center mb-16'>
            <h2 className='text-3xl sm:text-4xl font-bold text-white mb-4'>
              How{' '}
              <span className='gradient-text-cool'>Seenlio</span>
              {' '}works
            </h2>
            <p className='text-gray-400 max-w-xl mx-auto'>
              From viral moment to your screen in three steps.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {[
              {
                step: '01',
                title: 'Detect',
                description:
                  'Our pipeline monitors trending content across TikTok, Instagram, YouTube, and X — identifying products that are gaining explosive traction.',
                icon: (
                  <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Verify',
                description:
                  'Each product is matched to real listings, cross-referenced across retailers, and enriched with pricing, ratings, and availability data.',
                icon: (
                  <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Deliver',
                description:
                  'Products go live on Seenlio with trend scores, multi-platform price comparisons, and direct links — ready for you to discover.',
                icon: (
                  <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className='relative glass-card p-8 opacity-0 animate-fade-in-up'
                style={{
                  animationDelay: `${i * 120}ms`,
                  animationFillMode: 'forwards',
                }}
              >
                {/* Step number */}
                <span className='absolute top-6 right-6 text-5xl font-extrabold text-white/[0.04] select-none'>
                  {item.step}
                </span>

                {/* Icon circle */}
                <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center text-purple-400 mb-6'>
                  {item.icon}
                </div>

                <h3 className='text-xl font-semibold text-white mb-3'>
                  {item.title}
                </h3>
                <p className='text-gray-400 text-sm leading-relaxed'>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Affiliate disclosure ──────────────────────────────────────── */}
        <section className='glass-card p-8 sm:p-12 text-center'>
          <div className='max-w-2xl mx-auto'>
            <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-pink-400 mx-auto mb-6'>
              <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418' />
              </svg>
            </div>
            <h2 className='text-2xl font-bold text-white mb-4'>
              Full transparency
            </h2>
            <p className='text-gray-400 leading-relaxed mb-2'>
              Seenlio contains affiliate links. When you buy through our links,
              we may earn a small commission at{' '}
              <strong className='text-gray-300'>
                no extra cost to you
              </strong>
              . This helps us keep the lights on and the pipeline running.
            </p>
            <p className='text-gray-500 text-sm'>
              We never let partnerships influence what we feature. If it&apos;s
              trending, it&apos;s here — period.
            </p>
          </div>
        </section>

        {/* ─── CTA ──────────────────────────────────────────────────────── */}
        <section className='relative text-center py-16'>
          {/* Glow behind CTA */}
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-500/10 rounded-full blur-[100px]' />

          <div className='relative z-10'>
            <h2 className='text-3xl sm:text-4xl font-bold text-white mb-4'>
              Ready to discover?
            </h2>
            <p className='text-gray-400 max-w-md mx-auto mb-10'>
              See what&apos;s trending right now — updated every hour.
            </p>

            <div className='flex flex-col sm:flex-row justify-center gap-4'>
              <Link
                href='/trending'
                className='group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]'
              >
                <div className='absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600' />
                <div className='absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300' />
                <span className='relative flex items-center gap-2'>
                  Explore Trending
                  <svg
                    className='w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={2}
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d='M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3' />
                  </svg>
                </span>
              </Link>
              <Link
                href='/products'
                className='group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]'
              >
                Browse All Products
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
