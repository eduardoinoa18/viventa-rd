'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FiTrash2,
  FiEdit2,
  FiPlus,
  FiArrowLeft,
  FiMapPin,
  FiDollarSign,
  FiBell,
  FiBellOff,
} from 'react-icons/fi'

type SearchCriteria = {
  city?: string
  sector?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  bedrooms?: number
  bathrooms?: number
  propertyType?: string
  listingType?: 'rent' | 'sell'
  amenities?: string[]
}

type SavedSearch = {
  id: string
  name: string
  criteria: SearchCriteria
  alertsEnabled: boolean
  createdAt: string
  updatedAt: string
}

type FormData = {
  name: string
  criteria: SearchCriteria
  alertsEnabled: boolean
}

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    criteria: {},
    alertsEnabled: true,
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadSearches()
  }, [])

  const loadSearches = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/saved-searches/manage')
      if (!res.ok) throw new Error('No se pudieron cargar las búsquedas')
      const data = await res.json()
      setSearches(data.data || [])
    } catch (error) {
      console.error('Error loading searches:', error)
      showMessage('error', 'No se pudieron cargar las búsquedas guardadas')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showMessage('error', 'El nombre de búsqueda es requerido')
      return
    }

    try {
      const method = editingId ? 'PUT' : 'POST'
      const payload = editingId ? { id: editingId, ...formData } : formData

      const res = await fetch('/api/saved-searches/manage', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('No se pudo guardar la búsqueda')

      showMessage('success', editingId ? 'Búsqueda actualizada' : 'Búsqueda guardada')
      resetForm()
      loadSearches()
    } catch (error) {
      console.error('Error saving search:', error)
      showMessage('error', 'No se pudo guardar la búsqueda')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta búsqueda guardada?')) return

    try {
      const res = await fetch(`/api/saved-searches/manage?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('No se pudo eliminar')
      showMessage('success', 'Búsqueda eliminada')
      loadSearches()
    } catch (error) {
      console.error('Error deleting:', error)
      showMessage('error', 'No se pudo eliminar la búsqueda')
    }
  }

  const handleEdit = (search: SavedSearch) => {
    setEditingId(search.id)
    setFormData({
      name: search.name,
      criteria: search.criteria,
      alertsEnabled: search.alertsEnabled,
    })
    setShowForm(true)
  }

  const handleToggleAlert = async (search: SavedSearch) => {
    try {
      const res = await fetch('/api/saved-searches/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: search.id,
          name: search.name,
          criteria: search.criteria,
          alertsEnabled: !search.alertsEnabled,
        }),
      })

      if (!res.ok) throw new Error('No se pudo cambiar el estado de alertas')
      loadSearches()
    } catch (error) {
      console.error('Error toggling alerts:', error)
      showMessage('error', 'No se pudo cambiar el estado de alertas')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', criteria: {}, alertsEnabled: true })
    setEditingId(null)
    setShowForm(false)
  }

  const buildSearchUrl = (criteria: SearchCriteria) => {
    const params = new URLSearchParams()
    if (criteria.city) params.set('city', criteria.city)
    if (criteria.sector) params.set('sector', criteria.sector)
    if (criteria.minPrice) params.set('minPrice', criteria.minPrice.toString())
    if (criteria.maxPrice) params.set('maxPrice', criteria.maxPrice.toString())
    if (criteria.bedrooms) params.set('bedrooms', criteria.bedrooms.toString())
    if (criteria.listingType) params.set('listingType', criteria.listingType)
    return `/search?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Búsquedas Guardadas</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#FF6B35] text-white px-4 py-2 rounded-lg hover:bg-[#e55a24] transition-colors font-semibold"
          >
            <FiPlus className="w-5 h-5" />
            Nueva Búsqueda
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? 'Editar Búsqueda' : 'Nueva Búsqueda'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Búsqueda *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Apartamentos en Santo Domingo"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                />
              </div>

              {/* Search Criteria Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={formData.criteria.city || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        criteria: { ...formData.criteria, city: e.target.value || undefined },
                      })
                    }
                    placeholder="Santo Domingo"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                </div>

                {/* Sector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sector
                  </label>
                  <input
                    type="text"
                    value={formData.criteria.sector || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        criteria: { ...formData.criteria, sector: e.target.value || undefined },
                      })
                    }
                    placeholder="Naco, Piantini"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                </div>

                {/* Min Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Mínimo
                  </label>
                  <input
                    type="number"
                    value={formData.criteria.minPrice || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        criteria: {
                          ...formData.criteria,
                          minPrice: e.target.value ? parseInt(e.target.value) : undefined,
                        },
                      })
                    }
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Máximo
                  </label>
                  <input
                    type="number"
                    value={formData.criteria.maxPrice || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        criteria: {
                          ...formData.criteria,
                          maxPrice: e.target.value ? parseInt(e.target.value) : undefined,
                        },
                      })
                    }
                    placeholder="Sin límite"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Habitaciones
                  </label>
                  <input
                    type="number"
                    value={formData.criteria.bedrooms || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        criteria: {
                          ...formData.criteria,
                          bedrooms: e.target.value ? parseInt(e.target.value) : undefined,
                        },
                      })
                    }
                    placeholder="Cualquiera"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                </div>

                {/* Listing Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <select
                    value={formData.criteria.listingType || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        criteria: {
                          ...formData.criteria,
                          listingType: (e.target.value as 'rent' | 'sell' | '') || undefined,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  >
                    <option value="">Ambos</option>
                    <option value="rent">Alquilar</option>
                    <option value="sell">Comprar</option>
                  </select>
                </div>
              </div>

              {/* Alerts Toggle */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="alertsEnabled"
                  checked={formData.alertsEnabled}
                  onChange={(e) => setFormData({ ...formData, alertsEnabled: e.target.checked })}
                  className="w-4 h-4 text-[#FF6B35]"
                />
                <label htmlFor="alertsEnabled" className="text-sm text-gray-700">
                  Recibir notificaciones cuando se publiquen nuevas propiedades que coincidan
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#FF6B35] text-white px-6 py-2 rounded-lg hover:bg-[#e55a24] transition-colors font-semibold"
                >
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Searches List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
          </div>
        ) : searches.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FiMapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No hay búsquedas guardadas aún</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-[#FF6B35] text-white px-6 py-2 rounded-lg hover:bg-[#e55a24] transition-colors font-semibold"
            >
              <FiPlus className="w-5 h-5" />
              Crear la primera
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {searches.map((search) => (
              <div
                key={search.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{search.name}</h3>

                    {/* Criteria Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {search.criteria.city && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          <FiMapPin className="w-3 h-3" />
                          {search.criteria.city}
                        </span>
                      )}
                      {search.criteria.minPrice && search.criteria.maxPrice && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          <FiDollarSign className="w-3 h-3" />
                          ${search.criteria.minPrice} - ${search.criteria.maxPrice}
                        </span>
                      )}
                      {search.criteria.bedrooms && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                          {search.criteria.bedrooms} hab.
                        </span>
                      )}
                      {search.criteria.listingType && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                          {search.criteria.listingType === 'rent' ? 'Alquilar' : 'Comprar'}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={buildSearchUrl(search.criteria)}
                        className="text-sm text-[#FF6B35] hover:text-[#e55a24] font-semibold"
                      >
                        Ver resultados
                      </Link>
                    </div>
                  </div>

                  {/* Right Side - Alert & Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleToggleAlert(search)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        search.alertsEnabled
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={search.alertsEnabled ? 'Alertas activas' : 'Alertas inactivas'}
                    >
                      {search.alertsEnabled ? (
                        <FiBell className="w-4 h-4" />
                      ) : (
                        <FiBellOff className="w-4 h-4" />
                      )}
                      <span className="text-xs font-medium">
                        {search.alertsEnabled ? 'Alertas ON' : 'Alertas OFF'}
                      </span>
                    </button>

                    <button
                      onClick={() => handleEdit(search)}
                      className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(search.id)}
                      className="flex items-center gap-2 px-3 py-2 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
