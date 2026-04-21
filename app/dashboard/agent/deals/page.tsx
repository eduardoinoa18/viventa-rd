'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiClock, FiDollarSign, FiTrendingUp } from 'react-icons/fi'

type DealItem = {
  id: string
  clientName: string
  clientEmail?: string
  propertyAddress?: string
  salePrice: number
  currency?: string
  stage: string
  commission?: number
  commissionStatus?: 'pending' | 'paid'
  createdAt?: string
  updatedAt?: string
}

type DealsSummary = {
  total: number
  active: number
  completed: number
  pipeline: number
  commission: number
}

const DEAL_STAGES = ['lead', 'showing', 'offer', 'reservation', 'contract', 'closing', 'completed', 'cancelled']

export default function AgentDealsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deals, setDeals] = useState<DealItem[]>([])
  const [summary, setSummary] = useState<DealsSummary>({
    total: 0,
    active: 0,
    completed: 0,
    pipeline: 0,
    commission: 0,
  })
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()
        if (statusFilter && statusFilter !== 'all') params.set('stage', statusFilter)
        if (searchInput.trim()) params.set('q', searchInput.trim())

        const url = `/api/agent/deals${params.toString() ? `?${params.toString()}` : ''}`
        const res = await fetch(url, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))

        if (!active) return

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || 'No se pudieron cargar los negocios')
        }

        const nextDeals = Array.isArray(json?.deals) ? json.deals : []
        setDeals(nextDeals)
        setSummary({
          total: Number(json?.summary?.total || 0),
          active: Number(json?.summary?.active || 0),
          completed: Number(json?.summary?.completed || 0),
          pipeline: Number(json?.summary?.pipeline || 0),
          commission: Number(json?.summary?.commission || 0),
        })
      } catch (loadError: any) {
        if (!active) return
        setError(loadError?.message || 'No se pudieron cargar los negocios')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [statusFilter, searchInput])

  const filteredDeals = useMemo(() => deals, [deals])

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-[#0B2545]">Mis Negocios</h2>
          <p className="mt-1 text-sm text-gray-600">Seguimiento de tus deals desde lead hasta cierre de transacción.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          icon={<FiTrendingUp className="text-xl" />}
          label="Total"
          value={summary.total}
          color="from-blue-500 to-blue-600"
        />
        <SummaryCard
          icon={<FiClock className="text-xl" />}
          label="Activos"
          value={summary.active}
          color="from-amber-500 to-amber-600"
        />
        <SummaryCard
          icon={<FiCheckCircle className="text-xl" />}
          label="Completados"
          value={summary.completed}
          color="from-emerald-500 to-emerald-600"
        />
        <SummaryCard
          icon={<FiDollarSign className="text-xl" />}
          label="Pipeline"
          value={`$${(summary.pipeline / 1000).toFixed(0)}K`}
          color="from-purple-500 to-purple-600"
        />
        <SummaryCard
          icon={<FiAlertCircle className="text-xl" />}
          label="Comisiones"
          value={`$${(summary.commission / 1000).toFixed(0)}K`}
          color="from-pink-500 to-pink-600"
        />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por cliente o propiedad..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          aria-label="Buscar negocios"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          aria-label="Filtrar por etapa"
        >
          <option value="all">Todas las etapas</option>
          {DEAL_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage.charAt(0).toUpperCase() + stage.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">Cargando negocios...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-600">No hay negocios para mostrar</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Cliente</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Propiedad</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Precio</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Etapa</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Comisión</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal) => (
                <tr key={deal.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2">{deal.clientName}</td>
                  <td className="px-3 py-2 text-gray-600">{deal.propertyAddress || 'N/A'}</td>
                  <td className="px-3 py-2 text-right font-medium">
                    {new Intl.NumberFormat('es-DO', {
                      style: 'currency',
                      currency: deal.currency || 'USD',
                      maximumFractionDigits: 0,
                    }).format(deal.salePrice)}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {deal.stage}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {deal.commission ? (
                      <span className={deal.commissionStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'}>
                        ${deal.commission.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className={`rounded-lg bg-gradient-to-br ${color} p-3 text-white shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-90">{label}</p>
          <p className="mt-1 text-lg font-bold">{value}</p>
        </div>
        <div className="opacity-50">{icon}</div>
      </div>
    </div>
  )
}
