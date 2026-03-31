import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://viralproducts.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/trending`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/lookup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    // Fetch products
    const productsRes = await fetch(
      `${strapiUrl}/api/products?fields[0]=slug&fields[1]=updatedAt&pagination[pageSize]=1000&filters[status][$eq]=published`,
      { next: { revalidate: 3600 } }
    );
    if (productsRes.ok) {
      const productsData = await productsRes.json();
      for (const product of productsData.data || []) {
        entries.push({
          url: `${SITE_URL}/products/${product.slug}`,
          lastModified: new Date(product.updatedAt),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }

    // Fetch categories
    const categoriesRes = await fetch(
      `${strapiUrl}/api/categories?fields[0]=slug&fields[1]=updatedAt&filters[isActive][$eq]=true`,
      { next: { revalidate: 3600 } }
    );
    if (categoriesRes.ok) {
      const categoriesData = await categoriesRes.json();
      for (const category of categoriesData.data || []) {
        entries.push({
          url: `${SITE_URL}/categories/${category.slug}`,
          lastModified: new Date(category.updatedAt),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  } catch {
    // Strapi may not be available
  }

  return entries;
}
