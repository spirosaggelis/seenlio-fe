import { getBaseUrl } from '@/lib/dashboard-api';
import ListiclesClient from './ListiclesClient';

export interface ListicleRow {
  id: string;
  title: string;
  slug: string;
  listicleStatus: string;
  targetKeyword?: string | null;
  longtailKeywords?: string[] | null;
  searchIntent?: string | null;
  priceTier?: string | null;
  sourcePlatformFilter?: string | null;
  angleHook?: string | null;
  wordCountTarget?: number | null;
  priorityScore?: number | null;
  priorityRationale?: string | null;
  generatedAt?: string | null;
  publishedOn?: string | null;
  createdAt?: string;
  products?: Array<{
    documentId?: string;
    id?: string | number;
    productCode?: string;
    name?: string;
    slug?: string;
  }>;
}

async function fetchInitial(): Promise<ListicleRow[]> {
  const res = await fetch(`${getBaseUrl()}/api/dashboard/listicles`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.listicles || [];
}

export default async function ListiclesPage() {
  const listicles = await fetchInitial();
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-[var(--fg-primary)]'>Listicles</h1>
        <p className='text-sm text-[var(--fg-muted)] mt-1'>
          AI-generated round-up hub pages — designed to improve internal linking
          and capture long-tail search traffic for Seenlio. Plan groups your
          approved products into proposals; generate writes the full editorial
          body; publish exposes the page on{' '}
          <code className='text-[var(--accent-purple-light)]'>/lists</code>.
        </p>
      </div>
      <ListiclesClient initial={listicles} />
    </div>
  );
}
