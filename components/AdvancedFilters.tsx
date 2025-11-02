'use client'
import { useState } from 'react'
import { FiSliders, FiX, FiSearch } from 'react-icons/fi'

interface AdvancedFiltersProps {
  onApply: (filters: any) => void
  initialFilters?: any
}

export default function AdvancedFilters({ onApply, initialFilters = {} }: AdvancedFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    propertyType: initialFilters.propertyType || '',
    listingType: initialFilters.listingType || '',
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    bedrooms: initialFilters.bedrooms || '',
    bathrooms: initialFilters.bathrooms || '',
    minArea: initialFilters.minArea || '',
    maxArea: initialFilters.maxArea || '',
    city: initialFilters.city || '',
    neighborhood: initialFilters.neighborhood || '',
    features: initialFilters.features || []
  })

  const propertyTypes = [
    { value: 'apartment', label: 'Apartamento' },
    { value: 'house', label: 'Casa' },
    { value: 'condo', label: 'Condominio' },
    { value: 'villa', label: 'Villa' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'land', label: 'Terreno' },
    { value: 'commercial', label: 'Comercial' }
  ]

  const cities = [
    'Santo Domingo',
    'Punta Cana',
    'Santiago',
    'La Romana',
    'Puerto Plata',
    'Samaná',
    'Bávaro',
    'Cap Cana'
  ]

  const availableFeatures = [
    { id: 'pool', label: 'Piscina' },
    { id: 'gym', label: 'Gimnasio' },
    { id: 'parking', label: 'Parqueo' },
    { id: 'security', label: 'Seguridad 24/7' },
    { id: 'garden', label: 'Jardín' },
    { id: 'balcony', label: 'Balcón' },
    { id: 'terrace', label: 'Terraza' },
    { id: 'elevator', label: 'Ascensor' },
    { id: 'ac', label: 'Aire Acondicionado' },
    { id: 'furnished', label: 'Amueblado' },
    { id: 'pets', label: 'Acepta Mascotas' },
    { id: 'oceanview', label: 'Vista al Mar' }
  ]

  function handleFeatureToggle(featureId: string) {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter((f: string) => f !== featureId)
        : [...prev.features, featureId]
    }))
  }

  function handleApply() {
    onApply(filters)
    setShowFilters(false)
  }

  function handleReset() {
    const emptyFilters = {
      propertyType: '',
      listingType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      minArea: '',
      maxArea: '',
      city: '',
      neighborhood: '',
      features: []
    }
    setFilters(emptyFilters)
    onApply(emptyFilters)
  }

  const activeFiltersCount = Object.values(filters).filter(v => 
    v && (Array.isArray(v) ? v.length > 0 : v !== '')
  ).length

  return (
    <>
      <button
        onClick={() => setShowFilters(true)}
        className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-[#00A676] text-[#00A676] rounded-xl font-semibold hover:bg-[#00A676] hover:text-white transition-colors relative"
      >
        <FiSliders className="text-xl" />
        <span>Filtros Avanzados</span>
        {activeFiltersCount > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white p-6 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <FiSliders className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Filtros Avanzados</h2>
                  <p className="text-sm text-white/80">Encuentra tu propiedad ideal</p>
                </div>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            {/* Filters Form */}
            <div className="p-6 space-y-6">
              {/* Property Type & Listing Type */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Tipo de Propiedad
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {propertyTypes.map(type => (
                      <button
                        key={type.value}
                        onClick={() => setFilters({ ...filters, propertyType: filters.propertyType === type.value ? '' : type.value })}
                        className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-colors ${
                          filters.propertyType === type.value
                            ? 'bg-[#00A676] border-[#00A676] text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-[#00A676]'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Tipo de Transacción
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFilters({ ...filters, listingType: filters.listingType === 'sale' ? '' : 'sale' })}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                        filters.listingType === 'sale'
                          ? 'bg-[#00A676] border-[#00A676] text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-[#00A676]'
                      }`}
                    >
                      Venta
                    </button>
                    <button
                      onClick={() => setFilters({ ...filters, listingType: filters.listingType === 'rent' ? '' : 'rent' })}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                        filters.listingType === 'rent'
                          ? 'bg-[#00A676] border-[#00A676] text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-[#00A676]'
                      }`}
                    >
                      Alquiler
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Rango de Precio (USD)
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Precio mínimo"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Precio máximo"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Bedrooms & Bathrooms */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Habitaciones
                  </label>
                  <div className="flex gap-2">
                    {['1', '2', '3', '4', '5+'].map(num => (
                      <button
                        key={num}
                        onClick={() => setFilters({ ...filters, bedrooms: filters.bedrooms === num ? '' : num })}
                        className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                          filters.bedrooms === num
                            ? 'bg-[#00A676] border-[#00A676] text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-[#00A676]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Baños
                  </label>
                  <div className="flex gap-2">
                    {['1', '2', '3', '4+'].map(num => (
                      <button
                        key={num}
                        onClick={() => setFilters({ ...filters, bathrooms: filters.bathrooms === num ? '' : num })}
                        className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                          filters.bathrooms === num
                            ? 'bg-[#00A676] border-[#00A676] text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-[#00A676]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Area Range */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Área (m²)
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Área mínima"
                    value={filters.minArea}
                    onChange={(e) => setFilters({ ...filters, minArea: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Área máxima"
                    value={filters.maxArea}
                    onChange={(e) => setFilters({ ...filters, maxArea: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Ciudad
                  </label>
                  <select
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  >
                    <option value="">Todas las ciudades</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Sector
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Piantini, Naco, Evaristo Morales"
                    value={filters.neighborhood}
                    onChange={(e) => setFilters({ ...filters, neighborhood: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Características
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableFeatures.map(feature => (
                    <button
                      key={feature.id}
                      onClick={() => handleFeatureToggle(feature.id)}
                      className={`px-3 py-2 rounded-lg border-2 font-medium text-sm transition-colors ${
                        filters.features.includes(feature.id)
                          ? 'bg-[#00A676] border-[#00A676] text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-[#00A676]'
                      }`}
                    >
                      {feature.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Limpiar Filtros
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <FiSearch />
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
