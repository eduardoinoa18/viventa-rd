// app/admin/properties/page.tsx
'use client'
import { useState, useEffect, useMemo } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import Link from 'next/link'
import { FiCheck, FiX, FiMapPin, FiDollarSign, FiEye, FiPlusSquare, FiEdit, FiTrash2, FiSearch, FiFilter, FiGrid, FiList } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { computeQualityScore } from '@/lib/searchUtils'

type Listing = { 
  id: string
  title: string
  location?: string
  city?: string
  price: number
  status: string
  agentName?: string
  agent?: string
  images?: string[]
  bedrooms?: number
  bathrooms?: number
  area?: number
  propertyType?: string
  listingType?: string
  createdAt?: any
  publicRemarks?: string
  professionalRemarks?: string
}

export default function AdminPropertiesPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  
  // Filtered listings based on search
  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings
    const query = searchQuery.toLowerCase()
    return listings.filter(l => 
      l.title?.toLowerCase().includes(query) ||
      l.location?.toLowerCase().includes(query) ||
      l.city?.toLowerCase().includes(query) ||
      l.agentName?.toLowerCase().includes(query)
    )
  }, [listings, searchQuery])
  
  const allSelected = filteredListings.length > 0 && filteredListings.every(l => selected[l.id])
  
  // Stats
  const stats = useMemo(() => ({
    total: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    pending: listings.filter(l => l.status === 'pending').length,
    sold: listings.filter(l => l.status === 'sold').length,
    rejected: listings.filter(l => l.status === 'rejected').length,
  }), [listings])

  useEffect(() => { load() }, [statusFilter])

  async function load() {
    setLoading(true)
    try {
      const url = statusFilter === 'all' ? '/api/admin/properties' : `/api/admin/properties?status=${statusFilter}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.ok) setListings(json.data || [])
    } catch (e) {
      console.error('Failed to load properties', e)
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  async function approve(id: string) {
    try {
      const res = await fetch('/api/admin/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'active' })
      })
      if (res.ok) {
        toast.success('Property approved')
        load()
      } else {
        toast.error('Failed to approve property')
      }
    } catch (e) {
      console.error('Failed to approve property', e)
      toast.error('Failed to approve property')
    }
  }

  async function reject(id: string) {
    try {
      const res = await fetch('/api/admin/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' })
      })
      if (res.ok) {
        toast.success('Property rejected')
        load()
      } else {
        toast.error('Failed to reject property')
      }
    } catch (e) {
      console.error('Failed to reject property', e)
      toast.error('Failed to reject property')
    }
  }

  function toggleAll() {
    if (allSelected) {
      setSelected({})
    } else {
      const next: Record<string, boolean> = {}
      listings.forEach(l => { next[l.id] = true })
      setSelected(next)
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function bulkUpdate(nextStatus: 'active'|'rejected') {
    const ids = listings.filter(l => selected[l.id]).map(l => l.id)
    if (ids.length === 0) {
      toast('Select at least one listing')
      return
    }
    try {
      const res = await fetch('/api/admin/properties/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: nextStatus })
      })
      const json = await res.json()
      if (res.ok && json.ok) {
        toast.success(`Updated ${ids.length} listings`)
        // Instant UI refresh without full reload
        setListings(prev => prev.map(l => selected[l.id] ? { ...l, status: nextStatus } : l))
        setSelected({})
      } else {
        toast.error(json.error || 'Bulk update failed')
      }
    } catch (e) {
      console.error('Bulk update error', e)
      toast.error('Bulk update failed')
    }
  }

  async function deleteListing(id: string) {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return
    try {
      const res = await fetch('/api/admin/properties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        toast.success('Property deleted')
        load()
      } else {
        toast.error('Failed to delete property')
      }
    } catch (e) {
      console.error('Failed to delete property', e)
      toast.error('Failed to delete property')
    }
  }

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-[#0B2545]">Gestión de Propiedades</h1>
                  <p className="text-gray-600 mt-1">Administra y aprueba publicaciones de propiedades</p>
                </div>
                <Link 
                  href="/admin/properties/create" 
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] shadow-lg shadow-[#00A676]/30 transition-all"
                >
                  <FiPlusSquare /> Nueva Propiedad
                </Link>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-gray-600 text-sm mb-1">Total</div>
                  <div className="text-2xl font-bold text-[#0B2545]">{stats.total}</div>
                </div>
                <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
                  <div className="text-green-700 text-sm mb-1">Activas</div>
                  <div className="text-2xl font-bold text-green-700">{stats.active}</div>
                </div>
                <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
                  <div className="text-yellow-700 text-sm mb-1">Pendientes</div>
                  <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                </div>
                <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
                  <div className="text-blue-700 text-sm mb-1">Vendidas</div>
                  <div className="text-2xl font-bold text-blue-700">{stats.sold}</div>
                </div>
                <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
                  <div className="text-red-700 text-sm mb-1">Rechazadas</div>
                  <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
                </div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por título, ubicación, agente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <FiFilter className="text-gray-500" />
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)} 
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    aria-label="Filtrar por estado"
                  >
                    <option value="all">Todos los Estados</option>
                    <option value="pending">⏳ Pendientes</option>
                    <option value="active">✅ Activas</option>
                    <option value="sold">🏆 Vendidas</option>
                    <option value="rejected">❌ Rechazadas</option>
                  </select>
                  <div className="border-l border-gray-300 pl-2 flex gap-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#00A676] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      title="Vista de lista"
                    >
                      <FiList />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#00A676] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      title="Vista de cuadrícula"
                    >
                      <FiGrid />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk actions toolbar */}
            {Object.values(selected).filter(Boolean).length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-5 w-5" aria-label="Seleccionar todas las propiedades" />
                  <span className="text-sm font-medium text-blue-900">
                    {Object.values(selected).filter(Boolean).length} propiedad(es) seleccionada(s)
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => bulkUpdate('active')} 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                  >
                    <FiCheck /> Aprobar
                  </button>
                  <button 
                    onClick={() => bulkUpdate('rejected')} 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                  >
                    <FiX /> Rechazar
                  </button>
                </div>
              </div>
            )}

            {/* Listings */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {loading ? (
                <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-[#00A676] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <div className="text-gray-500">Cargando propiedades...</div>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
                  <FiSearch className="text-4xl mx-auto mb-3 text-gray-400" />
                  <div className="text-gray-900 font-semibold mb-1">No se encontraron propiedades</div>
                  <div className="text-gray-500 text-sm">
                    {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Aún no hay propiedades con este estado'}
                  </div>
                </div>
              ) : (
                filteredListings.map(l => (
                  <div key={l.id} className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow overflow-hidden">
                    {viewMode === 'grid' ? (
                      // Grid Card View
                      <div className="flex flex-col">
                        {/* Image */}
                        <div className="relative h-48 bg-gray-200">
                          {l.images && l.images[0] ? (
                            <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              Sin Imagen
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <input 
                              type="checkbox" 
                              checked={!!selected[l.id]} 
                              onChange={() => toggleOne(l.id)} 
                              className="h-5 w-5 bg-white rounded shadow-lg" 
                              aria-label={`Seleccionar propiedad ${l.title || l.id}`}
                            />
                          </div>
                          <div className="absolute top-2 right-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-lg ${
                              l.status === 'active' ? 'bg-green-500 text-white' :
                              l.status === 'pending' ? 'bg-yellow-500 text-white' :
                              l.status === 'sold' ? 'bg-blue-500 text-white' :
                              'bg-red-500 text-white'
                            }`}>
                              {l.status === 'active' ? '✓ Activa' : l.status === 'pending' ? '⏳ Pendiente' : l.status === 'sold' ? '🏆 Vendida' : '❌ Rechazada'}
                            </span>
                          </div>
                        </div>
                        {/* Content */}
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{l.title}</h3>
                          <div className="text-sm text-gray-600 space-y-1 mb-3">
                            <div className="flex items-center gap-1"><FiMapPin className="text-gray-400" /> {l.city || l.location || 'N/A'}</div>
                            <div className="flex items-center gap-1"><FiDollarSign className="text-gray-400" /> <span className="font-bold text-[#00A676]">${l.price.toLocaleString()}</span></div>
                            {(l.bedrooms || l.bathrooms || l.area) && (
                              <div className="flex gap-3 text-xs">
                                {l.bedrooms && <span>🛏️ {l.bedrooms}</span>}
                                {l.bathrooms && <span>🛁 {l.bathrooms}</span>}
                                {l.area && <span>📐 {l.area}m²</span>}
                              </div>
                            )}
                          </div>
                          <div className="mt-auto flex gap-2">
                            {l.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => approve(l.id)}
                                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-[#00A676] text-white rounded-lg hover:bg-[#008F64] text-sm font-medium"
                                >
                                  <FiCheck /> Aprobar
                                </button>
                                <button 
                                  onClick={() => reject(l.id)}
                                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                                >
                                  <FiX /> Rechazar
                                </button>
                              </>
                            )}
                            <a
                              href={`/listing/${l.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm ${l.status === 'pending' ? '' : 'flex-1'}`}
                            >
                              <FiEye /> Ver
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // List View
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Checkbox + Image */}
                          <div className="flex flex-col items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={!!selected[l.id]} 
                              onChange={() => toggleOne(l.id)} 
                              className="h-5 w-5" 
                              aria-label={`Seleccionar propiedad ${l.title || l.id}`}
                            />
                            {l.images && l.images[0] ? (
                              <img src={l.images[0]} alt={l.title} className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200" />
                            ) : (
                              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                Sin Imagen
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-xl font-semibold text-gray-900">{l.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                l.status === 'active' ? 'bg-green-100 text-green-800' :
                                l.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                l.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {l.status === 'active' ? '✓ Activa' : l.status === 'pending' ? '⏳ Pendiente' : l.status === 'sold' ? '🏆 Vendida' : '❌ Rechazada'}
                              </span>
                              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700" title="Puntuación de calidad">
                                QS: {computeQualityScore(l as any).toFixed(2)}
                              </span>
                            </div>
                            <div className="text-gray-600 space-y-1 mb-3">
                              <div className="flex items-center gap-2"><FiMapPin /> {l.location || l.city || 'N/A'}</div>
                              <div className="flex items-center gap-2"><FiDollarSign /> <span className="font-bold text-[#00A676] text-lg">USD {l.price.toLocaleString()}</span></div>
                              {(l.bedrooms || l.bathrooms || l.area) && (
                                <div className="flex gap-4 text-sm">
                                  {l.bedrooms && <span>🛏️ {l.bedrooms} hab.</span>}
                                  {l.bathrooms && <span>🛁 {l.bathrooms} baños</span>}
                                  {l.area && <span>📐 {l.area} m²</span>}
                                  {l.propertyType && <span className="text-gray-500">• {l.propertyType}</span>}
                                </div>
                              )}
                              {l.agentName && (
                                <div className="text-sm text-gray-500">
                                  Agente: <span className="text-blue-600 font-medium">{l.agentName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            {l.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => approve(l.id)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] transition-colors whitespace-nowrap"
                                >
                                  <FiCheck /> Aprobar
                                </button>
                                <button 
                                  onClick={() => reject(l.id)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors whitespace-nowrap"
                                >
                                  <FiX /> Rechazar
                                </button>
                              </>
                            )}
                            <div className="flex gap-2">
                              <a
                                href={`/listing/${l.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
                              >
                                <FiEye /> Ver
                              </a>
                              <button 
                                onClick={() => deleteListing(l.id)}
                                className="inline-flex items-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                                title="Eliminar"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}
