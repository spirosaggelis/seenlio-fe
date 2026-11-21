import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import GoPreview from './GoPreview';
import GoRedirectClient from './GoRedirectClient';
import GtmSnippet from '@/components/GtmSnippet';
import { CURRENCY_SYMBOL } from '@/lib/amazonRouting';
import type { AffiliatePattern } from '@/lib/affiliateTypes';
import {
  getVisitorCountry,
  resolveAffiliateDestination,
  type AffiliateProductInput,
} from '@/lib/affiliateDestination';
import { parseOutboundTraffic } from '@/lib/outboundTracking';
import { isCrawler, isInAppBrowser } from '@/lib/requestAgents';

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
  slug?: string;
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
      `fields[5]=slug`,
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

function primaryImageOf(product: Product): string | null {
  return (
    product.media?.find((m) => m.isPrimary && m.type !== 'video')?.url ||
    product.media?.find((m) => m.type !== 'video')?.url ||
    null
  );
}

function priceTextOf(product: Product): string | null {
  const price = product.pricePoints?.[0] || null;
  if (price?.price == null) return null;
  const storedCurrency = (price.currency || 'USD').toUpperCase();
  const symbol = CURRENCY_SYMBOL[storedCurrency] || `${storedCurrency} `;
  return `${symbol}${price.price.toFixed(2)}`;
}

function productHrefOf(product: Product, productCode: string): string {
  if (product.slug) return `/products/${encodeURIComponent(product.slug)}`;
  return `/products?search=${encodeURIComponent(productCode)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const product = await lookupProduct(code.toUpperCase());
  const title = product?.name || 'Seenlio';
  const image = product ? primaryImageOf(product) : null;
  return {
    title,
    description: product?.name ? `${product.name} on Seenlio` : 'Seenlio',
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description: product?.name ? `${product.name} on Seenlio` : 'Seenlio',
      images: image ? [{ url: image }] : [{ url: '/logo.png' }],
    },
  };
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

  const product = await lookupProduct(productCode);

  if (!product) {
    redirect(`/products?search=${encodeURIComponent(productCode)}`);
  }

  const userAgent = reqHeaders.get('user-agent');
  const primaryImage = primaryImageOf(product);
  const priceText = priceTextOf(product);

  if (isCrawler(userAgent)) {
    console.log(
      `[go] crawler product=${product.productCode} platform=${product.sourcePlatform || '-'}`,
    );
    return (
      <GoPreview
        productName={product.name}
        productCode={product.productCode}
        productImage={primaryImage}
        priceText={priceText}
        productHref={productHrefOf(product, productCode)}
      />
    );
  }

  const country = getVisitorCountry(reqHeaders, sp['country']);
  const traffic = parseOutboundTraffic({ s: sp.s, ch: sp.ch });
  const patterns = await getAffiliatePatterns();
  const destination = await resolveAffiliateDestination(product, patterns, country, {
    traffic,
  });

  console.log(
    `[go] product=${product.productCode} platform=${product.sourcePlatform} country=${country} store=${destination.store} source=${traffic.source || '-'}`,
  );

  return (
    <>
      <GtmSnippet />
      <GoRedirectClient
        destinationUrl={destination.url}
        productCode={product.productCode}
        platform={product.sourcePlatform || 'other'}
        productName={product.name}
        productImage={primaryImage}
        priceText={priceText}
        instant={isInAppBrowser(userAgent)}
        tracking={{
          product_code: product.productCode,
          store: destination.store,
          country,
          tag: destination.tag,
          source: traffic.source,
          channel: traffic.channel,
        }}
      />
    </>
  );
}
