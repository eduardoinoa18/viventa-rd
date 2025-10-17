'use client'
import { useMemo, useState } from 'react'
import { InstantSearch, SearchBox, Configure, useSearchBox } from 'react-instantsearch'
import { algoliaClient } from '../../lib/algoliaClient'
import InstantHits from '../../components/InstantHits'
import MapSearch from '../../components/MapSearch'
import SavedSearchModal from '../../components/SavedSearchModal'
import { auth, db } from '../../lib/firebaseClient'
import { collection, getDocs } from 'firebase/firestore'

export default function SearchPage() {
  const searchClient = useMemo(() => algoliaClient, [])
  const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX || 'viventa_listings'
  const [showSave, setShowSave] = useState(false)
  const [saved, setSaved] = useState<any[]>([])

  async function loadSaved() {
    const u = auth?.currentUser
    if (!u) return
  const snap = await getDocs(collection(db, 'users', u.uid, 'saved_searches'))
  setSaved(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Buscar propiedades</h1>
      <InstantSearch searchClient={searchClient} indexName={indexName}>
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div>
            <SearchBox />
            <Configure hitsPerPage={12} clickAnalytics enablePersonalization={false} />
            <div className="mt-4">
              <InstantHits />
            </div>
          </div>

          <div className="sticky top-20 space-y-3">
            <MapSearch />
            <SaveSearchButton onOpen={() => setShowSave(true)} />
            <div className="p-3 bg-white rounded shadow">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Búsquedas guardadas</h3>
                <button onClick={loadSaved} className="text-sm underline">Actualizar</button>
              </div>
              <SavedList items={saved} />
            </div>
          </div>
        </div>
        {showSave && <SaveModal onClose={() => setShowSave(false)} />}
      </InstantSearch>
    </div>
  )
}

function SaveSearchButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full px-3 py-2 bg-[#00A6A6] text-white rounded">Guardar búsqueda</button>
  )
}

function SaveModal({ onClose }: { onClose: () => void }) {
  const { query } = useSearchBox()
  return <SavedSearchModal onClose={onClose} query={query} />
}

function SavedList({ items }: { items: any[] }) {
  const { refine } = useSearchBox()
  return (
    <ul className="mt-2 space-y-1">
      {items.length === 0 && <li className="text-sm text-gray-500">No hay búsquedas guardadas</li>}
      {items.map((s) => (
        <li key={s.id}>
          <button
            className="text-sm text-[#004AAD] hover:underline"
            onClick={() => {
              const savedQuery = (s as any).query || {}
              if (savedQuery.query) refine(savedQuery.query)
            }}
          >
            {s.name || 'Búsqueda'}
          </button>
        </li>
      ))}
    </ul>
  )
}
