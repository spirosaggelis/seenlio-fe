import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import GoRedirectClient from './GoRedirectClient';
import type { AffiliatePattern } from '@/lib/affiliateTypes';
import {
  buildAffiliateDestinationUrl,
  getVisitorCountry,
  type AffiliateProductInput,
} from '@/lib/affiliateDestination';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Short links resolve affiliate URLs per visitor (Amazon geo, Temu links). */
export const dynamic = 'force-dynamic';

const STRAPI_URL =
  process.env.STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';

interface PricePoint {
  price: number;
  currency?: string;
  originalPrice?: number;
}

interface MediaItem {
  url?: string;
  type?: 'image' | 'video';
  isPrimary?: boolean;
}

interface Product extends AffiliateProductInput {
  id: number;
  name?: string;
  media?: MediaItem[];
  pricePoints?: PricePoint[];
}

async function lookupProduct(code: string): Promise<Product | null> {
  try {
    const params = [
      `filters[productCode][$eq]=${encodeURIComponent(code)}`,
      `filters[productStatus][$eq]=published`,
      `populate[affiliateLinks]=true`,
      `populate[media]=true`,
      `populate[pricePoints]=true`,
      `fields[0]=id`,
      `fields[1]=productCode`,
      `fields[2]=sourceUrl`,
      `fields[3]=sourcePlatform`,
      `fields[4]=name`,
    ].join('&');
    const res = await fetch(`${STRAPI_URL}/api/products?${params}`, {
      headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.[0] ?? null;
  } catch {
    return null;
  }
}

async function getAffiliatePatterns(): Promise<AffiliatePattern[]> {
  try {
    const res = await fetch(
      `${STRAPI_URL}/api/setting?populate=affiliatePatterns`,
      {
        headers: STRAPI_TOKEN
          ? { Authorization: `Bearer ${STRAPI_TOKEN}` }
          : {},
        next: { revalidate: 300 },
      },
    );
    if (res.ok) {
      const json = await res.json();
      return json?.data?.affiliatePatterns || [];
    }
  } catch {
    // fall through
  }
  return [];
}

export default async function GoPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const [{ code }, sp] = await Promise.all([params, searchParams]);
  const productCode = code.toUpperCase();

  const reqHeaders = await headers();

  const [product, patterns] = await Promise.all([
    lookupProduct(productCode),
    getAffiliatePatterns(),
  ]);

  if (!product) {
    redirect(`/products?search=${encodeURIComponent(productCode)}`);
  }

  const country = getVisitorCountry(reqHeaders, sp['country']);

  console.log(
    `[go] product=${product.productCode} platform=${product.sourcePlatform} country=${country} patterns=${patterns.length}`,
  );
  const destinationUrl = await buildAffiliateDestinationUrl(
    product,
    patterns,
    country,
  );
  console.log(`[go] destinationUrl=${destinationUrl}`);

  const primaryImage =
    product.media?.find((m) => m.isPrimary && m.type !== 'video')?.url ||
    product.media?.find((m) => m.type !== 'video')?.url ||
    null;

  const price = product.pricePoints?.[0] || null;

  return (
    <GoRedirectClient
      destinationUrl={destinationUrl}
      productCode={product.productCode}
      platform={product.sourcePlatform || 'other'}
      productName={product.name}
      productImage={primaryImage}
      price={price?.price ?? null}
      originalPrice={price?.originalPrice ?? null}
      currency={price?.currency ?? null}
      country={country}
    />
  );
}
