import { Metadata } from 'next';
import { getPublishedListicles } from '@/lib/strapi';
import ListicleCard, { type ListicleCardData } from '@/components/ListicleCard';

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

interface ListicleListItem extends ListicleCardData {
  id?: number;
  documentId?: string;
  searchIntent?: string;
  publishedOn?: string;
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
            {lists.map((l) => (
              <ListicleCard key={l.slug} list={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
