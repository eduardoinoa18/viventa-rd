'use client'

import { useEffect, useState } from 'react'

type DealRow = {
  id: string
  clientName?: string
  stage?: string
  salePrice?: number
  currency?: 'USD' | 'DOP'
  agentCommission?: number
  commissionStatus?: 'pending' | 'paid'
  updatedAt?: string
  createdAt?: string
}

type CommissionSummary = {
  deals: number
  pendingCommission: number
  paidCommission: number
  paidThisYear: number
  projectedCommission: number
}

export default function AgentCommissionsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<CommissionSummary>({
    deals: 0,
    pendingCommission: 0,
    paidCommission: 0,
    paidThisYear: 0,
    projectedCommission: 0,
  })
  const [deals, setDeals] = useState<DealRow[]>([])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')

        const res = await fetch('/api/agent/commissions', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo cargar comisiones')

        if (!active) return
        setSummary({
          deals: Number(json?.summary?.deals || 0),
          pendingCommission: Number(json?.summary?.pendingCommission || 0),
          paidCommission: Number(json?.summary?.paidCommission || 0),
          paidThisYear: Number(json?.summary?.paidThisYear || 0),
          projectedCommission: Number(json?.summary?.projectedCommission || 0),
        })
        setDeals(Array.isArray(json?.deals) ? json.deals : [])
      } catch (loadError: any) {
        if (!active) return
        setError(loadError?.message || 'No se pudo cargar comisiones')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-[#0B2545]">Comisiones del agente</h2>
      {loading ? <p className="mt-2 text-sm text-gray-600">Cargando comisiones...</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
        <Metric label="Negocios" value={summary.deals} />
        <Metric label="Pendiente" value={currency(summary.pendingCommission)} />
        <Metric label="Pagado" value={currency(summary.paidCommission)} />
        <Metric label="Pagado año" value={currency(summary.paidThisYear)} />
        <Metric label="Proyección" value={currency(summary.projectedCommission)} />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-3 py-2">Cliente</th>
              <th className="text-left px-3 py-2">Etapa</th>
              <th className="text-left px-3 py-2">Venta</th>
              <th className="text-left px-3 py-2">Comisión</th>
              <th className="text-left px-3 py-2">Estado</th>
              <th className="text-left px-3 py-2">Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => (
              <tr key={deal.id} className="border-t border-gray-100">
                <td className="px-3 py-2 text-[#0B2545] font-medium">{deal.clientName || 'Cliente'}</td>
                <td className="px-3 py-2">{humanizeStage(deal.stage)}</td>
                <td className="px-3 py-2">{currency(Number(deal.salePrice || 0), deal.currency || 'USD')}</td>
                <td className="px-3 py-2">{currency(Number(deal.agentCommission || 0), deal.currency || 'USD')}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 rounded text-xs border ${deal.commissionStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {deal.commissionStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-600">{formatDate(deal.updatedAt || deal.createdAt)}</td>
              </tr>
            ))}
            {!deals.length ? (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={6}>No hay deals para mostrar.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-[#0B2545]">{value}</div>
    </div>
  )
}

function humanizeStage(stage?: string) {
  const key = String(stage || 'lead').toLowerCase()
  if (key === 'showing') return 'Visita'
  if (key === 'offer') return 'Oferta'
  if (key === 'reservation') return 'Reserva'
  if (key === 'contract') return 'Contrato'
  if (key === 'closing') return 'Cierre'
  if (key === 'completed') return 'Completado'
  return 'Lead'
}

function currency(value: number, currencyCode: 'USD' | 'DOP' = 'USD') {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(Number(value || 0))
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return date.toLocaleString('es-DO', { hour12: false })
}
