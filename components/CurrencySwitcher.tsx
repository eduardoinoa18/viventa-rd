'use client'
import { useState, useEffect } from 'react'
import { getUserCurrency, setUserCurrency, type Currency } from '@/lib/currency'

export default function CurrencySwitcher() {
  const [currency, setCurrency] = useState<Currency>('USD')

  useEffect(() => {
    setCurrency(getUserCurrency())
  }, [])

  function handleCurrencyChange(newCurrency: Currency) {
    setCurrency(newCurrency)
    setUserCurrency(newCurrency)
    // Trigger re-render of price displays
    window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency: newCurrency } }))
  }

  return (
    <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
      <button
        onClick={() => handleCurrencyChange('USD')}
        className={`px-3 py-1 text-sm font-medium transition-colors ${
          currency === 'USD'
            ? 'bg-[#0B2545] text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        USD
      </button>
      <button
        onClick={() => handleCurrencyChange('DOP')}
        className={`px-3 py-1 text-sm font-medium transition-colors ${
          currency === 'DOP'
            ? 'bg-[#0B2545] text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        DOP
      </button>
    </div>
  )
}
