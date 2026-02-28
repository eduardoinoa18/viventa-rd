'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react';
import ImagePlaceholder from './ImagePlaceholder';
import { formatCurrency, formatFeatures, formatArea, convertCurrency, type Currency } from '@/lib/currency';
import useCurrency from '@/hooks/useCurrency';
import { analytics } from '@/lib/analytics';
import { trackPropertyCardClick, getCurrentUserInfo } from '@/lib/analyticsService';
import { FiCheckCircle, FiHeart } from 'react-icons/fi';
import { isPropertySaved, toggleSavedProperty } from '@/lib/buyerPreferences';

export default function PropertyCard({ property }: { property: any }) {
  const [imgError, setImgError] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const rawListingId = property.listingId || property.id || property.objectID;
  const listingId = rawListingId ? String(rawListingId) : '';
  const listingHref = listingId ? `/listing/${encodeURIComponent(listingId)}` : '/search';
  const displayTitle = property.title || property.name || 'Propiedad';
  const displayPrice = property.price || property.price_usd || 0;
  const displayCurrency = (property.currency || 'USD') as 'USD' | 'DOP';
  const preferredCurrency = useCurrency();
  const displayLocation = property.city || '';
  const displayBedrooms = property.bedrooms || property.beds || 0;
  const displayBathrooms = property.bathrooms || property.baths || 0;
  const displayArea = property.area || property.sqft || 0;

  // Verification status (placeholder logic - will be replaced with real data)
  const isVerified = property.propertyVerificationStatus === 'verified' || property.verified === true;
  const isFeatured = property.featured || property.featured_until && new Date(property.featured_until) > new Date();

  useEffect(() => {
    if (!listingId) return;
    setSaved(isPropertySaved(listingId));
  }, [listingId]);

  const handleClick = () => {
    if (!listingId) return;
    analytics.viewProperty(listingId, displayTitle);
    
    // Track property card click
    const { userId, userRole } = getCurrentUserInfo();
    trackPropertyCardClick(
      listingId,
      undefined,
      'property_list',
      userId,
      userRole
    );
  };

  const mainImage = property.coverImage || property.images?.[0] || property.image || property.mainImage;
  const displayCity = property.city || '';
  const displayNeighborhood = property.sector || '';
  const priceUsd = displayCurrency === 'USD' ? displayPrice : convertCurrency(displayPrice, 'DOP', 'USD');
  const priceDop = displayCurrency === 'DOP' ? displayPrice : convertCurrency(displayPrice, 'USD', 'DOP');
  const primaryCurrency: Currency = preferredCurrency;
  const secondaryCurrency: Currency = preferredCurrency === 'USD' ? 'DOP' : 'USD';
  const primaryPrice = primaryCurrency === 'USD' ? priceUsd : priceDop;
  const secondaryPrice = secondaryCurrency === 'USD' ? priceUsd : priceDop;

  const handleToggleSaved = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!listingId) return;
    const result = toggleSavedProperty(listingId);
    setSaved(result.saved);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col relative group border border-gray-100">
      {/* Image Container with Badges */}
      <div className="rounded-t-xl overflow-hidden relative h-44 sm:h-52">
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

        <button
          type="button"
          onClick={handleToggleSaved}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/95 text-[#0B2545] shadow flex items-center justify-center"
          aria-label={saved ? 'Quitar de guardados' : 'Guardar propiedad'}
        >
          <FiHeart className={`${saved ? 'fill-[#FF6B35] text-[#FF6B35]' : 'text-[#0B2545]'}`} />
        </button>

        {/* Verified Badge (Top-Left) */}
        {isVerified && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg">
            <FiCheckCircle className="text-sm" />
            <span>VERIFICADA</span>
          </div>
        )}

        {/* Featured Badge (Top-Right if verified, or Top-Left if not) */}
        {isFeatured && (
          <div className={`absolute top-3 ${isVerified ? 'right-3' : 'left-3'} bg-gradient-to-r from-[#FF6B35] to-[#FF8C35] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg`}>
            ⭐ DESTACADA
          </div>
        )}

        {/* Hover Overlay with Quick WhatsApp CTA */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-end justify-center p-4 hidden md:flex">
          <a
            href={`https://wa.me/18095551234?text=Me interesa esta propiedad: ${displayTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      </div>

      {/* Property Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        {/* Price */}
        <div className="mb-1.5">
          <div className="font-bold text-lg sm:text-xl text-[#FF6B35] leading-tight">
            {formatCurrency(primaryPrice, { currency: primaryCurrency })}
          </div>
          <div className="text-xs text-gray-500">
            {formatCurrency(secondaryPrice, { currency: secondaryCurrency })}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base sm:text-lg text-[#0B2545] mb-1.5 line-clamp-2 min-h-[44px]">
          {displayTitle}
        </h3>

        {/* Location */}
        <div className="text-xs sm:text-sm text-gray-600 mb-2.5 flex items-center gap-1">
          <span>📍</span>
          <span className="line-clamp-1">
            {displayCity}{displayNeighborhood ? `, ${displayNeighborhood}` : ''}
          </span>
        </div>

        {/* Property Features (Beds, Baths, Area) */}
        <div className="text-xs sm:text-sm text-gray-700 mb-3 flex items-center gap-3 flex-wrap">
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

        {/* CTA Button */}
        <Link 
          href={listingHref}
          onClick={handleClick}
          className="mt-auto w-full px-4 py-3 bg-gradient-to-r from-[#00A6A6] to-[#00C8C8] text-white rounded-xl font-bold text-center hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
        >
          Ver detalles
        </Link>
      </div>
    </div>
  )
}
