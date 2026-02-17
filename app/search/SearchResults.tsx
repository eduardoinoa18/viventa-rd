'use client'

import { useState, useMemo } from 'react'
import PropertyCard from '@/components/PropertyCard'
import AdvancedFilters from '@/components/AdvancedFilters'
import type { Listing } from '@/types/listing'
import { FiSearch } from 'react-icons/fi'

interface SearchResultsProps {
  initialListings: Listing[]
  initialTotal: number
}

export default function SearchResults({ initialListings, initialTotal }: SearchResultsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [localFilters, setLocalFilters] = useState<any>({})

  // Client-side filtering for instant results
  const filteredListings = useMemo(() => {
    let filtered = initialListings

    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((listing) =>
        (listing.title?.toLowerCase() || '').includes(query) ||
        (listing.description?.toLowerCase() || '').includes(query) ||
        (listing.city?.toLowerCase() || '').includes(query) ||
        (listing.sector?.toLowerCase() || '').includes(query)
      )
    }

    // Local filters (applied client-side for instant feedback)
    if (localFilters.propertyType) {
      filtered = filtered.filter((l) => l.propertyType === localFilters.propertyType)
    }

    if (localFilters.minPrice) {
      filtered = filtered.filter((l) => (l.price || 0) >= localFilters.minPrice)
    }

    if (localFilters.maxPrice) {
      filtered = filtered.filter((l) => (l.price || 0) <= localFilters.maxPrice)
    }

    if (localFilters.bedrooms) {
      filtered = filtered.filter((l) => (l.bedrooms || 0) >= localFilters.bedrooms)
    }

    if (localFilters.bathrooms) {
      filtered = filtered.filter((l) => (l.bathrooms || 0) >= localFilters.bathrooms)
    }

    return filtered
  }, [initialListings, searchQuery, localFilters])

  function handleAdvancedFilters(appliedFilters: any) {
    setLocalFilters({
      propertyType: appliedFilters.propertyType || undefined,
      minPrice: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined,
      maxPrice: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined,
      bedrooms: appliedFilters.bedrooms ? Number(appliedFilters.bedrooms) : undefined,
      bathrooms: appliedFilters.bathrooms ? Number(appliedFilters.bathrooms) : undefined,
    })
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ubicación, tipo de propiedad..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters onApply={handleAdvancedFilters} />
      </div>

      {/* Results Count */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">
          {filteredListings.length} {filteredListings.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}
        </p>
      </div>

      {/* Results Grid */}
      {filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No se encontraron propiedades</p>
          <p className="text-gray-400 text-sm mt-2">
            Intenta ajustar tus filtros de búsqueda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <PropertyCard key={listing.id} property={listing} />
          ))}
        </div>
      )}
    </>
  )
}
