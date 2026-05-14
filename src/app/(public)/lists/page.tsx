import { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedListicles } from '@/lib/strapi';

export const metadata: Metadata = {
  title: 'Round-ups & gift guides',
  description:
    'Curated round-ups of trending products from Amazon, AliExpress and Temu — grouped by use case, price tier, and category.',
  alternates: { canonical: '/lists' },
  openGraph: {
    title: 'Seenlio round-ups & gift guides',
    description:
      'Curated round-ups of trending products from Amazon, AliExpress and Temu.',
    url: '/lists',
    images: [{ url: '/logo.png' }],
  },
};

export const revalidate = 600;

interface ListicleListItem {
  id?: number;
  documentId?: string;
  title?: string;
  slug?: string;
  angleHook?: string;
  priceTier?: string;
  searchIntent?: string;
  products?: Array<{ productCode?: string }>;
  publishedOn?: string;
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

export default async function ListsIndexPage() {
  let lists: ListicleListItem[] = [];
  try {
    lists = (await getPublishedListicles()) as ListicleListItem[];
  } catch {
    /* Strapi may be down — show the empty state */
  }

  return (
    <div className='min-h-screen bg-[#0a0a0f]'>
      <div className='mx-auto max-w-6xl px-4 py-16'>
        <div className='mb-12 text-center'>
          <div className='inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300'>
            Editor-curated round-ups
          </div>
          <h1 className='mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl'>
            <span className='bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200 bg-clip-text text-transparent'>
              Lists worth scrolling
            </span>
          </h1>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-400'>
            Trending products grouped the way people actually shop — by budget,
            niche, and the specific problem they solve. Updated as new products
            move through the pipeline.
          </p>
        </div>

        {lists.length === 0 ? (
          <p className='py-16 text-center text-gray-400'>
            No round-ups published yet. Come back soon.
          </p>
        ) : (
          <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
            {lists.map((l) => {
              const tier = priceTierLabel(l.priceTier);
              return (
                <Link
                  key={l.slug}
                  href={`/lists/${l.slug}`}
                  className='group flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:border-purple-500/40 hover:bg-white/[0.04]'
                >
                  <div className='flex items-center gap-2 text-xs text-gray-500'>
                    {tier && (
                      <span className='rounded bg-white/5 px-2 py-0.5 text-purple-300'>
                        {tier}
                      </span>
                    )}
                    {l.products?.length ? (
                      <span>{l.products.length} picks</span>
                    ) : null}
                  </div>
                  <h2 className='mt-3 text-lg font-semibold text-white group-hover:text-purple-200'>
                    {l.title}
                  </h2>
                  {l.angleHook && (
                    <p className='mt-2 line-clamp-3 text-sm text-gray-400'>
                      {l.angleHook}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
