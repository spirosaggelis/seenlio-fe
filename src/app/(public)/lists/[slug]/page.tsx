import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  getListicleBySlug,
  getRelatedListicles,
  getPublishedListicles,
} from '@/lib/strapi';
import { proxyImage } from '@/lib/imageProxy';
import PlatformBadge from '@/components/PlatformBadge';

export const revalidate = 600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ListicleItem {
  position?: number;
  productCode?: string;
  productName?: string;
  headline?: string;
  commentary?: string;
  tag?: string;
}

interface ListicleProduct {
  documentId?: string;
  productCode?: string;
  name?: string;
  slug?: string;
  sourcePlatform?: string;
  shortDescription?: string;
  pricePoints?: Array<{ price: number; currency?: string }>;
  featuredImage?: { url?: string; formats?: Record<string, { url?: string }> };
}

interface FullListicle {
  documentId?: string;
  title?: string;
  slug?: string;
  intro?: string;
  howWePicked?: string;
  outro?: string;
  targetKeyword?: string;
  longtailKeywords?: string[];
  priceTier?: string;
  searchIntent?: string;
  publishedOn?: string;
  generatedAt?: string;
  items?: ListicleItem[];
  products?: ListicleProduct[];
  featuredImage?: { url?: string };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    structuredData?: Record<string, unknown> | null;
  };
}

interface RelatedListicle {
  title?: string;
  slug?: string;
  angleHook?: string;
  priceTier?: string;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listicle = (await getListicleBySlug(slug)) as FullListicle | null;
  if (!listicle) return { title: 'Round-up not found' };
  const seoTitle =
    listicle.seo?.metaTitle || `${listicle.title} · Seenlio`;
  const seoDesc =
    listicle.seo?.metaDescription ||
    (listicle.intro || '').slice(0, 155);
  return {
    title: seoTitle,
    description: seoDesc,
    alternates: {
      canonical: listicle.seo?.canonicalUrl || `/lists/${slug}`,
    },
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      url: `/lists/${slug}`,
      type: 'article',
      images: listicle.featuredImage?.url
        ? [{ url: proxyImage(listicle.featuredImage.url) }]
        : [{ url: '/logo.png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDesc,
    },
  };
}

export async function generateStaticParams() {
  try {
    const lists = await getPublishedListicles({
      fields: ['slug'],
      pagination: { pageSize: 200 },
    });
    return lists
      .map((l) => ({ slug: (l as { slug?: string }).slug || '' }))
      .filter((p) => p.slug);
  } catch {
    return [];
  }
}

function firstImage(product: ListicleProduct): string | undefined {
  if (product.featuredImage?.url) return product.featuredImage.url;
  return undefined;
}

function priceOf(product: ListicleProduct): number | undefined {
  return product.pricePoints?.[0]?.price;
}

function priceTierLabel(tier: string | undefined) {
  switch (tier) {
    case 'tier_under_10':
      return 'Under €10';
    case 'tier_10_30':
      return '€10–30';
    case 'tier_30_100':
      return '€30–100';
    case 'tier_100_plus':
      return '€100+';
    default:
      return null;
  }
}

export default async function ListiclePage({ params }: PageProps) {
  const { slug } = await params;
  const listicle = (await getListicleBySlug(slug)) as FullListicle | null;
  if (!listicle) notFound();

  const tier = priceTierLabel(listicle.priceTier);
  const productByCode: Record<string, ListicleProduct> = {};
  for (const p of listicle.products || []) {
    if (p.productCode) productByCode[p.productCode] = p;
  }

  // Render items in author-defined order; fall back to product order if items
  // is empty (e.g. an old listicle published before article generation).
  const items: ListicleItem[] =
    listicle.items && listicle.items.length > 0
      ? [...listicle.items].sort(
          (a, b) => (a.position ?? 99) - (b.position ?? 99),
        )
      : (listicle.products || []).map((p, i) => ({
          position: i + 1,
          productCode: p.productCode,
          productName: p.name,
          headline: p.name,
          commentary: p.shortDescription || '',
        }));

  const related = (await getRelatedListicles(slug, listicle.priceTier)) as RelatedListicle[];

  // ItemList structured data — helps Google understand the round-up shape
  const ldItemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listicle.title,
    numberOfItems: items.length,
    itemListElement: items.map((it, idx) => {
      const product = productByCode[it.productCode || ''];
      return {
        '@type': 'ListItem',
        position: it.position ?? idx + 1,
        name: it.headline || it.productName || product?.name,
        url: product?.slug ? `https://seenlio.com/products/${product.slug}` : undefined,
      };
    }),
  };

