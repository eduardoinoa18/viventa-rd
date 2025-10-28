import Link from 'next/link'
import { useState, useEffect } from 'react';
import ImagePlaceholder from './ImagePlaceholder';
import FavoriteButton from './FavoriteButton';
import { formatCurrency, formatFeatures, formatArea } from '@/lib/currency';
import { analytics } from '@/lib/analytics';

export default function PropertyCard({ property }: { property: any }) {
  const [imgError, setImgError] = useState(false);
  
  // Prepare property data for FavoriteButton
  const favoriteData = {
    id: property.id || property.objectID || String(Math.random()),
    title: property.title || property.name || 'Propiedad',
    price: property.price_usd || 0,
    currency: 'USD' as const,
    location: property.city || property.location || '',
    bedrooms: property.beds,
    bathrooms: property.baths,
    area: property.sqft,
    images: property.image ? [property.image] : [],
    agentName: property.agent?.name,
    agentPhone: property.agent?.phone
  };

  const handleClick = () => {
    analytics.viewProperty(favoriteData.id, favoriteData.title);
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-2 flex flex-col relative">
      <div className="aspect-w-4 aspect-h-3 rounded overflow-hidden mb-2 relative">
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
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton property={favoriteData} />
        </div>
      </div>
      <div className="font-bold text-lg text-[#0B2545]">
        {formatCurrency(property.price_usd || 0, { currency: 'USD' })}
      </div>
      <div className="text-sm text-gray-700">{property.city}, {property.neighborhood}</div>
      <div className="text-xs text-gray-500 mb-2">
        {formatFeatures(property.beds, property.baths)}
        {property.sqft && ` • ${formatArea(property.sqft)}`}
      </div>
      <Link 
        href={`/properties/${favoriteData.id}`} 
        onClick={handleClick}
        className="mt-auto text-[#3BAFDA] font-semibold hover:underline"
      >
        Más detalles
      </Link>
    </div>
  )
}
