'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import OptimizedImage from '@/components/OptimizedImage'
import { FiArrowRight, FiMapPin, FiHome, FiDroplet } from 'react-icons/fi'

export type RelatedProperty = {
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
  listingType: string
}

type RelatedPropertiesWidgetProps = {
  currentPropertyId: string
  city: string
  propertyType?: string
  price?: number
  limit?: number
}

export default function RelatedPropertiesWidget({
  currentPropertyId,
  city,
  propertyType,
  price,
  limit = 4,
}: RelatedPropertiesWidgetProps) {
  const [properties, setProperties] = useState<RelatedProperty[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRelatedProperties = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          city,
          exclude: currentPropertyId,
          limit: String(limit),
          ...(propertyType && { propertyType }),
          ...(price && { priceRange: Math.round(price * 0.8) + '-' + Math.round(price * 1.2) }),
        })

        const res = await fetch(`/api/properties/related?${params}`)
        if (!res.ok) throw new Error('Failed to load related properties')
        const data = await res.json()
        setProperties(data.data || [])
      } catch (error) {
        console.error('Error loading related properties:', error)
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    loadRelatedProperties()
  }, [currentPropertyId, city, propertyType, price, limit])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4 p-4 bg-gray-100 rounded-lg animate-pulse">
            <div className="w-24 h-24 bg-gray-300 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No hay propiedades similares disponibles en este momento</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Propiedades Similares</h3>
      <div className="grid grid-cols-1 gap-4">
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/listing/${property.id}`}
            className="group flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-[#FF6B35] hover:shadow-lg transition-all duration-200"
          >
            {/* Image */}
            <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
              <OptimizedImage
                src={property.image}
                alt={property.title}
                width={96}
                height={96}
                className="object-cover group-hover:scale-110 transition-transform duration-300 w-full h-full"
              />
              {property.listingType && (
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {property.listingType === 'rent' ? 'Se alquila' : 'Se vende'}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 line-clamp-2 group-hover:text-[#FF6B35] transition-colors">
                {property.title}
              </h4>

              {/* Price */}
              <p className="text-lg font-bold text-[#00A676] mt-1">
                {property.currency === 'USD' ? '$' : 'RD$'}
                {property.price.toLocaleString()}
              </p>

              {/* Location */}
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <FiMapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {property.sector}, {property.city}
                </span>
              </div>

              {/* Features */}
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                {property.bedrooms > 0 && (
                  <div className="flex items-center gap-1">
                    <FiHome className="w-4 h-4" />
                    <span>{property.bedrooms}</span>
                  </div>
                )}
                {property.bathrooms > 0 && (
                  <div className="flex items-center gap-1">
                    <FiDroplet className="w-4 h-4" />
                    <span>{property.bathrooms}</span>
                  </div>
                )}
                {property.area > 0 && <span>{property.area.toLocaleString()} m²</span>}
              </div>
            </div>

            {/* Arrow indicator */}
            <div className="flex items-center justify-center w-6">
              <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#FF6B35] transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {properties.length > 0 && (
        <Link
          href={`/search?city=${encodeURIComponent(city)}${propertyType ? `&type=${propertyType}` : ''}`}
          className="block text-center py-3 px-4 border border-[#FF6B35] text-[#FF6B35] rounded-lg hover:bg-[#FF6B35] hover:text-white transition-colors font-semibold"
        >
          Ver más propiedades en {city}
        </Link>
      )}
    </div>
  )
}
