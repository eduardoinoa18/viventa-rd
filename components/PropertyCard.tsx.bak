import Link from 'next/link'
import { useState } from 'react';
import ImagePlaceholder from './ImagePlaceholder';

export default function PropertyCard({ property }: { property: any }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-2 flex flex-col">
      <div className="aspect-w-4 aspect-h-3 rounded overflow-hidden mb-2">
        {imgError || !property.image ? (
          <ImagePlaceholder className="object-cover w-full h-full" />
        ) : (
          <img
            src={property.image || '/default-property.jpg'}
            alt={property.title}
            className="object-cover w-full h-full"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="font-bold text-lg text-[#0B2545]">${property.price_usd?.toLocaleString?.() || property.price_usd || '—'} USD</div>
      <div className="text-sm text-gray-700">{property.city}, {property.neighborhood}</div>
      <div className="text-xs text-gray-500 mb-2">{property.beds} hab • {property.baths} baños • {property.sqft} m²</div>
      <Link href={`/properties/${property.id}`} className="mt-auto text-[#3BAFDA] font-semibold hover:underline">Más detalles</Link>
    </div>
  )
}
