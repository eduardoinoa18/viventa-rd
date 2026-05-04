'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FiActivity, FiRefreshCw, FiSearch } from 'react-icons/fi'
import type { ActivityEventRecord } from '@/lib/domain/activity'

type ActivityItem = ActivityEventRecord

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function formatTimestamp(value: unknown): string {
  if (!value) return '—'
  if (value instanceof Date) return value.toLocaleString('es-DO')
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isFinite(parsed.getTime()) ? parsed.toLocaleString('es-DO') : '—'
  }
  if (typeof value === 'object') {
    const seconds = (value as { seconds?: unknown }).seconds
    if (typeof seconds === 'number') return new Date(seconds * 1000).toLocaleString('es-DO')
    const toDate = (value as { toDate?: unknown }).toDate
    if (typeof toDate === 'function') {
      const date = toDate.call(value)
      if (date instanceof Date) return date.toLocaleString('es-DO')
    }
  }
  return '—'
}

export default function MasterActivityPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [events, setEvents] = useState<ActivityItem[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [entityTypeFilter, setEntityTypeFilter] = useState('all')

  async function loadEvents() {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({ limit: '300' })
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (entityTypeFilter !== 'all') params.set('entityType', entityTypeFilter)

      const res = await fetch(`/api/activity-events?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo cargar actividad')
      setEvents(Array.isArray(json?.events) ? json.events : [])
    } catch (loadError: any) {
      setError(loadError?.message || 'No se pudo cargar actividad')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  async function markActivitySeen() {
    try {
      await fetch('/api/activity-events/summary', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markSeen' }),
      })
    } catch {}
  }

  useEffect(() => {
    markActivitySeen()
  }, [])

  useEffect(() => {
    loadEvents()
  }, [typeFilter, entityTypeFilter])

  const typeOptions = useMemo(() => {
    const set = new Set<string>()
    for (const event of events) {
      const type = safeText(event.type)
      if (type) set.add(type)
    }
    return Array.from(set).sort()
  }, [events])

  const entityTypeOptions = useMemo(() => {
    const set = new Set<string>()
    for (const event of events) {
      const type = safeText(event.entityType)
      if (type) set.add(type)
    }
    return Array.from(set).sort()
  }, [events])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return events
    return events.filter((event) => (
      safeText(event.type).toLowerCase().includes(q) ||
      safeText(event.entityType).toLowerCase().includes(q) ||
      safeText(event.entityId).toLowerCase().includes(q) ||
      safeText(event.actorRole).toLowerCase().includes(q) ||
      safeText(event.actorId).toLowerCase().includes(q) ||
      safeText(event.dealId).toLowerCase().includes(q)
    ))
  }, [events, search])

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0B2545] flex items-center gap-3">
              <FiActivity /> Platform Activity Feed
            </h1>
            <p className="text-gray-600 mt-1">Global event stream for listings, leads, deals, docs, transactions and commissions.</p>
          </div>
          <button
            onClick={loadEvents}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 text-sm"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <FiSearch className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por tipo, actor, entidad, negocio..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[280px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              aria-label="Filter event type"
            >
              <option value="all">All Event Types</option>
              {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>

            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              aria-label="Filter entity type"
            >
              <option value="all">Todas las entidades</option>
              {entityTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-3">Timestamp</th>
                  <th className="text-left p-3">Event</th>
                  <th className="text-left p-3">Actor</th>
                  <th className="text-left p-3">Entity</th>
                  <th className="text-left p-3">Deal</th>
                  <th className="text-left p-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="p-5 text-center text-gray-500">Cargando eventos de actividad...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-5 text-center text-gray-500">Sin actividad encontrada</td></tr>
                ) : (
                  filtered.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 align-top">
                      <td className="p-3 text-xs text-gray-600">{formatTimestamp(event.createdAt)}</td>
                      <td className="p-3">
                        {event.url ? (
                          <Link href={event.url} className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200">
                            {event.type}
                          </Link>
                        ) : (
                          <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">{event.type}</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-gray-700">
                        <div>{safeText(event.actorRole) || 'system'}</div>
                        <div className="text-gray-500 font-mono break-all">{safeText(event.actorId) || '—'}</div>
                      </td>
                      <td className="p-3 text-xs text-gray-700">
                        <div>{safeText(event.entityType) || '—'}</div>
                        <div className="text-gray-500 font-mono break-all">{safeText(event.entityId) || '—'}</div>
                      </td>
                      <td className="p-3 text-xs text-gray-700 font-mono break-all">{safeText(event.dealId) || '—'}</td>
                      <td className="p-3 text-[11px] text-gray-600 max-w-[360px]">
                        {event.metadata && Object.keys(event.metadata).length
                          ? <pre className="whitespace-pre-wrap">{JSON.stringify(event.metadata, null, 2)}</pre>
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  )
}
