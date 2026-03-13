'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { FiPlusSquare, FiClock, FiCheckCircle, FiXCircle, FiRefreshCw, FiAlertTriangle, FiEye } from 'react-icons/fi'
import toast from 'react-hot-toast'
import type { Listing } from '@/types/listing'
import { normalizeListingStatus, mapUIFilterToDB } from '@/lib/listingStatus'

// Decomposed components
import ListingStats from './components/ListingStats'
import ListingFilters from './components/ListingFilters'
import BulkActions from './components/BulkActions'
import ListingTable from './components/ListingTable'

type PendingItem = {
  id: string
  listingId: string
  title: string
  city: string
  sector: string
  propertyType: string
  price: number
  currency: string
  images: string[]
  qualityScore: number
  submittedAt: string | null
  submissionNote: string
  approvalNotes: string
  brokerName: string
  constructora: string
  agentId: string
  updatedAt: string | null
}

export default function MasterListingsPage() {
  // State
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [intelligencePreset, setIntelligencePreset] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  // Pending approval queue
  const [pending, setPending]       = useState<PendingItem[]>([])
  const [pendingLoading, setPendingLoading] = useState(true)
  const [reviewId, setReviewId]     = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewing, setReviewing]   = useState(false)

  // Filtered listings based on search
  const filteredListings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return listings.filter((l) => {
      const matchesSearch = !query ||
        l.title?.toLowerCase().includes(query) ||
        l.city?.toLowerCase().includes(query) ||
        l.sector?.toLowerCase().includes(query)

      if (!matchesSearch) return false

      if (intelligencePreset === 'pending_verification') return !Boolean(l.isVerified)
      if (intelligencePreset === 'missing_photos') return Boolean(l.missingPhotos)
      if (intelligencePreset === 'price_anomaly') return (l.anomalyFlags || []).includes('price_anomaly')
      if (intelligencePreset === 'no_assigned_broker') return !Boolean(l.hasAssignedBroker)
      if (intelligencePreset === 'duplicate_risk') return Boolean(l.duplicateRisk)

      return true
    })
  }, [listings, searchQuery, intelligencePreset])

  const allSelected = filteredListings.length > 0 && filteredListings.every((l) => selected[l.id])

  // Stats - using UI-level status normalization
  const stats = useMemo(() => {
    const published = listings.filter((l) => normalizeListingStatus(l) === 'published').length
    const draft = listings.filter((l) => normalizeListingStatus(l) === 'draft').length
    const archived = listings.filter((l) => normalizeListingStatus(l) === 'archived').length

    return {
      total: listings.length,
      published,
      draft,
      archived,
    }
  }, [listings])

  // Load listings on mount and when filter changes
  useEffect(() => {
    load()
    loadPending()
  }, [statusFilter])

  async function loadPending() {
    setPendingLoading(true)
    try {
      const res = await fetch('/api/listings/review?status=pending&limit=50')
      const json = await res.json()
      if (res.ok && json.ok) setPending(json.items || [])
    } catch { /* noop */ }
    setPendingLoading(false)
  }

  async function reviewListing(id: string, action: 'approve' | 'reject' | 'revision') {
    setReviewing(true)
    try {
      const res = await fetch('/api/listings/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id, action, note: reviewNote }),
      })
      const json = await res.json()
      if (res.ok && json.ok) {
        const msg = action === 'approve' ? '✅ Listado aprobado y publicado.' : action === 'reject' ? '❌ Listado rechazado.' : '🔄 Revisión solicitada al profesional.'
        toast.success(msg)
        setReviewId(null)
        setReviewNote('')
        await loadPending()
        load()
      } else {
        toast.error(json.error || 'Error en revisión')
      }
    } catch { toast.error('Error de red') }
    setReviewing(false)
  }

  const getUiErrorMessage = (status?: number) => {
    if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente para gestionar propiedades.'
    if (status === 403) return 'No tienes permisos para gestionar propiedades en el panel maestro.'
    return 'No se pudieron cargar las propiedades del panel maestro.'
  }

  // API: Load listings
  async function load() {
    setLoading(true)
    setError(null)
    try {
      // Map UI filter to database status
      const dbStatus = mapUIFilterToDB(statusFilter)
      const url = dbStatus ? `/api/admin/properties?status=${dbStatus}` : '/api/admin/properties'

      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok || !json.ok) {
        const message = json?.error || getUiErrorMessage(res.status)
        setError(message)
        toast.error(message)
        setListings([])
        return
      }
      setListings(json.data || [])
    } catch (e) {
      console.error('Failed to load properties', e)
      const message = getUiErrorMessage()
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // API: Approve listing
  async function approve(id: string) {
    try {
      const res = await fetch('/api/listings/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id, action: 'approve', note: '' }),
      })
      const json = await res.json()
      if (res.ok && json.ok) { toast.success('Listado aprobado'); load(); loadPending() }
      else toast.error(json.error || 'Error al aprobar')
    } catch (e) {
      console.error('Failed to approve property', e)
      toast.error('Failed to approve property')
    }
  }

  // API: Reject listing
  async function reject(id: string) {
    try {
      const res = await fetch('/api/listings/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id, action: 'reject', note: '' }),
      })
      const json = await res.json()
      if (res.ok && json.ok) { toast.success('Listado rechazado'); load(); loadPending() }
      else toast.error(json.error || 'Error al rechazar')
    } catch (e) {
      console.error('Failed to reject property', e)
      toast.error('Failed to reject property')
    }
  }

  // API: Delete listing
  async function deleteListing(id: string) {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return
    try {
      const res = await fetch('/api/admin/properties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
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

  // API: Bulk update
  async function bulkUpdate(nextStatus: 'active' | 'rejected') {
    const ids = listings.filter((l) => selected[l.id]).map((l) => l.id)
    if (ids.length === 0) {
      toast('Select at least one listing')
      return
    }
    try {
      const res = await fetch('/api/admin/properties/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: nextStatus }),
      })
      const json = await res.json()
      if (res.ok && json.ok) {
        toast.success(`Updated ${ids.length} listings`)
        // Instant UI refresh without full reload
        setListings((prev) => prev.map((l) => (selected[l.id] ? { ...l, status: nextStatus } : l)))
        setSelected({})
      } else {
        toast.error(json.error || 'Bulk update failed')
      }
    } catch (e) {
      console.error('Bulk update error', e)
      toast.error('Bulk update failed')
    }
  }

  // Selection handlers
  function toggleAll() {
    if (allSelected) {
      setSelected({})
    } else {
      const next: Record<string, boolean> = {}
      filteredListings.forEach((l) => {
        next[l.id] = true
      })
      setSelected(next)
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const selectedCount = Object.values(selected).filter(Boolean).length
  const hasActiveFilters = statusFilter !== 'all' || intelligencePreset !== 'all' || searchQuery.trim().length > 0

  function clearFilters() {
    setStatusFilter('all')
    setIntelligencePreset('all')
    setSearchQuery('')
  }

  return (
    <main className="p-3 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0B2545]">Gestión de Propiedades</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Administra y aprueba publicaciones de propiedades</p>
            </div>
            <Link
              href="/master/listings/create"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6B35] text-white rounded-lg font-semibold hover:bg-[#E55A2B] shadow-lg shadow-[#FF6B35]/30 transition-all w-full sm:w-auto"
            >
              <FiPlusSquare /> Nueva Propiedad
            </Link>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <Link href="/master/leads" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Leads</Link>
            <Link href="/master/applications" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Applications</Link>
            <Link href="/master/users" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">People</Link>
            <Link href="/master/inbox" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Inbox</Link>
            <Link href="/master/settings" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Settings</Link>
          </div>

          {/* Stats Cards */}
          <div className="mb-6">
            <ListingStats
              total={stats.total}
              published={stats.published}
              draft={stats.draft}
              archived={stats.archived}
            />
          </div>
        </div>

        {/* ─── PENDING APPROVAL QUEUE ─────────────────────────────────────── */}
        {(pending.length > 0 || pendingLoading) && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FiClock className="text-amber-500" />
                <h2 className="text-lg font-bold text-gray-900">Cola de Aprobación</h2>
                {pending.length > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
                )}
              </div>
              <button onClick={loadPending} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <FiRefreshCw className="w-3 h-3" /> Actualizar
              </button>
            </div>

            {pendingLoading ? (
              <div className="bg-white border border-amber-100 rounded-2xl p-6 text-center text-gray-400 text-sm">Cargando cola pendiente...</div>
            ) : (
              <div className="bg-white border border-amber-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-100">
                  {pending.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-amber-50 transition-colors">
                      <div className="flex gap-4 items-start">
                        {/* Thumbnail */}
                        <div className="w-20 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🏠</div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{item.title}</h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {item.city}{item.sector ? ` · ${item.sector}` : ''} &middot; {item.propertyType}
                                {item.brokerName && <> &middot; <span className="font-medium">{item.brokerName}</span></>}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-blue-700">
                                {item.currency === 'DOP' ? `RD$` : `$`}{item.price.toLocaleString()}
                              </p>
                              {item.qualityScore > 0 && (
                                <p className="text-xs text-gray-400">QS: {item.qualityScore}</p>
                              )}
                            </div>
                          </div>

                          {item.submissionNote && (
                            <p className="mt-1.5 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 italic">
                              &quot;{item.submissionNote}&quot;
                            </p>
                          )}

                          {/* Review panel (expanded) */}
                          {reviewId === item.id ? (
                            <div className="mt-3 bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                              <textarea
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                                placeholder="Nota para el profesional (opcional)..."
                                rows={2}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                              />
                              <div className="flex gap-2 flex-wrap">
                                <button
                                  onClick={() => reviewListing(item.id, 'approve')}
                                  disabled={reviewing}
                                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <FiCheckCircle className="w-3.5 h-3.5" /> Aprobar
                                </button>
                                <button
                                  onClick={() => reviewListing(item.id, 'reject')}
                                  disabled={reviewing}
                                  className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <FiXCircle className="w-3.5 h-3.5" /> Rechazar
                                </button>
                                <button
                                  onClick={() => reviewListing(item.id, 'revision')}
                                  disabled={reviewing}
                                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <FiRefreshCw className="w-3.5 h-3.5" /> Solicitar Revisión
                                </button>
                                <button
                                  onClick={() => { setReviewId(null); setReviewNote('') }}
                                  className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1.5"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => { setReviewId(item.id); setReviewNote('') }}
                                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <FiEye className="w-3.5 h-3.5" /> Revisar
                              </button>
                              <button
                                onClick={() => reviewListing(item.id, 'approve')}
                                className="flex items-center gap-1 border border-emerald-400 text-emerald-600 hover:bg-emerald-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <FiCheckCircle className="w-3.5 h-3.5" /> Aprobar
                              </button>
                              <button
                                onClick={() => reviewListing(item.id, 'reject')}
                                className="flex items-center gap-1 border border-red-300 text-red-500 hover:bg-red-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <FiXCircle className="w-3.5 h-3.5" /> Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Filters & Search */}
        <div className="mb-4">
          <ListingFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            intelligencePreset={intelligencePreset}
            onIntelligencePresetChange={setIntelligencePreset}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {hasActiveFilters && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Active filters</span>
              {statusFilter !== 'all' && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">Status: {statusFilter}</span>}
              {intelligencePreset !== 'all' && <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">Preset: {intelligencePreset.replace(/_/g, ' ')}</span>}
              {searchQuery.trim() && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">Search: “{searchQuery.trim()}”</span>}
              <button
                onClick={clearFilters}
                className="ml-auto inline-flex items-center rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                title="Clear all filters"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Bulk Actions Toolbar */}
        <div className="mb-4">
          <BulkActions
            selectedCount={selectedCount}
            allSelected={allSelected}
            onToggleAll={toggleAll}
            onBulkApprove={() => bulkUpdate('active')}
            onBulkReject={() => bulkUpdate('rejected')}
          />
        </div>

        {error && !loading && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        {/* Listings Table */}
        <ListingTable
          listings={filteredListings}
          loading={loading}
          viewMode={viewMode}
          selected={selected}
          searchQuery={searchQuery}
          onToggleOne={toggleOne}
          onApprove={approve}
          onReject={reject}
          onDelete={deleteListing}
        />

      </div>
    </main>
  )
}
