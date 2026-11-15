import { NextRequest, NextResponse } from 'next/server';
import {
  buildAmazonDestination,
  DEFAULT_US_AMAZON_TAG,
} from '@/lib/amazonRouting';
import { getVisitorCountry } from '@/lib/affiliateDestination';
import type { AffiliatePattern } from '@/lib/affiliateTypes';
import { parseOutboundTraffic } from '@/lib/outboundTracking';

export const dynamic = 'force-dynamic';

const STRAPI_URL =
  process.env.STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';

async function amazonPattern(): Promise<AffiliatePattern | null> {
  try {
    const res = await fetch(`${STRAPI_URL}/api/setting?populate=affiliatePatterns`, {
      headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const patterns = (json?.data?.affiliatePatterns || []) as AffiliatePattern[];
    return patterns.find((pattern) => pattern.platform === 'amazon' && pattern.isActive !== false) || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const asin = searchParams.get('asin')?.trim().toUpperCase() || '';
  const productCode = searchParams.get('productCode') || '';
  const country = getVisitorCountry(request.headers, searchParams.get('country'));
  const traffic = parseOutboundTraffic({
    s: searchParams.get('s'),
    ch: searchParams.get('ch'),
  });

  if (!/^[A-Z0-9]{10}$/.test(asin)) {
    return NextResponse.redirect(
      `https://www.amazon.com?tag=${DEFAULT_US_AMAZON_TAG}`,
      { status: 302 },
    );
  }

  const pattern = await amazonPattern();
  const destination = buildAmazonDestination({
    asin,
    country,
    productCode,
    pattern,
    traffic,
  });

  return NextResponse.redirect(destination || 'https://www.amazon.com', { status: 302 });
}
