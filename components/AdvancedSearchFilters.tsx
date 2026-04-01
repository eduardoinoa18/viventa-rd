'use client'

import { useState } from 'react'
import { FiChevronDown, FiX, FiSliders } from 'react-icons/fi'

type SearchFilters = {
  listingType?: 'rent' | 'sell'
  city?: string
  sector?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  bedrooms?: number
  bathrooms?: number
  propertyType?: string
  amenities?: string[]
  yearBuilt?: number
}

type SearchFiltersProps = {
  onFiltersChange: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
  onSearch?: () => void
  loading?: boolean
}

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartamento' },
  { id: 'house', label: 'Casa' },
  { id: 'land', label: 'Terreno' },
  { id: 'commercial', label: 'Comercial' },
  { id: 'townhouse', label: 'Casa de Tira' },
]

const AMENITIES = [
  { id: 'pool', label: 'Piscina' },
  { id: 'gym', label: 'Gimnasio' },
  { id: 'parking', label: 'Estacionamiento' },
  { id: 'garden', label: 'Jardín' },
  { id: 'security', label: 'Seguridad 24/7' },
  { id: 'elevator', label: 'Ascensor' },
  { id: 'balcony', label: 'Balcón' },
  { id: 'ac', label: 'Aire Acondicionado' },
]

const CITIES = [
  'Santo Domingo',
  'Santiago',
  'La Romana',
  'Puerto Plata',
  'Sosúa',
  'Cabarete',
  'Punta Cana',
  'San Cristóbal',
]

export default function AdvancedSearchFilters({
  onFiltersChange,
  initialFilters = {},
  onSearch,
  loading = false,
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic')

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleAmenityToggle = (amenityId: string) => {
    const amenities = filters.amenities || []
    const updated = amenities.includes(amenityId)
      ? amenities.filter((a) => a !== amenityId)
      : [...amenities, amenityId]
    handleFilterChange('amenities', updated.length > 0 ? updated : undefined)
  }

  const clearFilters = () => {
    setFilters({})
    onFiltersChange({})
  }

  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== null && v !== '').length

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Collapsed Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FiSliders className="w-5 h-5 text-[#FF6B35]" />
          <span className="font-semibold text-gray-900">
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-[#FF6B35] rounded-full">
                {activeFilterCount}
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                clearFilters()
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium px-2 py-1"
            >
              Limpiar
            </button>
          )}
          <FiChevronDown
            className={`w-5 h-5 text-gray-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded Filters */}
      {expanded && (
        <div className="border-t border-gray-200 px-6 py-6 space-y-6">
          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('basic')}
              className={`pb-4 font-medium border-b-2 transition-colors ${
                activeTab === 'basic'
                  ? 'text-[#FF6B35] border-[#FF6B35]'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Básico
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`pb-4 font-medium border-b-2 transition-colors ${
                activeTab === 'advanced'
                  ? 'text-[#FF6B35] border-[#FF6B35]'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Avanzado
            </button>
          </div>

          {/* Basic Filters */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Listing Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Tipo de Transacción
                </label>
                <div className="flex gap-3">
                  {['rent', 'sell'].map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        handleFilterChange('listingType', filters.listingType === type ? undefined : (type as any))
                      }
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                        filters.listingType === type
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'rent' ? 'Alquilar' : 'Comprar'}
                    </button>
                  ))}
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Ciudad
                </label>
                <select
                  value={filters.city || ''}
                  onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                >
                  <option value="">Todas las ciudades</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Rango de Precio
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={filters.minPrice || ''}
                    onChange={(e) =>
                      handleFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Máx"
                    value={filters.maxPrice || ''}
                    onChange={(e) =>
                      handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Bedrooms & Bathrooms */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Habitaciones
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Cualquiera"
                    value={filters.bedrooms || ''}
                    onChange={(e) =>
                      handleFilterChange('bedrooms', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Baños
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Cualquiera"
                    value={filters.bathrooms || ''}
                    onChange={(e) =>
                      handleFilterChange('bathrooms', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Advanced Filters */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* Area Range */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Área (m²)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={filters.minArea || ''}
                    onChange={(e) =>
                      handleFilterChange('minArea', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Máx"
                    value={filters.maxArea || ''}
                    onChange={(e) =>
                      handleFilterChange('maxArea', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Tipo de Propiedad
                </label>
                <select
                  value={filters.propertyType || ''}
                  onChange={(e) => handleFilterChange('propertyType', e.target.value || undefined)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                >
                  <option value="">Cualquier tipo</option>
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Built */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Año Construido (mínimo)
                </label>
                <input
                  type="number"
                  min="1950"
                  max={new Date().getFullYear()}
                  value={filters.yearBuilt || ''}
                  onChange={(e) =>
                    handleFilterChange('yearBuilt', e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                />
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Amenidades
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITIES.map((amenity) => (
                    <button
                      key={amenity.id}
                      onClick={() => handleAmenityToggle(amenity.id)}
                      className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.amenities?.includes(amenity.id)
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {amenity.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search Button */}
          <button
            onClick={onSearch}
            disabled={loading}
            className="w-full bg-[#FF6B35] text-white py-3 rounded-lg hover:bg-[#e55a24] transition-colors font-semibold disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar Propiedades'}
          </button>
        </div>
      )}
    </div>
  )
}
