import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/strapi';

/**
 * loading.tsx wraps the page, so notFound() inside the page is streamed
 * after a 200 shell. This layout sits outside that boundary and rejects
 * missing or unpublished products before any HTML is sent.
 */
export default async function ProductSegmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return children;
}
