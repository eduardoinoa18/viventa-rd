'use client'

import { useState, useMemo, useEffect } from 'react'
import PropertyCard from '@/components/PropertyCard'
import AdvancedFilters from '@/components/AdvancedFilters'
import type { Listing } from '@/types/listing'
import { FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { saveSearchCriteria } from '@/lib/buyerPreferences'
import { useSearchParams } from 'next/navigation'

interface SearchResultsProps {
  initialListings: Listing[]
  initialTotal: number
}

export default function SearchResults({ initialListings, initialTotal }: SearchResultsProps) {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [localFilters, setLocalFilters] = useState<any>({})

  useEffect(() => {
    const q = searchParams.get('q') || ''
    const type = searchParams.get('type') || undefined
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const bedrooms = searchParams.get('bedrooms')
    const bathrooms = searchParams.get('bathrooms')

    setSearchQuery(q)
    setLocalFilters({
      propertyType: type,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
    })
  }, [searchParams])

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

  function handleSaveSearch() {
    const activeFilters = {
      propertyType: localFilters.propertyType,
      minPrice: localFilters.minPrice,
      maxPrice: localFilters.maxPrice,
      bedrooms: localFilters.bedrooms,
      bathrooms: localFilters.bathrooms,
    }

    saveSearchCriteria({
      name: searchQuery?.trim() || 'Búsqueda personalizada',
      query: searchQuery,
      filters: activeFilters,
    })

    toast.success('Búsqueda guardada en tu panel')
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ubicación, tipo de propiedad..."
            className="w-full pl-11 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-sm sm:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters onApply={handleAdvancedFilters} />
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-gray-600 text-sm sm:text-base">
          {filteredListings.length} {filteredListings.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}
        </p>
        <button
          type="button"
          onClick={handleSaveSearch}
          className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-gray-300 hover:bg-gray-100 text-[#0B2545]"
        >
          Guardar búsqueda
        </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {filteredListings.map((listing) => (
            <PropertyCard key={listing.id} property={listing} />
          ))}
        </div>
      )}
    </>
  )
}
