import { NextRequest, NextResponse } from 'next/server';
import {
  buildAffiliateDestinationUrl,
  getVisitorCountry,
  type AffiliateProductInput,
} from '@/lib/affiliateDestination';
import type { AffiliatePattern } from '@/lib/affiliateTypes';

export const dynamic = 'force-dynamic';

const STRAPI_URL =
  process.env.STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';

async function lookupProduct(code: string): Promise<AffiliateProductInput | null> {
  try {
    const params = [
      `filters[productCode][$eq]=${encodeURIComponent(code)}`,
      `filters[productStatus][$eq]=published`,
      `populate[affiliateLinks]=true`,
      `fields[0]=productCode`,
      `fields[1]=sourceUrl`,
      `fields[2]=sourcePlatform`,
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

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: 'code required' }, { status: 400 });
  }

  const countryOverride = request.nextUrl.searchParams.get('country');
  const country = getVisitorCountry(request.headers, countryOverride);

  const [product, patterns] = await Promise.all([
    lookupProduct(code),
    getAffiliatePatterns(),
  ]);

  if (!product) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const url = await buildAffiliateDestinationUrl(product, patterns, country);
  return NextResponse.json({ url });
}
