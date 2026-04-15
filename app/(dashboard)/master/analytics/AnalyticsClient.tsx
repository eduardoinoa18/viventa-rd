'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  FiBarChart2,
  FiTrendingUp,
  FiUsers,
  FiHome,
  FiActivity,
  FiDownload,
  FiRefreshCw,
} from 'react-icons/fi'

type WindowKey = 'day' | 'week' | 'month'

type StatsPayload = {
  totalUsers: number
  activeListings: number
  pendingApprovals: number
  rejectedProperties?: number
  draftProperties?: number
  leads: number
  newUsers?: number
  newLeads?: number
  listingsCreated?: number
  roleCounts?: {
    agents: number
    brokers: number
    users: number
    admins: number
  }
  userEngagement?: {
    dau: number
    wau: number
    mau: number
    dauPercentage: string
    wauPercentage: string
    mauPercentage: string
  }
  conversionMetrics?: {
    totalViews: number
    totalContacts: number
    totalLeads: number
    viewToContactRate: string
    contactToLeadRate: string
    window?: {
      views: number
      contacts: number
      leads: number
      viewToContactRate: string
      contactToLeadRate: string
    }
  }
}

type AnalyticsState = {
  loading: boolean
  error: string | null
  data: StatsPayload | null
}

function uiErrorMessage(status?: number) {
  if (status === 401) return 'Tu sesion expiro. Inicia sesion para continuar.'
  if (status === 403) return 'No tienes permisos para acceder a analytics.'
  return 'No se pudieron cargar las metricas del panel analytics.'
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function parsePercent(value: string | undefined): number {
  if (!value) return 0
  return Number(value.replace('%', '')) || 0
}

function getWidthClass(value: number, max: number): string {
  const ratio = max > 0 ? value / max : 0
  if (ratio >= 0.95) return 'w-full'
  if (ratio >= 0.8) return 'w-4/5'
  if (ratio >= 0.66) return 'w-2/3'
  if (ratio >= 0.5) return 'w-1/2'
  if (ratio >= 0.33) return 'w-1/3'
  if (ratio >= 0.25) return 'w-1/4'
  if (ratio >= 0.2) return 'w-1/5'
  if (ratio >= 0.125) return 'w-1/6'
  return 'w-[8%]'
}

export default function AnalyticsClient() {
  const [timeWindow, setTimeWindow] = useState<WindowKey>('week')
  const [state, setState] = useState<AnalyticsState>({
    loading: true,
    error: null,
    data: null,
  })

  const loadStats = async (windowKey: WindowKey) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const res = await fetch(`/api/admin/stats?window=${windowKey}`, { cache: 'no-store' })
      const payload = await res.json().catch(() => ({}))

      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || uiErrorMessage(res.status))
      }

      setState({
        loading: false,
        error: null,
        data: payload.data as StatsPayload,
      })
    } catch (error: any) {
      setState({
        loading: false,
        error: error?.message || uiErrorMessage(),
        data: null,
      })
    }
  }

  useEffect(() => {
    loadStats(timeWindow)
  }, [timeWindow])

  const trend = useMemo(() => {
    const d = state.data
    if (!d) return []

    const users = toNumber(d.newUsers)
    const leads = toNumber(d.newLeads)
    const listings = toNumber(d.listingsCreated)
    const contacts = toNumber(d.conversionMetrics?.window?.contacts)
    const values = [users, leads, listings, contacts]
    const max = Math.max(...values, 1)

    return [
      { label: 'Usuarios', value: users, color: 'bg-[#0B2545]' },
      { label: 'Leads', value: leads, color: 'bg-[#00A676]' },
      { label: 'Listings', value: listings, color: 'bg-[#FF6B35]' },
      { label: 'Contactos', value: contacts, color: 'bg-[#1D4ED8]' },
    ].map((item) => ({
      ...item,
      widthClass: getWidthClass(item.value, max),
    }))
  }, [state.data])

  const adoptionScore = useMemo(() => {
    const d = state.data
    if (!d?.userEngagement) return 0

    const dau = parsePercent(d.userEngagement.dauPercentage)
    const wau = parsePercent(d.userEngagement.wauPercentage)
    const mau = parsePercent(d.userEngagement.mauPercentage)
    return Math.round((dau * 0.5 + wau * 0.3 + mau * 0.2) * 10) / 10
  }, [state.data])

  const exportCsv = () => {
    if (!state.data) return
    const d = state.data

    const rows = [
      ['metric', 'value'],
      ['window', timeWindow],
      ['totalUsers', String(toNumber(d.totalUsers))],
      ['activeListings', String(toNumber(d.activeListings))],
      ['pendingApprovals', String(toNumber(d.pendingApprovals))],
      ['rejectedProperties', String(toNumber(d.rejectedProperties))],
      ['draftProperties', String(toNumber(d.draftProperties))],
      ['leads', String(toNumber(d.leads))],
      ['newUsers', String(toNumber(d.newUsers))],
      ['newLeads', String(toNumber(d.newLeads))],
      ['listingsCreated', String(toNumber(d.listingsCreated))],
      ['viewToContactRate', d.conversionMetrics?.viewToContactRate || '0.00%'],
      ['contactToLeadRate', d.conversionMetrics?.contactToLeadRate || '0.00%'],
      ['adoptionScore', String(adoptionScore)],
    ]

    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `master-analytics-${timeWindow}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const data = state.data

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
                <FiBarChart2 className="text-[#0B2545]" />
                Platform Analytics
              </h1>
              <p className="mt-1 text-sm md:text-base text-slate-600">
                Vision operativa para adopcion, conversion y salud del marketplace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {([
                { key: 'day', label: 'Hoy' },
                { key: 'week', label: 'Semana' },
                { key: 'month', label: 'Mes' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTimeWindow(key)}
                  disabled={state.loading}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                    timeWindow === key
                      ? 'bg-[#0B2545] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => loadStats(timeWindow)}
                disabled={state.loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <FiRefreshCw className={state.loading ? 'animate-spin' : ''} />
                Actualizar
              </button>
              <button
                onClick={exportCsv}
                disabled={!data || state.loading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#00A676] px-3 py-2 text-sm font-semibold text-white hover:bg-[#008f64] disabled:opacity-50"
              >
                <FiDownload />
                Exportar CSV
              </button>
            </div>
          </div>
        </header>

        {state.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">Usuarios Totales</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{toNumber(data?.totalUsers).toLocaleString()}</div>
            <div className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1">
              <FiUsers /> +{toNumber(data?.newUsers).toLocaleString()} en ventana
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">Listings Activos</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{toNumber(data?.activeListings).toLocaleString()}</div>
            <div className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1">
              <FiHome /> +{toNumber(data?.listingsCreated).toLocaleString()} nuevos
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">Leads Totales</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{toNumber(data?.leads).toLocaleString()}</div>
            <div className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1">
              <FiTrendingUp /> +{toNumber(data?.newLeads).toLocaleString()} en ventana
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">Adoption Score</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{adoptionScore}%</div>
            <div className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1">
              <FiActivity /> Basado en DAU, WAU y MAU
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <article className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Pulso Operativo</h2>
            <p className="mt-1 text-sm text-slate-600">Resumen rapido de actividad dentro de la ventana seleccionada.</p>

            <div className="mt-4 space-y-3">
              {trend.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
                    <span>{item.label}</span>
                    <span>{item.value.toLocaleString()}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100">
                    <div className={`h-3 rounded-full ${item.color} ${item.widthClass}`} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Embudo de Conversion</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Vistas</span>
                <span className="font-semibold text-slate-900">
                  {toNumber(data?.conversionMetrics?.window?.views ?? data?.conversionMetrics?.totalViews).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Contactos</span>
                <span className="font-semibold text-slate-900">
                  {toNumber(data?.conversionMetrics?.window?.contacts ?? data?.conversionMetrics?.totalContacts).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Leads</span>
                <span className="font-semibold text-slate-900">
                  {toNumber(data?.conversionMetrics?.window?.leads ?? data?.conversionMetrics?.totalLeads).toLocaleString()}
                </span>
              </div>
              <hr className="my-2 border-slate-200" />
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Vista a Contacto</span>
                <span className="font-semibold text-[#0B2545]">
                  {data?.conversionMetrics?.window?.viewToContactRate || data?.conversionMetrics?.viewToContactRate || '0.00%'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Contacto a Lead</span>
                <span className="font-semibold text-[#0B2545]">
                  {data?.conversionMetrics?.window?.contactToLeadRate || data?.conversionMetrics?.contactToLeadRate || '0.00%'}
                </span>
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Mezcla de Roles</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Agentes</div>
              <div className="text-2xl font-bold text-slate-900">{toNumber(data?.roleCounts?.agents).toLocaleString()}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Brokers</div>
              <div className="text-2xl font-bold text-slate-900">{toNumber(data?.roleCounts?.brokers).toLocaleString()}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Usuarios</div>
              <div className="text-2xl font-bold text-slate-900">{toNumber(data?.roleCounts?.users).toLocaleString()}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Admins</div>
              <div className="text-2xl font-bold text-slate-900">{toNumber(data?.roleCounts?.admins).toLocaleString()}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}