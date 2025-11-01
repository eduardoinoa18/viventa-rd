import Link from 'next/link'
import { useState, useEffect } from 'react';
import ImagePlaceholder from './ImagePlaceholder';
import FavoriteButton from './FavoriteButton';
import { formatCurrency, formatFeatures, formatArea } from '@/lib/currency';
import { analytics } from '@/lib/analytics';

export default function PropertyCard({ property }: { property: any }) {
  const [imgError, setImgError] = useState(false);
  
  // Prepare property data for FavoriteButton - support both old and new field names
  const favoriteData = {
    id: property.id || property.objectID || String(Math.random()),
    title: property.title || property.name || 'Propiedad',
    price: property.price || property.price_usd || 0,
    currency: (property.currency || 'USD') as 'USD' | 'DOP',
    location: property.location?.city || property.city || property.location || '',
    bedrooms: property.bedrooms || property.beds || 0,
    bathrooms: property.bathrooms || property.baths || 0,
    area: property.area || property.sqft || 0,
    images: property.images?.length ? property.images : (property.image ? [property.image] : []),
    agentName: property.agentName || property.agent?.name,
    agentPhone: property.agentPhone || property.agent?.phone
  };

  const handleClick = () => {
    analytics.viewProperty(favoriteData.id, favoriteData.title);
  };

  const mainImage = property.images?.[0] || property.image || property.mainImage;
  const displayCity = property.location?.city || property.city || '';
  const displayNeighborhood = property.location?.neighborhood || property.neighborhood || '';

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col relative group">
      <div className="aspect-w-4 aspect-h-3 rounded-t-2xl overflow-hidden relative h-64">
        {imgError || !mainImage ? (
          <ImagePlaceholder className="object-cover w-full h-full" />
        ) : (
          <img
            src={mainImage}
            alt={property.title || 'Propiedad'}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        )}
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton property={favoriteData} />
        </div>
        {property.featured && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C35] text-white px-3 py-1 rounded-full text-xs font-bold">
            ⭐ Destacada
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="font-bold text-2xl text-viventa-coral mb-2">
          {formatCurrency(favoriteData.price, { currency: favoriteData.currency })}
        </div>
        <h3 className="font-semibold text-lg text-viventa-navy mb-2 line-clamp-2 min-h-[56px]">
          {property.title || 'Propiedad'}
        </h3>
        <div className="text-sm text-gray-600 mb-3 flex items-center gap-1">
          <span>📍</span>
          <span className="line-clamp-1">
            {displayCity}{displayNeighborhood ? `, ${displayNeighborhood}` : ''}
          </span>
        </div>
        <div className="text-sm text-gray-700 mb-4 flex items-center gap-4">
          {favoriteData.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              🛏️ {favoriteData.bedrooms}
            </span>
          )}
          {favoriteData.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              🚿 {favoriteData.bathrooms}
            </span>
          )}
          {favoriteData.area > 0 && (
            <span className="flex items-center gap-1">
              📐 {formatArea(favoriteData.area)}
            </span>
          )}
        </div>
        <Link 
          href={`/listing/${favoriteData.id}`} 
          onClick={handleClick}
          className="mt-auto w-full px-4 py-3 bg-gradient-to-r from-viventa-teal to-viventa-cyan text-white rounded-xl font-bold text-center hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
        >
          Ver detalles
        </Link>
      </div>
    </div>
  )
}
