"use client"
import { useState } from 'react'
import ImagePlaceholder from './ImagePlaceholder'

export default function ListingDetail({ listing }: { listing: any }) {
  if (!listing) return null
  const [imgError, setImgError] = useState(false)
  const img = listing.images?.[0]
  const currency = listing.currency || 'USD'
  const price = listing.price
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
        <div className="mt-2 text-green-700 font-semibold">
          {currency} {price}
        </div>
        <p className="mt-3 text-gray-700">{listing.description || listing.publicRemarks || '—'}</p>
      </div>
    </div>
  )
}