  return (
    <article className='min-h-screen bg-[#0a0a0f]'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldItemList) }}
      />
      <div className='mx-auto max-w-3xl px-4 py-12 sm:py-16'>
        <nav className='mb-6 text-sm text-gray-500'>
          <Link href='/lists' className='hover:text-purple-300'>
            ← All round-ups
          </Link>
        </nav>

        <header className='mb-10'>
          <div className='flex flex-wrap items-center gap-2 text-xs'>
            {tier && (
              <span className='rounded-full bg-purple-500/15 px-3 py-1 text-purple-300'>
                {tier}
              </span>
            )}
            <span className='rounded-full bg-white/5 px-3 py-1 text-gray-400'>
              {items.length} picks
            </span>
          </div>
          <h1 className='mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl'>
            {listicle.title}
          </h1>
          {listicle.intro && (
            <p className='mt-6 text-lg leading-relaxed text-gray-300'>
              {listicle.intro}
            </p>
          )}
        </header>

        <div className='space-y-12'>
          {items.map((item, idx) => {
            const product = productByCode[item.productCode || ''];
            if (!product) return null;
            const image = firstImage(product);
            const price = priceOf(product);
            const position = item.position ?? idx + 1;

            return (
              <section
                key={`${item.productCode}-${idx}`}
                id={`pick-${position}`}
                className='scroll-mt-20'
              >
                <div className='flex items-baseline gap-3'>
                  <span className='text-3xl font-bold text-purple-400/80'>
                    {position}.
                  </span>
                  <h2 className='text-2xl font-semibold leading-tight text-white sm:text-3xl'>
                    {item.headline || product.name}
                  </h2>
                </div>
                {item.tag && (
                  <span className='mt-2 inline-block rounded-md bg-amber-400/10 px-2 py-0.5 text-xs text-amber-300'>
                    {item.tag}
                  </span>
                )}

                <div className='mt-4 grid gap-6 sm:grid-cols-[200px_1fr]'>
                  <Link
                    href={`/products/${product.slug}`}
                    className='relative block aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]'
                  >
                    {image ? (
                      <Image
                        src={proxyImage(image)}
                        alt={product.name || ''}
                        fill
                        sizes='200px'
                        className='object-cover transition-transform duration-300 hover:scale-105'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center text-gray-600'>
                        no image
                      </div>
                    )}
                  </Link>
                  <div>
                    <div className='mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500'>
                      {product.sourcePlatform && (
                        <PlatformBadge platform={product.sourcePlatform} />
                      )}
                      {price !== undefined && (
                        <span className='text-gray-400'>
                          ≈ €{price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {item.commentary && (
                      <p className='text-base leading-relaxed text-gray-300'>
                        {item.commentary}
                      </p>
                    )}
                    <Link
                      href={`/products/${product.slug}`}
                      className='mt-3 inline-flex items-center gap-1 text-sm font-medium text-purple-300 hover:text-purple-200'
                    >
                      See it on Seenlio →
                    </Link>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {listicle.howWePicked && (
          <section className='mt-16 rounded-xl border border-white/10 bg-white/[0.02] p-6'>
            <h2 className='text-lg font-semibold text-white'>How we picked</h2>
            <p className='mt-3 text-sm leading-relaxed text-gray-400'>
              {listicle.howWePicked}
            </p>
          </section>
        )}

        {listicle.outro && (
          <section className='mt-10'>
            <p className='text-base leading-relaxed text-gray-300'>
              {listicle.outro}
            </p>
          </section>
        )}

        {related.length > 0 && (
          <section className='mt-16 border-t border-white/10 pt-10'>
            <h2 className='mb-4 text-lg font-semibold text-white'>Related round-ups</h2>
            <ul className='grid gap-3 sm:grid-cols-2'>
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/lists/${r.slug}`}
                    className='block rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:border-purple-500/40'
                  >
                    <p className='font-medium text-white'>{r.title}</p>
                    {r.angleHook && (
                      <p className='mt-1 line-clamp-2 text-sm text-gray-400'>
                        {r.angleHook}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
