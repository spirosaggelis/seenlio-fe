import type { Metadata } from 'next';
import NotFoundPage from '@/app/not-found';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function ProductNotFound() {
  return <NotFoundPage />;
}
