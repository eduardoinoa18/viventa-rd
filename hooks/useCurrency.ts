'use client';

import { useEffect, useState } from 'react';
import { getUserCurrency, type Currency } from '@/lib/currency';

export default function useCurrency() {
  const [currency, setCurrency] = useState<Currency>('USD');

  useEffect(() => {
    setCurrency(getUserCurrency());
    const onCurrency = (event: Event) => {
      const detail = (event as CustomEvent).detail as { currency?: Currency } | undefined;
      if (detail?.currency) setCurrency(detail.currency);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('currencyChanged', onCurrency as EventListener);
      return () => window.removeEventListener('currencyChanged', onCurrency as EventListener);
    }
  }, []);

  return currency;
}
