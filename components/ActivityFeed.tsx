'use client'

import Link from 'next/link'
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
    const obj = value as { toDate?: unknown }
    if (typeof obj.toDate === 'function') {
      const date = (obj.toDate as () => unknown)()
      if (date instanceof Date) return date.toLocaleString('es-DO')
    }
  }
  return '—'
}

interface ActivityFeedProps {
  title: string
  description: string
  limit?: number
  markSeen?: boolean
}

export default function ActivityFeed({
  title,
  description,
  limit = 120,
  markSeen = true,
}: ActivityFeedProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [events, setEvents] = useState<EventItem[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  async function loadEvents() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`/api/activity-events?limit=${limit}`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo cargar actividad')
      setEvents(Array.isArray(json?.events) ? json.events : [])
    } catch (loadError: unknown) {
      const msg = loadError instanceof Error ? loadError.message : 'No se pudo cargar actividad'
      setError(msg)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  async function markActivitySeen() {
    if (!markSeen) return
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const eventTypes = useMemo(() => {
    const set = new Set<string>()
    for (const event of events) {
      const type = safeText(event.type)
      if (type) set.add(type)
    }
    return Array.from(set).sort()
  }, [events])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return events.filter((event) => {
      if (typeFilter !== 'all' && safeText(event.type) !== typeFilter) return false
      if (!q) return true
      return (
        safeText(event.type).toLowerCase().includes(q) ||
        safeText(event.entityType).toLowerCase().includes(q) ||
        safeText(event.entityId).toLowerCase().includes(q) ||
        safeText(event.actorRole).toLowerCase().includes(q) ||
        safeText(event.dealId).toLowerCase().includes(q)
      )
    })
  }, [events, search, typeFilter])

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#0B2545]">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-600">{description}</p>
        </div>
        <button
          onClick={loadEvents}
          className="self-start rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 sm:self-auto"
        >
          Refrescar
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por tipo, entidad, deal o rol"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          title="Filtrar por tipo de evento"
        >
          <option value="all">Todos los tipos</option>
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <div className="flex items-center text-xs text-gray-400">
          {loading ? 'Cargando...' : `${filtered.length} de ${events.length} eventos`}
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-3 space-y-2">
        {filtered.map((event) => (
          <article key={event.id} className="rounded-xl border border-gray-200 p-3 transition-colors hover:border-gray-300 hover:bg-gray-50">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                {event.url ? (
                  <Link
                    href={event.url}
                    className="text-sm font-semibold text-[#0B2545] hover:text-[#00A676] hover:underline"
                  >
                    {event.type}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-[#0B2545]">{event.type}</span>
                )}
                <p className="mt-0.5 text-xs text-gray-600">
                  {safeText(event.entityType) || 'entity'} &middot;{' '}
                  <span className="font-mono">{safeText(event.entityId) || 'n/a'}</span>
                </p>
                {(event.actorRole || event.dealId) && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {event.actorRole ? `Actor: ${event.actorRole}` : ''}
                    {event.actorRole && event.dealId ? ' · ' : ''}
                    {event.dealId ? `Deal: ${safeText(event.dealId).slice(0, 12)}` : ''}
                  </p>
                )}
              </div>
              <time className="shrink-0 text-xs text-gray-400">
                {formatTimestamp(event.createdAt)}
              </time>
            </div>
            {event.metadata && Object.keys(event.metadata).length > 0 ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] text-gray-400 hover:text-gray-600">
                  Ver metadata
                </summary>
                <pre className="mt-1 whitespace-pre-wrap text-[11px] text-gray-600">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </details>
            ) : null}
          </article>
        ))}
        {!loading && !error && !filtered.length ? (
          <p className="py-4 text-center text-sm text-gray-500">No hay eventos para mostrar.</p>
        ) : null}
        {loading && !events.length ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
