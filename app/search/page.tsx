'use client'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import BottomNav from '../../components/BottomNav'
import PropertyCard from '../../components/PropertyCard'
// SearchStatsBar removed per request to simplify the page
import AdvancedFilters from '../../components/AdvancedFilters'
import SavedSearchModal from '../../components/SavedSearchModal'
import { FiSave, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { auth, db } from '../../lib/firebaseClient'
import { collection, getDocs } from 'firebase/firestore'
import { getUserCurrency, type Currency } from '../../lib/currency'
import { searchListings, type SearchFilters } from '../../lib/customSearchService'
import type { Listing } from '@/types/listing'
import { usePageViewTracking } from '../../hooks/useAnalytics'
import { trackSearch } from '../../lib/analyticsService'

// Map view removed per request

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Track page view
  usePageViewTracking()
  
  // UI state
  const [showSave, setShowSave] = useState(false)
  const [saved, setSaved] = useState<any[]>([])
  // Map view disabled; keep list-only
  // Simple filters removed; only SearchBar and AdvancedFilters remain
  const [currency, setCurrency] = useState<Currency>('USD')
  
  // Search state
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Listing[]>([])
  const [totalHits, setTotalHits] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 20
  
  // Facets no longer needed here (AdvancedFilters handles its own options)
  
  // Search filters
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams?.get('q') || '',
    city: searchParams?.get('city') || undefined,
    neighborhood: searchParams?.get('neighborhood') || undefined,
    propertyType: (searchParams?.get('type') as SearchFilters['propertyType']) || undefined,
    listingType: (searchParams?.get('listingType') as 'sale' | 'rent') || undefined,
    minPrice: searchParams?.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams?.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    bedrooms: searchParams?.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
    bathrooms: searchParams?.get('bathrooms') ? Number(searchParams.get('bathrooms')) : undefined,
  })

  // Facets cache removed

  // Load saved searches and facets
  useEffect(() => {
    loadSaved()
    setCurrency(getUserCurrency())
  }, [])

  // Debounced search when filters change
  useEffect(() => {
    // Debounce text search by 300ms
    const debounceTimer = setTimeout(() => {
      performSearch()
    }, filters.query ? 300 : 0) // Only debounce if there's text search

    return () => clearTimeout(debounceTimer)
  }, [filters, currentPage])

  async function loadSaved() {
    const u = auth?.currentUser
    if (!u) return
    const snap = await getDocs(collection(db, 'users', u.uid, 'saved_searches'))
    setSaved(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })))
  }

  // Facet loading removed

  async function performSearch() {
    setLoading(true)
    try {
      const response = await searchListings(filters, currentPage, pageSize)
      
      setResults(response.results.map((r) => r.listing))
      setTotalHits(response.totalHits)
      setTotalPages(response.totalPages)
      
      // Track search event
      const user = auth?.currentUser
      trackSearch(
        filters.query || '*',
        {
          city: filters.city,
          neighborhood: filters.neighborhood,
          propertyType: filters.propertyType,
          listingType: filters.listingType,
          priceRange: filters.minPrice || filters.maxPrice ? `${filters.minPrice || 0}-${filters.maxPrice || 'any'}` : undefined,
          bedrooms: filters.bedrooms,
          bathrooms: filters.bathrooms,
          resultsCount: response.totalHits
        },
        user?.uid,
        undefined // userRole not easily accessible here
      )
    } catch (error) {
      console.error('[CustomSearch] Error:', error)
      setResults([])
      setTotalHits(0)
      setTotalPages(1)
    }
    setLoading(false)
  }

  function updateFilters(updates: Partial<SearchFilters>) {
    setFilters({ ...filters, ...updates })
    setCurrentPage(1) // Reset to page 1 on filter change
  }

  function handleAdvancedFilters(appliedFilters: any) {
    updateFilters({
      propertyType: appliedFilters.propertyType || undefined,
      minPrice: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined,
      maxPrice: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined,
      bedrooms: appliedFilters.bedrooms ? Number(appliedFilters.bedrooms) : undefined,
      bathrooms: appliedFilters.bathrooms ? Number(appliedFilters.bathrooms) : undefined,
      city: appliedFilters.city || undefined,
    })
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#0B2545] mb-2">Buscar propiedades</h1>
            <p className="text-gray-600">Encuentra tu propiedad ideal en República Dominicana</p>
          </div>

          {/* Advanced Filters Button - Positioned higher on mobile */}
          <div className="mb-8 flex items-center gap-4">
            <AdvancedFilters 
              onApply={handleAdvancedFilters}
              initialFilters={{
                propertyType: filters.propertyType,
                minPrice: filters.minPrice?.toString(),
                maxPrice: filters.maxPrice?.toString(),
                bedrooms: filters.bedrooms?.toString(),
                bathrooms: filters.bathrooms?.toString(),
                city: filters.city,
              }}
            />
            <div className="hidden md:block text-sm text-gray-600">
              Usa filtros avanzados para una búsqueda más específica
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-teal-50 border border-teal-200 text-teal-800 rounded-lg p-4 mb-6">
              <div className="font-semibold flex items-center gap-2">
                <FiSearch /> Búsqueda personalizada con filtros avanzados
              </div>
              <div className="text-sm mt-1">Sistema de búsqueda integrado con geo-localización y filtros inteligentes.</div>
            </div>

            {/* Simple filters removed; no mobile toggle */}

            <div className="space-y-6">
              {/* Main content */}
              <div className={`space-y-4 min-w-0`}>
                {/* Search bar */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por título, ubicación, descripción..."
                      value={filters.query || ''}
                      onChange={(e) => updateFilters({ query: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Stats removed per request */}

                {/* Results */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {totalHits} propiedades encontradas
                      {currentPage > 1 && ` (página ${currentPage} de ${totalPages})`}
                    </div>
                    {saved.length > 0 && (
                      <button
                        onClick={() => setShowSave(true)}
                        className="text-sm text-[#00A6A6] hover:text-[#00A676] flex items-center gap-1"
                      >
                        <FiSave /> Búsquedas guardadas
                      </button>
                    )}
                  </div>

                  {loading ? (
                    <>
                      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-4 h-4 border-2 border-[#00A6A6] border-t-transparent rounded-full animate-spin"></div>
                        <span>Buscando propiedades...</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden">
                            <div className="bg-gray-200 h-64 animate-pulse" />
                            <div className="p-4 space-y-3">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : results.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {results.map((property) => (
                          <PropertyCard key={property.id} property={property} />
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-2"
                          >
                            <FiChevronLeft /> Anterior
                          </button>
                          <div className="text-sm text-gray-600">
                            Página {currentPage} de {totalPages}
                          </div>
                          <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-2"
                          >
                            Siguiente <FiChevronRight />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <FiSearch className="text-4xl mx-auto mb-3 text-gray-400" />
                      <h3 className="text-lg font-semibold text-[#0B2545]">No encontramos propiedades</h3>
                      <p className="text-sm text-gray-600 mt-1">Intenta ajustar tus filtros de búsqueda</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar simple filters removed */}
            </div>

            {/* Map removed on mobile */}
          </div>
        </div>
      </main>
      
      <Footer />
      <BottomNav />

      {showSave && (
        <SavedSearchModal
          query={filters.query || ''}
          filters={filters}
          onClose={() => setShowSave(false)}
        />
      )}
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}
