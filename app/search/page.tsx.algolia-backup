'use client'
import { useMemo, useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { InstantSearch, SearchBox, Configure, useSearchBox, SortBy } from 'react-instantsearch'
import { getAlgoliaClient, isAlgoliaConfigured, ALGOLIA_INDEX } from '../../lib/algoliaClient'
import InstantHits from '../../components/InstantHits'
import SavedSearchModal from '../../components/SavedSearchModal'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import BottomNav from '../../components/BottomNav'
import SearchFilters from '../../components/SearchFilters'
import PropertyCard from '../../components/PropertyCard'
import SearchStatsBar from '../../components/SearchStatsBar'
import AlgoliaStatsBar from '../../components/algolia/AlgoliaStatsBar'
import { getUserCurrency, type Currency } from '../../lib/currency'
import AdvancedFilters from '../../components/AdvancedFilters'
import { FiList, FiMap, FiSave, FiSearch, FiSliders, FiFilter } from 'react-icons/fi'
import { auth, db } from '../../lib/firebaseClient'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'

const MapSearch = dynamic(() => import('../../components/MapSearch'), {
  loading: () => <div className="text-center py-8 text-gray-400">Loading map...</div>,
  ssr: false
})

function SearchPageContent() {
  const searchClient = useMemo(() => getAlgoliaClient(), [])
  const indexName = ALGOLIA_INDEX
  const [showSave, setShowSave] = useState(false)
  const [saved, setSaved] = useState<any[]>([])
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')
  const [showFilters, setShowFilters] = useState(false)
  
  // Firestore fallback state
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchParams = useSearchParams()
  const [currency, setCurrency] = useState<Currency>('USD')
  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    city: '',
    featured: ''
  })

  useEffect(() => {
    loadSaved()
    if (!isAlgoliaConfigured) {
      loadProperties()
    }
    // initialize featured filter from URL
    const f = searchParams?.get('featured')
    if (f === '1' || f === 'true') {
      setFilters((prev) => ({ ...prev, featured: '1' }))
    }
    setCurrency(getUserCurrency())
  }, [])

  async function loadSaved() {
    const u = auth?.currentUser
    if (!u) return
    const snap = await getDocs(collection(db, 'users', u.uid, 'saved_searches'))
    setSaved(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })))
  }

  async function loadProperties() {
    setLoading(true)
    try {
      let q = query(
        collection(db, 'properties'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      
      const snap = await getDocs(q)
      let results = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
      
      // Apply filters
      if (searchQuery) {
        results = results.filter((p: any) => 
          p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location?.neighborhood?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      if (filters.type) {
        results = results.filter((p: any) => p.type === filters.type)
      }
      
      if (filters.minPrice) {
        results = results.filter((p: any) => (p.price || 0) >= Number(filters.minPrice))
      }
      
      if (filters.maxPrice) {
        results = results.filter((p: any) => (p.price || 0) <= Number(filters.maxPrice))
      }
      
      if (filters.bedrooms) {
        results = results.filter((p: any) => (p.bedrooms || 0) >= Number(filters.bedrooms))
      }
      
      if (filters.bathrooms) {
        results = results.filter((p: any) => (p.bathrooms || 0) >= Number(filters.bathrooms))
      }
      
      if (filters.city) {
        results = results.filter((p: any) => 
          p.location?.city?.toLowerCase().includes(filters.city.toLowerCase())
        )
      }
      if (filters.featured) {
        results = results.filter((p: any) => !!p.featured)
      }
      
      setProperties(results)
    } catch (error) {
      console.error('Error loading properties:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!isAlgoliaConfigured) {
      loadProperties()
    }
  }, [searchQuery, filters])

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
              onApply={(appliedFilters) => {
                setFilters({
                  type: appliedFilters.propertyType || '',
                  minPrice: appliedFilters.minPrice || '',
                  maxPrice: appliedFilters.maxPrice || '',
                  bedrooms: appliedFilters.bedrooms || '',
                  bathrooms: appliedFilters.bathrooms || '',
                  city: appliedFilters.city || '',
                  featured: filters.featured || ''
                })
                // You can expand this to include more filters
              }}
              initialFilters={{
                propertyType: filters.type,
                minPrice: filters.minPrice,
                maxPrice: filters.maxPrice,
                bedrooms: filters.bedrooms,
                bathrooms: filters.bathrooms,
                city: filters.city,
                featured: filters.featured
              }}
            />
            <div className="text-sm text-gray-600">
              Usa filtros avanzados para una búsqueda más específica
            </div>
          </div>
          
          {!isAlgoliaConfigured || !searchClient ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 mb-6">
                <div className="font-semibold flex items-center gap-2">
                  <FiSearch /> Búsqueda directa con Firestore
                </div>
                <div className="text-sm mt-1">Mostrando propiedades activas desde la base de datos.</div>
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

              <div className="grid lg:grid-cols-[1fr_400px] gap-6">
                {/* Main content */}
                <div className={`${mobileView !== 'list' ? 'hidden lg:block' : ''} space-y-4`}>
                  {/* Search bar */}
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por ubicación, tipo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Metrics */}
                  <SearchStatsBar items={properties} currency={currency} />

                  {/* Results */}
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="mb-4 text-sm text-gray-600">
                      {properties.length} propiedades encontradas
                    </div>

                    {loading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse" />
                        ))}
                      </div>
                    ) : properties.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {properties.map((property) => (
                          <PropertyCard key={property.id} property={property} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FiSearch className="text-4xl mx-auto mb-3 text-gray-400" />
                        <h3 className="text-lg font-semibold text-[#0B2545]">No encontramos propiedades</h3>
                        <p className="text-sm text-gray-600 mt-1">Intenta ajustar tus filtros de búsqueda</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar filters */}
                <div className={`${mobileView !== 'map' && !showFilters ? 'hidden lg:block' : ''} space-y-4`}>
                  <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20">
                    <h3 className="font-semibold text-[#0B2545] mb-4 flex items-center gap-2">
                      <FiFilter /> Filtros
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                          value={filters.type}
                          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                        >
                          <option value="">Todos</option>
                          <option value="house">Casa</option>
                          <option value="apartment">Apartamento</option>
                          <option value="condo">Condominio</option>
                          <option value="land">Terreno</option>
                          <option value="commercial">Comercial</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                        <input
                          type="text"
                          value={filters.city}
                          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                          placeholder="Ej: Santo Domingo"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Precio mín</label>
                          <input
                            type="number"
                            value={filters.minPrice}
                            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                            placeholder="$0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Precio máx</label>
                          <input
                            type="number"
                            value={filters.maxPrice}
                            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                            placeholder="Sin límite"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Habitaciones</label>
                          <select
                            value={filters.bedrooms}
                            onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                          >
                            <option value="">Todas</option>
                            <option value="1">1+</option>
                            <option value="2">2+</option>
                            <option value="3">3+</option>
                            <option value="4">4+</option>
                            <option value="5">5+</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Baños</label>
                          <select
                            value={filters.bathrooms}
                            onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                          >
                            <option value="">Todos</option>
                            <option value="1">1+</option>
                            <option value="2">2+</option>
                            <option value="3">3+</option>
                            <option value="4">4+</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setFilters({
                            type: '',
                            minPrice: '',
                            maxPrice: '',
                            bedrooms: '',
                            bathrooms: '',
                            city: '',
                            featured: ''
                          })
                          setSearchQuery('')
                        }}
                        className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {isAlgoliaConfigured && searchClient && (
          <InstantSearch searchClient={searchClient} indexName={indexName}>
            {/* Mobile view toggle + filters toggle */}
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
            <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
              {/* Main content area */}
              <div className={`${mobileView !== 'list' ? 'hidden lg:block' : ''} space-y-4`}>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <SearchBox 
                    placeholder="Buscar por ubicación, tipo de propiedad..."
                    classNames={{
                      root: 'w-full',
                      form: 'relative',
                      input: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent',
                      submit: 'absolute right-3 top-1/2 -translate-y-1/2',
                      reset: 'absolute right-12 top-1/2 -translate-y-1/2',
                    }}
                  />
                </div>
                {/* Metrics driven by Algolia hits */}
                <AlgoliaStatsBar />
                <Configure hitsPerPage={12} clickAnalytics enablePersonalization={false} />
                <InstantHits />
              </div>

              {/* Sidebar */}
              <div className={`${mobileView !== 'map' && !showFilters ? 'hidden lg:block' : ''} space-y-4`}>
                <div className="sticky top-20 space-y-4">
                  <SearchFilters />
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 bg-[#0B2545] text-white">
                      <h3 className="font-semibold">Mapa de búsqueda</h3>
                    </div>
                    <MapSearch />
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <SaveSearchButton onOpen={() => setShowSave(true)} />
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-[#0B2545]">Búsquedas guardadas</h3>
                      <button 
                        onClick={loadSaved} 
                        className="text-sm text-[#00A6A6] hover:underline"
                      >
                        Actualizar
                      </button>
                    </div>
                    <SavedList items={saved} />
                  </div>
                </div>
              </div>
            </div>
            {showSave && <SaveModal onClose={() => setShowSave(false)} />}
          </InstantSearch>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A6A6] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando búsqueda...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}

function SaveSearchButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button 
      onClick={onOpen} 
      className="w-full px-4 py-3 bg-[#00A6A6] hover:bg-[#008c8c] text-white rounded-lg font-medium transition-colors duration-200 shadow-sm inline-flex items-center justify-center gap-2"
    >
      <FiSave /> Guardar búsqueda actual
    </button>
  )
}

function SaveModal({ onClose }: { onClose: () => void }) {
  const { query } = useSearchBox()
  return <SavedSearchModal onClose={onClose} query={query} />
}

function SavedList({ items }: { items: any[] }) {
  const { refine } = useSearchBox()
  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No hay búsquedas guardadas</p>
          <p className="text-xs text-gray-400 mt-1">Guarda tus búsquedas favoritas aquí</p>
        </div>
      )}
      {items.map((s) => (
        <button
          key={s.id}
          className="w-full text-left px-3 py-2 text-sm text-[#004AAD] hover:bg-blue-50 rounded-lg transition-colors duration-150 border border-gray-200 inline-flex items-center gap-2"
          onClick={() => {
            const savedQuery = (s as any).query || {}
            if (savedQuery.query) refine(savedQuery.query)
          }}
        >
          <FiSearch /> {s.name || 'Búsqueda sin nombre'}
        </button>
      ))}
    </div>
  )
}
