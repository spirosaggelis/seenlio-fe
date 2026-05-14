import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

type Platform = 'amazon' | 'aliexpress' | 'temu';

interface ParsedUrl {
  platform: Platform;
  externalId: string;
  cleanUrl: string;
}

function parseProductUrl(raw: string): ParsedUrl | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '');

  if (host.endsWith('amazon.com') || host.endsWith('amazon.co.uk') || host.endsWith('amazon.de') ||
      host.endsWith('amazon.fr') || host.endsWith('amazon.es') || host.endsWith('amazon.it') ||
      host.endsWith('amazon.ca') || host.endsWith('amazon.com.au') || host.endsWith('amazon.co.jp') ||
      host.endsWith('amazon.in')) {
    const asinMatch = url.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i);
    if (!asinMatch) return null;
    const asin = asinMatch[1].toUpperCase();
    return {
      platform: 'amazon',
      externalId: asin,
      cleanUrl: `https://${url.hostname}/dp/${asin}`,
    };
  }

  if (host.endsWith('aliexpress.com') || host.endsWith('aliexpress.us')) {
    const idMatch = url.pathname.match(/\/item\/(\d+)\.html/);
    if (!idMatch) return null;
    const productId = idMatch[1];
    return {
      platform: 'aliexpress',
      externalId: productId,
      cleanUrl: `https://www.aliexpress.com/item/${productId}.html`,
    };
  }

  if (host.endsWith('temu.com')) {
    const goodsId =
      url.searchParams.get('goods_id') ||
      url.pathname.match(/-g-(\d{10,})/)?.[1] ||
      url.pathname.match(/goods[_-]id[=_-](\d+)/)?.[1];
    if (!goodsId) return null;
    return {
      platform: 'temu',
      externalId: goodsId,
      cleanUrl: `https://www.temu.com/goods.html?goods_id=${goodsId}`,
    };
  }

  return null;
}

async function strapiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Strapi ${path} ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function randCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = 'VP';
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { url?: string; categoryId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.url || typeof body.url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  const parsed = parseProductUrl(body.url);
  if (!parsed) {
    return NextResponse.json(
      { error: 'Could not detect product platform from URL. Use an Amazon, AliExpress, or Temu product page URL.' },
      { status: 400 },
    );
  }

  // Reject duplicates so the same URL can't be re-queued while a previous one is pending.
  try {
    const existing = await strapiFetch(
      `/products?filters[sourcePlatform][$eq]=${parsed.platform}&filters[externalId][$eq]=${encodeURIComponent(parsed.externalId)}&fields[0]=id&fields[1]=productStatus&fields[2]=isManual&pagination[pageSize]=1`,
    );
    const dup = (existing.data || [])[0];
    if (dup) {
      const attrs = dup.attributes || dup;
      return NextResponse.json(
        {
          error: 'Product already exists',
          productStatus: attrs.productStatus,
          isManual: attrs.isManual,
          documentId: dup.documentId || dup.id,
        },
        { status: 409 },
      );
    }
  } catch (err) {
    console.error('[manual] duplicate check failed', err);
  }

  const code = randCode();
  const placeholderName = `[manual] ${parsed.platform} ${parsed.externalId}`;
  const now = new Date().toISOString();

  const data = {
    name: placeholderName,
    slug: slugify(`${placeholderName}-${code}`),
    description: 'Pending scrape — manual import',
    shortDescription: 'Manually added — details pending',
    sourceUrl: parsed.cleanUrl,
    sourcePlatform: parsed.platform,
    externalId: parsed.externalId,
    productCode: code,
    productStatus: 'discovered',
    isManual: true,
    discoveredAt: now,
    ...(body.categoryId ? { categories: [body.categoryId] } : {}),
  };

  try {
    const created = await strapiFetch('/products', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
    const createdData = created.data || created;
    return NextResponse.json({
      ok: true,
      documentId: createdData.documentId || createdData.id,
      productCode: code,
      platform: parsed.platform,
      externalId: parsed.externalId,
    });
  } catch (err) {
    console.error('[manual] create failed', err);
    return NextResponse.json(
      { error: 'Failed to create product in CMS', detail: String(err) },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const result = await strapiFetch(
      '/products?filters[isManual][$eq]=true&sort=createdAt:desc&pagination[pageSize]=50&fields[0]=name&fields[1]=productCode&fields[2]=productStatus&fields[3]=sourcePlatform&fields[4]=sourceUrl&fields[5]=externalId&fields[6]=videoState&fields[7]=sitePublishedAt&fields[8]=createdAt',
    );
    const products = (result.data || []).map((p: Record<string, unknown>) => {
      const attrs = (p.attributes as Record<string, unknown>) || p;
      return { id: p.documentId || p.id, ...attrs };
    });
    return NextResponse.json({ products });
  } catch (err) {
    console.error('[manual] list failed', err);
    return NextResponse.json({ products: [], error: String(err) }, { status: 500 });
  }
}
