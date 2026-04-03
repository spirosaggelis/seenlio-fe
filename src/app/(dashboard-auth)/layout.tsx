import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Login — Seenlio', template: '%s | Seenlio' },
  robots: { index: false, follow: false },
};

export default function DashboardAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
