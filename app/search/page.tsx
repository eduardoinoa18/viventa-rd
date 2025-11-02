'use client'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import BottomNav from '../../components/BottomNav'
import PropertyCard from '../../components/PropertyCard'
import SearchStatsBar from '../../components/SearchStatsBar'
import AdvancedFilters from '../../components/AdvancedFilters'
import SavedSearchModal from '../../components/SavedSearchModal'
import { FiList, FiMap, FiSave, FiSearch, FiSliders, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { auth, db } from '../../lib/firebaseClient'
import { collection, getDocs } from 'firebase/firestore'
import { getUserCurrency, type Currency } from '../../lib/currency'
import { searchListings, getFacetValues, type SearchFilters, type Listing } from '../../lib/customSearchService'

const CustomMapSearch = dynamic(() => import('../../components/CustomMapSearch'), {
  loading: () => <div className="text-center py-8 text-gray-400">Cargando mapa...</div>,
  ssr: false
})

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // UI state
  const [showSave, setShowSave] = useState(false)
  const [saved, setSaved] = useState<any[]>([])
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [currency, setCurrency] = useState<Currency>('USD')
  
  // Search state
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Listing[]>([])
  const [totalHits, setTotalHits] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 20
  
  // Facet values for dropdowns
  const [facets, setFacets] = useState<{
    cities: string[]
    neighborhoods: string[]
    propertyTypes: string[]
  }>({ cities: [], neighborhoods: [], propertyTypes: [] })
  
  // Search filters
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams?.get('q') || '',
    city: searchParams?.get('city') || undefined,
    neighborhood: searchParams?.get('neighborhood') || undefined,
    propertyType: searchParams?.get('type') || undefined,
    listingType: (searchParams?.get('listingType') as 'sale' | 'rent') || undefined,
    minPrice: searchParams?.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams?.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    bedrooms: searchParams?.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
    bathrooms: searchParams?.get('bathrooms') ? Number(searchParams.get('bathrooms')) : undefined,
  })

  // Cached facets with timestamp
  const [facetsCache, setFacetsCache] = useState<{ data: typeof facets; timestamp: number } | null>(null)
  const FACETS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  // Load saved searches and facets
  useEffect(() => {
    loadSaved()
    loadFacetsWithCache()
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

  async function loadFacets() {
    const facetValues = await getFacetValues()
    setFacets(facetValues)
  }

  async function loadFacetsWithCache() {
    // Check if we have valid cached facets
    if (facetsCache && Date.now() - facetsCache.timestamp < FACETS_CACHE_TTL) {
      console.log('[CustomSearch] Using cached facets')
      setFacets(facetsCache.data)
      return
    }

    // Fetch fresh facets
    console.log('[CustomSearch] Fetching fresh facets')
    const facetValues = await getFacetValues()
    setFacets(facetValues)
    setFacetsCache({ data: facetValues, timestamp: Date.now() })
  }

  async function performSearch() {
    setLoading(true)
    try {
      console.log('[CustomSearch] Searching with filters:', filters)
      const response = await searchListings(filters, currentPage, pageSize)
      console.log('[CustomSearch] Results:', response.totalHits, 'hits')
      
      setResults(response.results.map((r) => r.listing))
      setTotalHits(response.totalHits)
      setTotalPages(response.totalPages)
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
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#0B2545] mb-2">Buscar propiedades</h1>
            <p className="text-gray-600">Encuentra tu propiedad ideal en República Dominicana</p>
          </div>

          {/* Advanced Filters Button */}
          <div className="mb-6 flex items-center gap-4">
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
            <div className="text-sm text-gray-600">
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

            {/* Mobile view toggle */}
            <div className="lg:hidden mb-4 flex items-center justify-between gap-2">
              <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setMobileView('list')}
                  className={`px-4 py-2 flex items-center gap-2 ${mobileView === 'list' ? 'bg-[#0B2545] text-white' : 'bg-white text-gray-700'}`}
                >
                  <FiList /> Lista
                </button>
                <button
                  onClick={() => setMobileView('map')}
                  className={`px-4 py-2 flex items-center gap-2 ${mobileView === 'map' ? 'bg-[#0B2545] text-white' : 'bg-white text-gray-700'}`}
                >
                  <FiMap /> Mapa
                </button>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center gap-2 text-gray-700 hover:bg-gray-50"
              >
                <FiSliders /> Filtros
              </button>
            </div>

            <div className="grid lg:grid-cols-[1fr_420px] gap-6">
              {/* Main content */}
              <div className={`${mobileView !== 'list' ? 'hidden lg:block' : ''} space-y-4 min-w-0`}>
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

                {/* Stats */}
                <SearchStatsBar items={results} currency={currency} />

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

              {/* Sidebar filters and map */}
              <div className={`${mobileView !== 'map' && !showFilters ? 'hidden lg:block' : ''} space-y-4`}>
                <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto">
                  <h3 className="font-semibold text-[#0B2545] mb-4 flex items-center gap-2">
                    <FiFilter /> Filtros
                  </h3>
                  <div className="space-y-4">
                    {/* Listing Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Operación</label>
                      <select
                        value={filters.listingType || ''}
                        onChange={(e) => updateFilters({ listingType: e.target.value as 'sale' | 'rent' | undefined || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                      >
                        <option value="">Todas</option>
                        <option value="sale">Venta</option>
                        <option value="rent">Alquiler</option>
                      </select>
                    </div>

                    {/* Property Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de propiedad</label>
                      <select
                        value={filters.propertyType || ''}
                        onChange={(e) => updateFilters({ propertyType: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                      >
                        <option value="">Todos</option>
                        {facets.propertyTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                      <select
                        value={filters.city || ''}
                        onChange={(e) => updateFilters({ city: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                      >
                        <option value="">Todas</option>
                        {facets.cities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    {/* Neighborhood */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                      <select
                        value={filters.neighborhood || ''}
                        onChange={(e) => updateFilters({ neighborhood: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                      >
                        <option value="">Todos</option>
                        {facets.neighborhoods.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio mín</label>
                        <input
                          type="number"
                          value={filters.minPrice || ''}
                          onChange={(e) => updateFilters({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="$0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio máx</label>
                        <input
                          type="number"
                          value={filters.maxPrice || ''}
                          onChange={(e) => updateFilters({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="$∞"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Bedrooms / Bathrooms */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Habitaciones</label>
                        <input
                          type="number"
                          value={filters.bedrooms || ''}
                          onChange={(e) => updateFilters({ bedrooms: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="0+"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Baños</label>
                        <input
                          type="number"
                          value={filters.bathrooms || ''}
                          onChange={(e) => updateFilters({ bathrooms: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="0+"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <button
                      onClick={() => {
                        setFilters({ query: '' })
                        setCurrentPage(1)
                      }}
                      className="w-full px-4 py-2 text-sm text-gray-600 hover:text-[#0B2545] border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </div>

                {/* Map view on desktop */}
                <div className="hidden lg:block mt-4">
                  <div className="bg-white rounded-lg shadow-sm p-4 h-[500px] sticky top-[calc(100vh-520px)]">
                    <CustomMapSearch 
                      listings={results}
                      onMarkerClick={(id: string) => router.push(`/listing/${id}`)}
                      currency={currency}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Map View */}
            {mobileView === 'map' && (
              <div className="lg:hidden">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <CustomMapSearch 
                    listings={results}
                    onMarkerClick={(id: string) => router.push(`/listing/${id}`)}
                    currency={currency}
                  />
                </div>
              </div>
            )}
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
