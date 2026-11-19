import PriceDisplay from './PriceDisplay';
import { CURRENCY_SYMBOL } from '@/lib/amazonRouting';

interface RegionalPriceProps {
  price?: number | null;
  originalPrice?: number | null;
  currency?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function RegionalPrice({
  price,
  originalPrice,
  currency,
  size = 'md',
}: RegionalPriceProps) {
  if (price == null) return null;

  const stored = (currency || 'USD').toUpperCase();
  const symbol = CURRENCY_SYMBOL[stored] || `${stored} `;

  return (
    <PriceDisplay
      price={price}
      originalPrice={originalPrice ?? undefined}
      currency={symbol}
      size={size}
    />
  );
}
