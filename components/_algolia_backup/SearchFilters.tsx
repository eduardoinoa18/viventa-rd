"use client"
import { ClearRefinements, RefinementList, RangeInput } from 'react-instantsearch'
import { FiSliders, FiHome, FiDollarSign } from 'react-icons/fi'

export default function SearchFilters() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#0B2545] inline-flex items-center gap-2">
          <FiSliders /> Filtros
        </h3>
        <ClearRefinements classNames={{
          button: 'text-sm text-[#00A6A6] hover:underline'
        }}
        translations={{ resetButtonText: 'Limpiar filtros' }} />
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 inline-flex items-center gap-2">
          <FiHome /> Tipo de publicación
        </h4>
        <RefinementList 
          attribute="listing_type"
          classNames={{
            labelText: 'text-sm text-gray-700',
            checkbox: 'mr-2 accent-[#00A6A6]',
            list: 'space-y-2',
            item: 'flex items-center',
          }}
          translations={{
            showMoreButtonText({ isShowingMore }) { return isShowingMore ? 'Ver menos' : 'Ver más' },
          }}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 inline-flex items-center gap-2">
          <FiHome /> Tipo de propiedad
        </h4>
        <RefinementList 
          attribute="property_type"
          classNames={{ 
            list: 'space-y-2', 
            labelText: 'text-sm text-gray-700', 
            checkbox: 'mr-2 accent-[#00A6A6]',
            item: 'flex items-center',
          }}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 inline-flex items-center gap-2">
          <FiHome /> Habitaciones
        </h4>
        <RefinementList 
          attribute="bedrooms"
          classNames={{ 
            list: 'grid grid-cols-3 gap-2', 
            labelText: 'text-sm text-gray-700', 
            checkbox: 'mr-1 accent-[#00A6A6]',
            item: 'flex items-center',
          }}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 inline-flex items-center gap-2">
          <FiHome /> Baños
        </h4>
        <RefinementList 
          attribute="bathrooms"
          classNames={{ 
            list: 'grid grid-cols-3 gap-2', 
            labelText: 'text-sm text-gray-700', 
            checkbox: 'mr-1 accent-[#00A6A6]',
            item: 'flex items-center',
          }}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 inline-flex items-center gap-2">
          <FiDollarSign /> Precio (USD)
        </h4>
        <RangeInput attribute="price_usd" classNames={{
          root: 'flex items-center gap-2',
          form: 'flex items-center gap-2 w-full',
          input: 'px-3 py-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent',
          separator: 'text-gray-400',
          submit: 'px-4 py-2 bg-[#00A6A6] hover:bg-[#008c8c] text-white rounded text-sm font-medium transition-colors'
        }}
        translations={{
          separatorElementText: 'a',
          submitButtonText: 'OK'
        }} />
      </div>
    </div>
  )
}
