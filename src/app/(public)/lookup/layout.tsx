import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Product Lookup',
  description:
    'Search for any product by name or code on Seenlio.',
  alternates: { canonical: '/lookup' },
  openGraph: {
    title: 'Product Lookup',
    description: 'Search for any product by name or code on Seenlio.',
    url: '/lookup',
  },
};

export default function LookupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
