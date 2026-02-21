'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { FiPlusSquare } from 'react-icons/fi'
import toast from 'react-hot-toast'
import type { Listing } from '@/types/listing'
import { normalizeListingStatus, mapUIFilterToDB } from '@/lib/listingStatus'

// Decomposed components
import ListingStats from './components/ListingStats'
import ListingFilters from './components/ListingFilters'
import BulkActions from './components/BulkActions'
import ListingTable from './components/ListingTable'

export default function MasterListingsPage() {
  // State
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  // Filtered listings based on search
  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings
    const query = searchQuery.toLowerCase()
    return listings.filter(
      (l) =>
        l.title?.toLowerCase().includes(query) ||
        l.city?.toLowerCase().includes(query) ||
        l.sector?.toLowerCase().includes(query)
    )
  }, [listings, searchQuery])

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
  }, [statusFilter])

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
      const res = await fetch('/api/admin/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'active' }),
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

  // API: Reject listing
  async function reject(id: string) {
    try {
      const res = await fetch('/api/admin/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' }),
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

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#0B2545]">Gestión de Propiedades</h1>
              <p className="text-gray-600 mt-1">Administra y aprueba publicaciones de propiedades</p>
            </div>
            <Link
              href="/master/listings/create"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#FF6B35] text-white rounded-lg font-semibold hover:bg-[#E55A2B] shadow-lg shadow-[#FF6B35]/30 transition-all"
            >
              <FiPlusSquare /> Nueva Propiedad
            </Link>
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

        {/* Filters & Search */}
        <div className="mb-4">
          <ListingFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

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
