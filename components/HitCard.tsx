"use client"
import Link from 'next/link'

type Hit = {
  objectID: string
  title?: string
  price?: number
  price_usd?: number
  city?: string
  neighborhood?: string
  images?: string[]
  main_photo_url?: string
}

export default function HitCard({ hit }: { hit: Hit }) {
  const img = hit.main_photo_url || (hit.images && hit.images[0]) || ''
  const price = hit.price_usd ?? hit.price
  return (
    <Link href={`/listing/${hit.objectID}`} className="block border rounded-lg overflow-hidden hover:shadow-md transition bg-white">
      <div className="h-40 bg-gray-100">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={hit.title || 'Listing'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-base font-semibold line-clamp-1">{hit.title || 'Listing'}</h3>
        <p className="text-sm text-gray-600 line-clamp-1">{[hit.city, hit.neighborhood].filter(Boolean).join(', ')}</p>
        {price != null && (
          <p className="mt-1 text-green-700 font-semibold">${price}</p>
        )}
      </div>
    </Link>
  )
}
