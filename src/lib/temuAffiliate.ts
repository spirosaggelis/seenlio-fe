import type { AffiliatePattern } from './affiliateTypes';

/** Temu only counts clicks on official affiliate links — not bare PDP URLs + _x_cid. */
export function isOfficialTemuAffiliateUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.hostname === 'temu.to') return true;
    if (u.searchParams.has('adg_ctx') || u.searchParams.has('_p_adg_gwid')) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function extractTemuGoodsId(url: string): string | null {
  try {
    const u = new URL(url);
    const fromQuery = u.searchParams.get('goods_id');
    if (fromQuery) return fromQuery;
    const m = u.pathname.match(/-g-(\d{10,})/);
    return m ? m[1] : null;
  } catch {
    const m = url.match(/goods_id[=_](\d+)/);
    return m ? m[1] : null;
  }
}

/** Product detail page URL (opens PDP, not the goods-un feed grid). */
export function buildTemuProductDetailUrl(
  goodsId: string,
  productCode: string,
): string {
  const url = new URL('https://www.temu.com/kuiper/uk1.html');
  url.searchParams.set('subj', 'goods-detail');
  url.searchParams.set('_bg_fs', '1');
  url.searchParams.set('goods_id', goodsId);
  url.searchParams.set('utm_source', 'seenlio');
  url.searchParams.set('utm_medium', 'temu');
  url.searchParams.set('utm_campaign', productCode);
  return url.toString();
}

function appendSeenlioUtm(url: URL, productCode: string): string {
  url.searchParams.set('utm_source', 'seenlio');
  url.searchParams.set('utm_medium', 'temu');
  url.searchParams.set('utm_campaign', productCode);
  return url.toString();
}

/**
 * Resolve the Temu outbound URL for /go/{code}.
 * Official temu.to links are used unchanged (affiliate tracking).
 * Fallback PDP links get UTM only — _x_cid on bare URLs does not track in Temu.
 */
export function resolveTemuDestinationUrl(
  rawUrl: string,
  _pattern: AffiliatePattern | undefined,
  productCode: string,
): string {
  if (!rawUrl) return 'https://seenlio.com/products';

  if (isOfficialTemuAffiliateUrl(rawUrl)) {
    return rawUrl;
  }

  if (
    rawUrl.includes('subj=goods-detail') ||
    /-g-\d{10,}/.test(rawUrl)
  ) {
    try {
      return appendSeenlioUtm(new URL(rawUrl), productCode);
    } catch {
      return rawUrl;
    }
  }

  const goodsId = extractTemuGoodsId(rawUrl);
  if (goodsId) {
    return buildTemuProductDetailUrl(goodsId, productCode);
  }

  try {
    return appendSeenlioUtm(new URL(rawUrl), productCode);
  } catch {
    return rawUrl;
  }
}
