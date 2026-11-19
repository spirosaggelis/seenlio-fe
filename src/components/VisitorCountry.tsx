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
        // Leave the country unknown. Prices still show in the currency we stored.
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
