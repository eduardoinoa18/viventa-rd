'use client'
import { useMemo, useState, useEffect } from 'react'
import { InstantSearch, SearchBox, Configure, useSearchBox, SortBy } from 'react-instantsearch'
import { getAlgoliaClient, isAlgoliaConfigured, ALGOLIA_INDEX } from '../../lib/algoliaClient'
import InstantHits from '../../components/InstantHits'
import MapSearch from '../../components/MapSearch'
import SavedSearchModal from '../../components/SavedSearchModal'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import SearchFilters from '../../components/SearchFilters'
import { FiList, FiMap, FiSave, FiSearch, FiSliders } from 'react-icons/fi'
import { auth, db } from '../../lib/firebaseClient'
import { collection, getDocs } from 'firebase/firestore'

export default function SearchPage() {
  const searchClient = useMemo(() => getAlgoliaClient(), [])
  const indexName = ALGOLIA_INDEX
  const [showSave, setShowSave] = useState(false)
  const [saved, setSaved] = useState<any[]>([])
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadSaved()
  }, [])

  async function loadSaved() {
    const u = auth?.currentUser
    if (!u) return
    const snap = await getDocs(collection(db, 'users', u.uid, 'saved_searches'))
    setSaved(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })))
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
          
          {!isAlgoliaConfigured || !searchClient ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6">
              <div className="font-semibold">Búsqueda deshabilitada (configuración pendiente)</div>
              <div className="text-sm mt-1">Falta configurar las variables de entorno de Algolia: NEXT_PUBLIC_ALGOLIA_APP_ID y NEXT_PUBLIC_ALGOLIA_SEARCH_KEY. Mientras tanto, puedes navegar por las propiedades destacadas o usar filtros locales.</div>
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
    </>
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
