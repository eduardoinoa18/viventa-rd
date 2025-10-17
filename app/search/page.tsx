'use client'
import { useMemo, useState } from 'react'
import { InstantSearch, SearchBox, Configure } from 'react-instantsearch'
import { getAlgoliaClient, getListingsIndexName } from '../../lib/algoliaClient'
import InstantHits from '../../components/InstantHits'
import MapSearch from '../../components/MapSearch'
import SavedSearchModal from '../../components/SavedSearchModal'
import { t } from '../../lib/i18n'

export default function SearchPage() {
  const searchClient = useMemo(() => getAlgoliaClient(), [])
  const indexName = getListingsIndexName()
  const [showSave, setShowSave] = useState(false)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('search_title') || 'Buscar propiedades'}</h1>
      <InstantSearch indexName={indexName} searchClient={searchClient}>
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
          <div>
            <SearchBox placeholder={t('search_placeholder')} />
            <Configure hitsPerPage={12} clickAnalytics enablePersonalization={false} />
            <div className="mt-4">
              <InstantHits />
            </div>
          </div>
          <div className="sticky top-20">
            <MapSearch />
            <button onClick={() => setShowSave(true)} className="mt-3 w-full px-3 py-2 bg-[#00A6A6] text-white rounded">
              {t('save_search') || 'Guardar búsqueda'}
            </button>
          </div>
        </div>
        {showSave && <SavedSearchModal onClose={() => setShowSave(false)} query={{}} />}
      </InstantSearch>
    </div>
  )
}
