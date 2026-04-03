const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface FetchOptions {
  populate?: string | string[] | Record<string, unknown>;
  filters?: Record<string, unknown>;
  sort?: string | string[];
  pagination?: { page?: number; pageSize?: number };
  fields?: string[];
}

function buildQuery(options: FetchOptions = {}): string {
  const params = new URLSearchParams();

  if (options.populate) {
    if (typeof options.populate === 'string') {
      params.set('populate', options.populate);
    } else if (Array.isArray(options.populate)) {
      options.populate.forEach((p, i) => params.set(`populate[${i}]`, p));
    } else {
      params.set('populate', JSON.stringify(options.populate));
    }
  }

  if (options.filters) {
    flattenObject(options.filters, 'filters', params);
  }

  if (options.sort) {
    if (typeof options.sort === 'string') {
      params.set('sort', options.sort);
    } else {
      options.sort.forEach((s, i) => params.set(`sort[${i}]`, s));
    }
  }

  if (options.pagination) {
    if (options.pagination.page) params.set('pagination[page]', String(options.pagination.page));
    if (options.pagination.pageSize) params.set('pagination[pageSize]', String(options.pagination.pageSize));
  }

  if (options.fields) {
    options.fields.forEach((f, i) => params.set(`fields[${i}]`, f));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

function flattenObject(obj: Record<string, unknown>, prefix: string, params: URLSearchParams) {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = `${prefix}[${key}]`;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flattenObject(value as Record<string, unknown>, fullKey, params);
    } else {
      params.set(fullKey, String(value));
    }
  }
}

async function fetchStrapi<T>(path: string, options: FetchOptions = {}, fetchOptions: RequestInit = {}): Promise<StrapiResponse<T>> {
  const query = buildQuery(options);
  const url = `${STRAPI_URL}/api${path}${query}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (STRAPI_API_TOKEN) {
    headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
  }

  const res = await fetch(url, {
    headers,
    next: { revalidate: 300 },
    ...fetchOptions,
  });

  if (!res.ok) {
    throw new Error(`Strapi API error: ${res.status} ${res.statusText} - ${url}`);
  }

  return res.json();
}

export async function getProducts(options: FetchOptions = {}) {
  return fetchStrapi<unknown[]>('/products', {
    populate: ['categories', 'media', 'pricePoints', 'featuredImage'],
    ...options,
  });
}

export async function getProduct(slug: string) {
  const res = await fetchStrapi<unknown[]>('/products', {
    filters: { slug: { $eq: slug } },
    populate: ['categories', 'affiliateLinks', 'media', 'pricePoints', 'seo', 'featuredImage', 'videos'],
  });

  return res.data?.[0] || null;
}

export async function lookupProduct(code: string) {
  const res = await fetch(`${STRAPI_URL}/api/products/lookup/${code}`, {
    headers: STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {},
    next: { revalidate: 60 },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data?.data || null;
}

export async function getTrendingProducts() {
  const res = await fetch(`${STRAPI_URL}/api/products/trending`, {
    headers: STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {},
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data?.data || [];
}

export async function getSettings() {
  const res = await fetchStrapi<Record<string, unknown>>('/setting', {
    populate: ['affiliatePatterns'],
  });
  return res.data || null;
}

export async function getCategories(options: FetchOptions = {}) {
  return fetchStrapi<unknown[]>('/categories', {
    populate: ['seo', 'iconImage'],
    filters: { isActive: { $eq: true } },
    sort: 'sortOrder:asc',
    ...options,
  });
}

export async function getCategory(slug: string) {
  const res = await fetchStrapi<unknown[]>('/categories', {
    filters: { slug: { $eq: slug } },
    populate: ['seo', 'iconImage'],
  });

  return res.data?.[0] || null;
}
