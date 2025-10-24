"use client"
import { ClearRefinements, RefinementList, RangeInput } from 'react-instantsearch'

export default function SearchFilters() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#0B2545]">Filtros</h3>
        <ClearRefinements classNames={{
          button: 'text-sm text-[#00A6A6] hover:underline'
        }}
        translations={{ resetButtonText: 'Limpiar filtros' }} />
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Tipo de publicación</h4>
        <RefinementList 
          attribute="listing_type"
          classNames={{
            labelText: 'text-sm',
            checkbox: 'mr-2',
            list: 'space-y-1',
          }}
          translations={{
            showMoreButtonText({ isShowingMore }) { return isShowingMore ? 'Ver menos' : 'Ver más' },
          }}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Tipo de propiedad</h4>
        <RefinementList 
          attribute="property_type"
          classNames={{ list: 'space-y-1', labelText: 'text-sm', checkbox: 'mr-2' }}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Habitaciones</h4>
        <RefinementList 
          attribute="bedrooms"
          classNames={{ list: 'space-y-1', labelText: 'text-sm', checkbox: 'mr-2' }}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Baños</h4>
        <RefinementList 
          attribute="bathrooms"
          classNames={{ list: 'space-y-1', labelText: 'text-sm', checkbox: 'mr-2' }}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Precio (USD)</h4>
        <RangeInput attribute="price_usd" classNames={{
          root: 'flex items-center gap-2',
          form: 'flex items-center gap-2 w-full',
          input: 'px-2 py-1 border border-gray-300 rounded w-full',
          separator: 'text-gray-400',
          submit: 'px-3 py-1 bg-[#0B2545] text-white rounded text-sm'
        }} />
      </div>
    </div>
  )
}
