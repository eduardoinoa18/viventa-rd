"use client"
import { useState } from 'react'
import ImagePlaceholder from './ImagePlaceholder'
import { convertCurrency, formatCurrency, type Currency } from '@/lib/currency'
import useCurrency from '@/hooks/useCurrency'

export default function ListingDetail({ listing }: { listing: any }) {
  const [imgError, setImgError] = useState(false)
  const preferredCurrency = useCurrency()
  if (!listing) return null
  const img = listing.images?.[0]
  const currency = (listing.currency || 'USD') as Currency
  const price = listing.price || 0
  const priceUsd = currency === 'USD' ? price : convertCurrency(price, 'DOP', 'USD')
  const priceDop = currency === 'DOP' ? price : convertCurrency(price, 'USD', 'DOP')
  const primaryCurrency: Currency = preferredCurrency
  const secondaryCurrency: Currency = preferredCurrency === 'USD' ? 'DOP' : 'USD'
  const primaryPrice = primaryCurrency === 'USD' ? priceUsd : priceDop
  const secondaryPrice = secondaryCurrency === 'USD' ? priceUsd : priceDop
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="h-72 bg-gray-100 rounded overflow-hidden">
        {!img || imgError ? (
          <ImagePlaceholder className="w-full h-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold">{listing.title}</h2>
        <div className="mt-2">
          <div className="text-green-700 font-semibold">
            {formatCurrency(primaryPrice, { currency: primaryCurrency })}
          </div>
          <div className="text-xs text-gray-500">
            {formatCurrency(secondaryPrice, { currency: secondaryCurrency })}
          </div>
        </div>
        <p className="mt-3 text-gray-700">{listing.description || listing.publicRemarks || '—'}</p>
      </div>
    </div>
  )
}
