import Link from 'next/link';
import { resolveProductImage } from '@/lib/productImage';
import ListicleCollage from '@/components/ListicleCollage';

export interface ListicleCardData {
  title?: string;
  slug?: string;
  angleHook?: string;
  priceTier?: string;
  products?: Array<{
    productCode?: string;
    featuredImage?: { url?: string };
    media?: Array<{ url?: string; type?: string | null; isPrimary?: boolean | null }>;
  }>;
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

export default function ListicleCard({ list }: { list: ListicleCardData }) {
  const tier = priceTierLabel(list.priceTier);
  const cardImages: string[] = [];
  const seen = new Set<string>();
  for (const p of list.products || []) {
    if (cardImages.length >= 4) break;
    const url = resolveProductImage(p);
    if (url && !seen.has(url)) {
      cardImages.push(url);
      seen.add(url);
    }
  }

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:border-purple-500/40 hover:bg-white/[0.04]"
    >
      <ListicleCollage images={cardImages} alt={list.title || ''} variant="card" />
      <div className="flex flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {tier && (
            <span className="rounded bg-white/5 px-2 py-0.5 text-purple-300">{tier}</span>
          )}
          {list.products?.length ? <span>{list.products.length} picks</span> : null}
        </div>
        <h2 className="mt-3 text-lg font-semibold text-white group-hover:text-purple-200">
          {list.title}
        </h2>
        {list.angleHook && (
          <p className="mt-2 line-clamp-3 text-sm text-gray-400">{list.angleHook}</p>
        )}
      </div>
    </Link>
  );
}
