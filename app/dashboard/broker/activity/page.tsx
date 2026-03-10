'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ActivityEventRecord } from '@/lib/domain/activity'

type EventItem = ActivityEventRecord

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

export default function BrokerActivityPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [events, setEvents] = useState<EventItem[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  async function loadEvents() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/activity-events?limit=200', { cache: 'no-store' })
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
    loadEvents()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return events.filter((event) => {
      if (typeFilter !== 'all' && safeText(event.type) !== typeFilter) return false
      if (!q) return true
      return (
        safeText(event.type).toLowerCase().includes(q) ||
        safeText(event.entityType).toLowerCase().includes(q) ||
        safeText(event.entityId).toLowerCase().includes(q) ||
        safeText(event.actorRole).toLowerCase().includes(q)
      )
    })
  }, [events, search, typeFilter])

  const eventTypes = useMemo(() => {
    const set = new Set<string>()
    for (const event of events) {
      const type = safeText(event.type)
      if (type) set.add(type)
    }
    return Array.from(set).sort()
  }, [events])

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#0B2545]">Broker Activity Feed</h2>
          <p className="text-sm text-gray-600">Eventos operativos del office (deals, documentos, transacciones y comisiones).</p>
        </div>
        <button onClick={loadEvents} className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Refrescar</button>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por tipo, entidad o ID"
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white" title="Filtrar por tipo">
          <option value="all">Todos los tipos</option>
          {eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      {loading ? <p className="mt-3 text-sm text-gray-500">Cargando actividad...</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-3 space-y-2">
        {filtered.map((event) => (
          <div key={event.id} className="rounded-lg border border-gray-200 p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm font-semibold text-[#0B2545]">{event.type}</div>
              <div className="text-xs text-gray-500">{formatTimestamp(event.createdAt)}</div>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {event.entityType} · {event.entityId}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Actor: {safeText(event.actorRole) || 'system'} · Deal: {safeText(event.dealId) || '—'}
            </div>
            {event.metadata ? (
              <pre className="mt-2 text-[11px] text-gray-600 whitespace-pre-wrap">{JSON.stringify(event.metadata, null, 2)}</pre>
            ) : null}
          </div>
        ))}
        {!loading && !filtered.length ? <p className="text-sm text-gray-500">No hay eventos para mostrar.</p> : null}
      </div>
    </section>
  )
}
