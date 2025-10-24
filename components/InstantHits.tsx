"use client"
import { Hits, Pagination, Stats } from 'react-instantsearch'
import HitCard from './HitCard'

export default function InstantHits() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <Stats 
          classNames={{
            root: 'text-sm text-gray-600',
          }}
          translations={{
            rootElementText({ nbHits, processingTimeMS }) {
              return `${nbHits.toLocaleString()} propiedades encontradas en ${processingTimeMS}ms`
            },
          }}
        />
      </div>
      
      <Hits 
        hitComponent={HitCard as any}
        classNames={{
          root: 'w-full',
          list: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6',
          item: 'w-full',
        }}
      />
      
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
