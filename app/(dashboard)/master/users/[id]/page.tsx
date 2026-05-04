'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiBarChart2, FiClock, FiMail, FiPhone, FiTarget, FiUser } from 'react-icons/fi'

type LeadItem = {
  id: string
  status: string
  type: string
  source: string
  buyerName: string
  buyerEmail: string
  createdAt: string | null
}

type ActivityItem = {
  id: string
  source?: 'activity_logs' | 'analytics_events'
  eventType?: string
  type: string
  action: string
  timestamp: string | null
  metadata?: Record<string, unknown>
}

type ActivityTimelineResponse = {
  data: ActivityItem[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

type PerformanceResponse = {
  profile: {
    id: string
    name: string
    email: string
    phone: string
    role: string
    status: string
    brokerage: string
    brokerageId: string
    createdAt: string | null
    lastLoginAt: string | null
  }
  kpis: {
    leadStats: {
      assigned: number
      won: number
      lost: number
      contacted: number
      unassigned: number
    }
    listingStats: {
      total: number
      active: number
      sold: number
      pending: number
    }
    buyerLeadsCount: number
    conversionRate: number
    invite: {
      status: string
      used: boolean
      expiresAt: string | null
      createdAt: string | null
    } | null
    teamStats: {
      teamAgents: number
    } | null
  }
  recent: {
    leads: LeadItem[]
    activity: ActivityItem[]
  }
  access: {
    viewerRole: string
    scopedByBrokerage: boolean
  }
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return '—'
  return dt.toLocaleString()
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string | number
  subtitle?: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-[#0B2545]">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
    </div>
  )
}

export default function MasterUserDetailPage() {
  const params = useParams()
  const userId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PerformanceResponse | null>(null)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineError, setTimelineError] = useState<string | null>(null)
  const [timelineItems, setTimelineItems] = useState<ActivityItem[]>([])
  const [timelinePage, setTimelinePage] = useState(1)
  const [timelineHasMore, setTimelineHasMore] = useState(false)
  const [timelineTotal, setTimelineTotal] = useState(0)
  const [timelineEventType, setTimelineEventType] = useState('all')

  const timelinePageSize = 12

  const loadDetails = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/admin/users/${userId}/performance`, {
        method: 'GET',
        cache: 'no-store',
      })

      const json = await res.json()
      if (!res.ok || !json.ok) {
        const message = json?.error || 'No se pudo cargar el rendimiento del usuario'
        setError(message)
        return
      }

      setData(json.data as PerformanceResponse)
    } catch (err) {
      console.error('user performance load error', err)
      setError('No se pudo cargar el rendimiento del usuario')
      toast.error('No se pudo cargar el rendimiento del usuario')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  const loadTimeline = useCallback(async () => {
    if (!userId) return

    try {
      setTimelineLoading(true)
      setTimelineError(null)

      const search = new URLSearchParams({
        page: String(timelinePage),
        limit: String(timelinePageSize),
      })
      if (timelineEventType && timelineEventType !== 'all') {
        search.set('eventType', timelineEventType)
      }

      const res = await fetch(`/api/admin/users/${userId}/activity?${search.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        const message = json?.error || 'No se pudo cargar el timeline de actividad'
        setTimelineError(message)
        setTimelineItems([])
        return
      }

      const payload = json as ActivityTimelineResponse
      setTimelineItems(Array.isArray(payload.data) ? payload.data : [])
      setTimelineHasMore(Boolean(payload.pagination?.hasMore))
      setTimelineTotal(Number(payload.pagination?.total || 0))
    } catch (err) {
      console.error('user activity timeline load error', err)
      setTimelineError('No se pudo cargar el timeline de actividad')
      setTimelineItems([])
    } finally {
      setTimelineLoading(false)
    }
  }, [timelineEventType, timelinePage, timelinePageSize, userId])

  useEffect(() => {
    loadTimeline()
  }, [loadTimeline])

  const timelineEventOptions = [
    { value: 'all', label: 'Todos los eventos' },
    { value: 'login', label: 'Inicio de sesión' },
    { value: 'property_view', label: 'Vista de propiedad' },
    { value: 'whatsapp_click', label: 'Clic en WhatsApp' },
    { value: 'lead_created', label: 'Lead creado' },
    { value: 'reservation_started', label: 'Reserva iniciada' },
    { value: 'reservation_completed', label: 'Reserva completada' },
  ]

  const headerSubtitle = useMemo(() => {
    if (!data) return ''
    const role = data.profile.role || 'user'
    const status = data.profile.status || 'unknown'
    return `${role} • ${status}`
  }, [data])

  return (
    <main className="flex-1 bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/master/users"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#0B2545] hover:bg-gray-100"
          >
            <FiArrowLeft /> Volver a usuarios
          </Link>
          <button
            onClick={loadDetails}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#0B2545] hover:bg-gray-100"
          >
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            Cargando rendimiento del usuario...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        ) : !data ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            Detalles del usuario no disponibles.
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-[#0B2545]">{data.profile.name || 'Unnamed user'}</h1>
                  <p className="mt-1 text-sm text-gray-600">{headerSubtitle}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600">
                  Viewer: {data.access.viewerRole}
                  {data.access.scopedByBrokerage ? ' (brokerage scoped)' : ''}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <div className="mb-1 inline-flex items-center gap-2 font-semibold text-gray-800">
                    <FiMail /> Email
                  </div>
                  <p className="break-all">{data.profile.email || '—'}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <div className="mb-1 inline-flex items-center gap-2 font-semibold text-gray-800">
                    <FiPhone /> Phone
                  </div>
                  <p>{data.profile.phone || '—'}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <div className="mb-1 inline-flex items-center gap-2 font-semibold text-gray-800">
                    <FiUser /> Brokerage
                  </div>
                  <p>{data.profile.brokerage || data.profile.brokerageId || '—'}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <div className="mb-1 inline-flex items-center gap-2 font-semibold text-gray-800">
                    <FiClock /> Last login
                  </div>
                  <p>{formatDate(data.profile.lastLoginAt)}</p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Leads Asignados" value={data.kpis.leadStats.assigned} subtitle={`Ganados ${data.kpis.leadStats.won} • Perdidos ${data.kpis.leadStats.lost}`} />
              <StatCard title="Tasa de conversión" value={`${data.kpis.conversionRate}%`} subtitle="Ganados / Asignados" />
              <StatCard title="Propiedades" value={data.kpis.listingStats.total} subtitle={`Activas ${data.kpis.listingStats.active} • Vendidas ${data.kpis.listingStats.sold}`} />
              <StatCard title="Leads de compradores" value={data.kpis.buyerLeadsCount} subtitle="Coincide por email del comprador" />
            </section>

            {data.kpis.teamStats ? (
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#0B2545]">Equipo del broker</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <StatCard title="Agentes del equipo" value={data.kpis.teamStats.teamAgents} />
                  <StatCard
                    title="Estado de invitación"
                    value={data.kpis.invite?.status || 'n/a'}
                    subtitle={data.kpis.invite?.expiresAt ? `Expires ${formatDate(data.kpis.invite.expiresAt)}` : 'No invite record'}
                  />
                </div>
              </section>
            ) : null}

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-semibold text-[#0B2545]">
                  <FiTarget /> Leads recientes
                </h2>
                {data.recent.leads.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay leads asignados a este usuario.</p>
                ) : (
                  <div className="space-y-3">
                    {data.recent.leads.map((lead) => (
                      <div key={lead.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                        <p className="font-semibold text-gray-800">{lead.buyerName || 'Unknown Buyer'}</p>
                        <p className="text-gray-600">{lead.buyerEmail || '—'}</p>
                        <p className="text-xs text-gray-500">
                          {lead.type || 'lead'} • {lead.source || 'source'} • {lead.status || 'status'} • {formatDate(lead.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-semibold text-[#0B2545]">
                  <FiBarChart2 /> Activity Trail
                </h2>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <select
                    value={timelineEventType}
                    onChange={(event) => {
                      setTimelineEventType(event.target.value)
                      setTimelinePage(1)
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                    aria-label="Filter activity by event type"
                  >
                    {timelineEventOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <span className="text-xs text-gray-500">Total events: {timelineTotal}</span>
                </div>

                {timelineLoading ? (
                  <p className="text-sm text-gray-500">Cargando historial de actividad...</p>
                ) : timelineError ? (
                  <p className="text-sm text-red-600">{timelineError}</p>
                ) : timelineItems.length === 0 ? (
                  <p className="text-sm text-gray-500">No activity events found for this user.</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {timelineItems.map((activity) => (
                        <div key={activity.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                          <p className="font-semibold text-gray-800">{activity.eventType || activity.action || 'event'}</p>
                          <p className="text-gray-600">{activity.action || activity.type || 'system'} • {activity.source || 'activity'}</p>
                          <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setTimelinePage((current) => Math.max(1, current - 1))}
                        disabled={timelinePage <= 1 || timelineLoading}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-gray-500">Page {timelinePage}</span>
                      <button
                        type="button"
                        onClick={() => setTimelinePage((current) => current + 1)}
                        disabled={!timelineHasMore || timelineLoading}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}