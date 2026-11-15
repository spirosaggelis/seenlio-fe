import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import GoRedirectClient from './GoRedirectClient';
import GtmSnippet from '@/components/GtmSnippet';
import { CURRENCY_SYMBOL, currencyForCountry } from '@/lib/amazonRouting';
import type { AffiliatePattern } from '@/lib/affiliateTypes';
import {
  getVisitorCountry,
  resolveAffiliateDestination,
  type AffiliateProductInput,
} from '@/lib/affiliateDestination';
import { parseOutboundTraffic } from '@/lib/outboundTracking';
import { isInAppBrowser, isUntrackedAgent, shouldSkipSplash } from '@/lib/requestAgents';

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
  const traffic = parseOutboundTraffic({ s: sp.s, ch: sp.ch });
  const userAgent = reqHeaders.get('user-agent');

  const destination = await resolveAffiliateDestination(product, patterns, country, {
    traffic,
  });

  console.log(
    `[go] product=${product.productCode} platform=${product.sourcePlatform} country=${country} store=${destination.store} source=${traffic.source || '-'}`,
  );

  if (destination.url && (isUntrackedAgent(userAgent) || (shouldSkipSplash(userAgent) && !isInAppBrowser(userAgent)))) {
    redirect(destination.url);
  }

  const primaryImage =
    product.media?.find((m) => m.isPrimary && m.type !== 'video')?.url ||
    product.media?.find((m) => m.type !== 'video')?.url ||
    null;

  const price = product.pricePoints?.[0] || null;
  const storedCurrency = (price?.currency || 'USD').toUpperCase();
  const showAmount = price?.price != null && storedCurrency === currencyForCountry(country);
  const priceText = showAmount
    ? `${CURRENCY_SYMBOL[storedCurrency] || ''}${price!.price.toFixed(2)}`
    : null;

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
        seePrice={price?.price != null && !showAmount}
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
