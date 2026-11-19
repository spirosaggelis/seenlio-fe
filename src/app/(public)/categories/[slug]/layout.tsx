import { notFound } from 'next/navigation';
import { getCategory } from '@/lib/strapi';

/** Outside loading.tsx so a missing category is a real 404, not a 200 shell. */
export default async function CategorySegmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  return children;
}
