'use client'

import Link from 'next/link'
import { FiMapPin, FiHeart, FiShare2 } from 'react-icons/fi'
import OptimizedImage from '@/components/OptimizedImage'
import AddToComparisonButton from '@/components/AddToComparisonButton'
import VerificationBadge from '@/components/VerificationBadge'

export type EnhancedPropertyCardProps = {
  id: string
  title: string
  price: number
  currency: string
  bedrooms: number
  bathrooms: number
  area: number
  city: string
  sector: string
  image: string
  listingType: 'rent' | 'sell'
  propertyType?: string
  maintenanceFee?: number
  isFeatured?: boolean
  agentName?: string
  agentRating?: number
  agentVerified?: boolean
  qualityScore?: number
  onFavorite?: (id: string) => void
  isFavorited?: boolean
}

export default function EnhancedPropertyCard({
  id,
  title,
  price,
  currency,
  bedrooms,
  bathrooms,
  area,
  city,
  sector,
  image,
  listingType,
  propertyType,
  maintenanceFee,
  isFeatured,
  agentName,
  agentRating,
  agentVerified,
  qualityScore,
  onFavorite,
  isFavorited = false,
}: EnhancedPropertyCardProps) {
  const pricePerM2 = area > 0 ? Math.round(price / area) : 0
  const isRent = listingType === 'rent'

  return (
    <div className="group bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-[#FF6B35] hover:shadow-lg transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        <OptimizedImage
          src={image}
          alt={title}
          width={400}
          height={225}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isFeatured && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
              ⭐ Destacado
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-black/70 text-white text-xs font-semibold rounded-full">
            {isRent ? 'Se alquila' : 'Se vende'}
          </span>
          {qualityScore && qualityScore >= 75 && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
              ✓ Calidad {qualityScore}%
            </span>
          )}
        </div>

        {/* Action Buttons - Top Right */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onFavorite?.(id)}
            className={`flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-sm transition-all active:scale-95 ${
              isFavorited
                ? 'bg-[#FF6B35] text-white'
                : 'bg-white/80 text-gray-900 hover:bg-white'
            }`}
            title={isFavorited ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <FiHeart className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 text-gray-900 hover:bg-white transition-all backdrop-blur-sm active:scale-95"
            title="Compartir"
          >
            <FiShare2 className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Info Overlay - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 translate-y-0 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-white text-sm font-semibold">
            {currency === 'USD' ? '$' : 'RD$'}
            {pricePerM2.toLocaleString()} por m²
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title & Key Info */}
        <div>
          <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-[#FF6B35] transition-colors">
            <Link href={`/listing/${id}`}>{title}</Link>
          </h3>
          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
            <FiMapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {sector}, {city}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-[#00A676]">
            {currency === 'USD' ? '$' : 'RD$'}
            {price.toLocaleString()}
          </span>
          {isRent && <span className="text-sm text-gray-600">/mes</span>}
        </div>

        {/* Features */}
        <div className="flex items-center gap-4 text-sm text-gray-600 py-2 border-y border-gray-200">
          {bedrooms > 0 && (
            <div className="flex items-center gap-1">
              <span className="font-semibold">{bedrooms}</span>
              <span>hab.</span>
            </div>
          )}
          {bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <span className="font-semibold">{bathrooms}</span>
              <span>baños</span>
            </div>
          )}
          {area > 0 && (
            <div className="flex items-center gap-1">
              <span className="font-semibold">{area.toLocaleString()}</span>
              <span>m²</span>
            </div>
          )}
        </div>

        {/* Agent Info */}
        {agentName && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              <p className="font-medium text-gray-900">{agentName}</p>
              {agentRating && (
                <p className="text-yellow-600">
                  {'⭐'.repeat(Math.round(agentRating))} {agentRating.toFixed(1)}
                </p>
              )}
            </div>
            {agentVerified && <div className="text-2xl">✓</div>}
          </div>
        )}

        {/* Maintenance Fee */}
        {maintenanceFee && maintenanceFee > 0 && (
          <p className="text-xs text-gray-600">
            <span className="font-semibold">Manutención:</span> {currency === 'USD' ? '$' : 'RD$'}
            {maintenanceFee.toLocaleString()}/mes
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Link
            href={`/listing/${id}`}
            className="flex-1 text-center bg-[#FF6B35] text-white py-2.5 rounded-lg hover:bg-[#e55a24] transition-colors font-semibold text-sm"
          >
            Ver Detalles
          </Link>
          <AddToComparisonButton propertyId={id} size="md" />
        </div>
      </div>
    </div>
  )
}
