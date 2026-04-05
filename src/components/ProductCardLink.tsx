'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { trackProductClick } from '@/lib/analytics';

interface ProductCardLinkProps {
  href: string;
  productCode: string;
  className: string;
  children: React.ReactNode;
}

export default function ProductCardLink({ href, productCode, className, children }: ProductCardLinkProps) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      onClick={() => trackProductClick(productCode, pathname)}
      className={className}
    >
      {children}
    </Link>
  );
}
