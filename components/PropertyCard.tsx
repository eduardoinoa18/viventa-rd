import Link from 'next/link'
import { useState, useEffect } from 'react';
import ImagePlaceholder from './ImagePlaceholder';
import { formatCurrency, formatFeatures, formatArea } from '@/lib/currency';
import { analytics } from '@/lib/analytics';
import { trackPropertyCardClick, getCurrentUserInfo } from '@/lib/analyticsService';

export default function PropertyCard({ property }: { property: any }) {
  const [imgError, setImgError] = useState(false);
  
  const propertyId = property.id || property.objectID || String(Math.random());
  const displayTitle = property.title || property.name || 'Propiedad';
  const displayPrice = property.price || property.price_usd || 0;
  const displayCurrency = (property.currency || 'USD') as 'USD' | 'DOP';
  const displayLocation = property.location?.city || property.city || property.location || '';
  const displayBedrooms = property.bedrooms || property.beds || 0;
  const displayBathrooms = property.bathrooms || property.baths || 0;
  const displayArea = property.area || property.sqft || 0;

  const handleClick = () => {
    analytics.viewProperty(propertyId, displayTitle);
    
    // Track property card click
    const { userId, userRole } = getCurrentUserInfo();
    trackPropertyCardClick(
      propertyId,
      undefined,
      'property_list',
      userId,
      userRole
    );
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
        {property.featured && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C35] text-white px-3 py-1 rounded-full text-xs font-bold">
            ⭐ Destacada
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="font-bold text-2xl text-viventa-coral mb-2">
          {formatCurrency(displayPrice, { currency: displayCurrency })}
        </div>
        <h3 className="font-semibold text-lg text-viventa-navy mb-2 line-clamp-2 min-h-[56px]">
          {displayTitle}
        </h3>
        <div className="text-sm text-gray-600 mb-3 flex items-center gap-1">
          <span>📍</span>
          <span className="line-clamp-1">
            {displayCity}{displayNeighborhood ? `, ${displayNeighborhood}` : ''}
          </span>
        </div>
        <div className="text-sm text-gray-700 mb-4 flex items-center gap-4">
          {displayBedrooms > 0 && (
            <span className="flex items-center gap-1">
              🛏️ {displayBedrooms}
            </span>
          )}
          {displayBathrooms > 0 && (
            <span className="flex items-center gap-1">
              🚿 {displayBathrooms}
            </span>
          )}
          {displayArea > 0 && (
            <span className="flex items-center gap-1">
              📐 {formatArea(displayArea)}
            </span>
          )}
        </div>
        <Link 
          href={`/listing/${propertyId}`} 
          onClick={handleClick}
          className="mt-auto w-full px-4 py-3 bg-gradient-to-r from-viventa-teal to-viventa-cyan text-white rounded-xl font-bold text-center hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
        >
          Ver detalles
        </Link>
      </div>
    </div>
  )
}
