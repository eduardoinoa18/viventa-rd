// Currency formatting utilities for Dominican market

export type Currency = 'DOP' | 'USD'

interface FormatOptions {
  currency?: Currency
  compact?: boolean
  decimals?: boolean
}

// Exchange rate (update via API in production)
const USD_TO_DOP = 58.5

export function formatCurrency(
  amount: number,
  options: FormatOptions = {}
): string {
  const { currency = 'USD', compact = false, decimals = false } = options
  
  const locale = currency === 'DOP' ? 'es-DO' : 'en-US'
  
  if (compact && amount >= 1000000) {
    const millions = amount / 1000000
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals ? 1 : 0,
      maximumFractionDigits: decimals ? 1 : 0,
    }).format(millions)
    return formatted + 'M'
  }
  
  if (compact && amount >= 1000) {
    const thousands = amount / 1000
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(thousands)
    return formatted + 'K'
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(amount)
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): number {
  if (from === to) return amount
  
  if (from === 'USD' && to === 'DOP') {
    return amount * USD_TO_DOP
  }
  
  if (from === 'DOP' && to === 'USD') {
    return amount / USD_TO_DOP
  }
  
  return amount
}

// Get user's preferred currency from localStorage
export function getUserCurrency(): Currency {
  if (typeof window === 'undefined') return 'USD'
  return (localStorage.getItem('preferredCurrency') as Currency) || 'USD'
}

// Set user's preferred currency
export function setUserCurrency(currency: Currency): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferredCurrency', currency)
  }
}

// Format property area
export function formatArea(sqm: number): string {
  return new Intl.NumberFormat('es-DO').format(sqm) + ' m²'
}

// Format property features (bedrooms, bathrooms)
export function formatFeatures(bedrooms?: number, bathrooms?: number): string {
  const parts: string[] = []
  
  if (bedrooms) {
    parts.push(`${bedrooms} ${bedrooms === 1 ? 'hab' : 'habs'}`)
  }
  
  if (bathrooms) {
    parts.push(`${bathrooms} ${bathrooms === 1 ? 'baño' : 'baños'}`)
  }
  
  return parts.join(' · ')
}
