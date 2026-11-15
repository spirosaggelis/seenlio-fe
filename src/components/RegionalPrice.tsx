'use client';

import PriceDisplay from './PriceDisplay';
import { useVisitorCountry } from './VisitorCountry';
import { CURRENCY_SYMBOL, currencyForCountry } from '@/lib/amazonRouting';

interface RegionalPriceProps {
  price?: number | null;
  originalPrice?: number | null;
  currency?: string | null;
  /** Set from the request on product and round-up pages so the first HTML is already regional. */
  country?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function RegionalPrice({
  price,
  originalPrice,
  currency,
  country: countryProp,
  size = 'md',
}: RegionalPriceProps) {
  const detected = useVisitorCountry();
  const country = countryProp || detected;
  if (price == null) return null;

  const stored = (currency || 'USD').toUpperCase();
  const symbol = CURRENCY_SYMBOL[stored];
  if (!symbol) {
    return <span className='text-sm font-semibold text-gray-300'>See price</span>;
  }

  // Until we know the visitor, show the stored amount. Agents that do not run
  // JavaScript still see a price, and the figure is replaced once geo returns.
  if (country && stored !== currencyForCountry(country)) {
    return <span className='text-sm font-semibold text-gray-300'>See price</span>;
  }

  return (
    <PriceDisplay
      price={price}
      originalPrice={originalPrice ?? undefined}
      currency={symbol}
      size={size}
    />
  );
}
