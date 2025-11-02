"use client"
import { Pagination, Stats, useHits, useInstantSearch } from 'react-instantsearch'
import HitCard from './HitCard'
import { FiSearch } from 'react-icons/fi'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
      <div className="h-56 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-10 bg-gray-200 rounded w-full" />
      </div>
    </div>
  )
}

export default function InstantHits() {
  const { hits } = useHits<any>()
  const { status } = useInstantSearch()
  const isLoading = status === 'loading' || status === 'stalled'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <Stats 
          classNames={{ root: 'text-sm text-gray-600' }}
          translations={{
            rootElementText({ nbHits, processingTimeMS }) {
              return `${nbHits.toLocaleString()} propiedades encontradas en ${processingTimeMS}ms`
            },
          }}
        />
      </div>

      {/* Results grid with loading and empty states */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        {!isLoading && hits.length > 0 && hits.map((h) => (
          <HitCard key={h.objectID} hit={h} />
        ))}
        {!isLoading && hits.length === 0 && (
          <div className="col-span-full">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <FiSearch className="text-4xl mx-auto mb-3 text-gray-400" />
              <h3 className="text-lg font-semibold text-[#0B2545]">No encontramos resultados</h3>
              <p className="text-sm text-gray-600 mt-1">Ajusta tu búsqueda o mueve el mapa para explorar otras áreas.</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center py-4">
        <Pagination 
          classNames={{
            root: 'flex gap-2',
            list: 'flex gap-2',
            item: 'inline-block',
            link: 'px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors',
            selectedItem: 'bg-[#00A6A6] text-white border-[#00A6A6]',
            disabledItem: 'opacity-50 cursor-not-allowed',
          }}
        />
      </div>
    </div>
  )
}
