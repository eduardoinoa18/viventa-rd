'use client'

import { useEffect, useState } from 'react'

type ActivityItem = {
  id: string
  type?: string
  entityType?: string
  entityId?: string
  createdAt?: string
  metadata?: Record<string, unknown>
}

function formatDate(value: string | undefined) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return '—'
  return parsed.toLocaleString('es-DO', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ConstructoraActivityPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [events, setEvents] = useState<ActivityItem[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        setError('')
        const res = await fetch('/api/activity-events?workspace=constructora&limit=60', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!mounted) return
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || 'No se pudo cargar actividad')
        }
        setEvents(Array.isArray(json?.events) ? json.events : [])
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'No se pudo cargar actividad')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-[#0B2545]">Activity</h2>
      <p className="mt-1 text-sm text-gray-600">Eventos recientes de deals, reservas y documentos de la constructora.</p>

      {loading ? <p className="mt-4 text-sm text-gray-500">Cargando actividad...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {!loading && !error && (
        <div className="mt-4 space-y-2">
          {events.map((event) => (
            <article key={event.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#0B2545]">{event.type || 'activity'}</p>
                <p className="text-xs text-gray-500">{formatDate(event.createdAt)}</p>
              </div>
              <p className="mt-1 text-xs text-gray-600">{event.entityType || 'entity'} · {event.entityId || 'n/a'}</p>
            </article>
          ))}
          {!events.length ? <p className="text-sm text-gray-500">No hay actividad reciente.</p> : null}
        </div>
      )}
    </section>
  )
}