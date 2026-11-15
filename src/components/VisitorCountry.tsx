'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const VisitorCountryContext = createContext('');

export function VisitorCountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountry] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/visitor-country')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.country) setCountry(String(data.country));
      })
      .catch(() => {
        // Leave the country unknown so we show "See price" instead of the wrong currency.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <VisitorCountryContext.Provider value={country}>
      {children}
    </VisitorCountryContext.Provider>
  );
}

export function useVisitorCountry(): string {
  return useContext(VisitorCountryContext);
}
