'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type DealItem = {
  id: string
  unitId: string
  projectId: string
  reservationId: string
  buyerId: string
  buyerName: string
  brokerId: string
  brokerName: string
  price: number
  currency: string
  status: string
  timelineStage?: string
  timelineLabel?: string
  healthStatus?: 'healthy' | 'attention' | 'overdue' | 'complete'
  healthLabel?: string
  stageAgeDays?: number
  createdAt: any
  updatedAt: any
}

type DealsSummary = {
  total: number
  reserved: number
  negotiating: number
  contractSigned: number
  financing: number
  closing: number
  closed: number
  cancelled: number
  pipelineValue: number
}

const EMPTY_SUMMARY: DealsSummary = {
  total: 0,
  reserved: 0,
  negotiating: 0,
  contractSigned: 0,
  financing: 0,
  closing: 0,
  closed: 0,
  cancelled: 0,
  pipelineValue: 0,
}

const DEAL_STATUSES = ['all', 'reserved', 'negotiating', 'contract_signed', 'financing', 'closing', 'closed', 'cancelled']

export default function ConstructoraDealsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deals, setDeals] = useState<DealItem[]>([])
  const [statusDraftById, setStatusDraftById] = useState<Record<string, string>>({})
  const [updatingDealId, setUpdatingDealId] = useState<string | null>(null)
  const [summary, setSummary] = useState<DealsSummary>(EMPTY_SUMMARY)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    projectId: '',
    unitId: '',
    reservationId: '',
    buyerName: '',
    brokerName: '',
    price: '',
    status: 'reserved',
    currency: 'USD',
  })

  const hasActiveFilters = useMemo(() => statusFilter !== 'all' || searchInput.trim().length > 0, [statusFilter, searchInput])

  async function load() {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (searchInput.trim()) params.set('q', searchInput.trim())

      const url = `/api/constructora/dashboard/deals${params.toString() ? `?${params.toString()}` : ''}`
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudieron cargar los deals')
      }

      const nextDeals = Array.isArray(json?.deals) ? json.deals : []
      setDeals(nextDeals)
      const draft: Record<string, string> = {}
      nextDeals.forEach((deal: DealItem) => {
        draft[deal.id] = deal.status || 'reserved'
      })
      setStatusDraftById(draft)
      setSummary({
        total: Number(json?.summary?.total || 0),
        reserved: Number(json?.summary?.reserved || 0),
        negotiating: Number(json?.summary?.negotiating || 0),
        contractSigned: Number(json?.summary?.contractSigned || 0),
        financing: Number(json?.summary?.financing || 0),
        closing: Number(json?.summary?.closing || 0),
        closed: Number(json?.summary?.closed || 0),
        cancelled: Number(json?.summary?.cancelled || 0),
        pipelineValue: Number(json?.summary?.pipelineValue || 0),
      })
    } catch (loadError: any) {
      setError(loadError?.message || 'No se pudieron cargar los deals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [statusFilter, searchInput])

  const clearFilters = () => {
    setStatusFilter('all')
    setSearchInput('')
  }

  const onCreateDeal = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.projectId || !form.unitId || !form.buyerName || !form.price) {
      setError('projectId, unitId, buyerName y price son obligatorios')
      return
    }

    try {
      setCreating(true)
      setError('')

      const res = await fetch('/api/constructora/dashboard/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: form.projectId,
          unitId: form.unitId,
          reservationId: form.reservationId || null,
          buyerName: form.buyerName,
          brokerName: form.brokerName || null,
          price: Number(form.price),
          status: form.status,
          currency: form.currency,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo crear el deal')
      }

      setForm({
        projectId: '',
        unitId: '',
        reservationId: '',
        buyerName: '',
        brokerName: '',
        price: '',
        status: 'reserved',
        currency: 'USD',
      })
      await load()
    } catch (createError: any) {
      setError(createError?.message || 'No se pudo crear el deal')
    } finally {
      setCreating(false)
    }
  }

  async function updateDealStatus(dealId: string) {
    const status = statusDraftById[dealId]
    if (!status) return

    try {
      setUpdatingDealId(dealId)
      setError('')
      const res = await fetch(`/api/constructora/dashboard/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo actualizar el estado del deal')
      }
      await load()
    } catch (updateError: any) {
      setError(updateError?.message || 'No se pudo actualizar el estado del deal')
    } finally {
      setUpdatingDealId(null)
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-[#0B2545]">Deals</h2>
      <p className="mt-1 text-sm text-gray-600">Pipeline de ventas desde reserva hasta cierre, con acceso al timeline por deal.</p>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
        <Metric label="Total" value={summary.total} />
        <Metric label="Reservados" value={summary.reserved} />
        <Metric label="En negociación" value={summary.negotiating} />
        <Metric label="Cerrados" value={summary.closed} />
        <Metric label="Valor del pipeline" value={`$${summary.pipelineValue.toLocaleString()}`} />
      </div>

      <form onSubmit={onCreateDeal} className="mt-4 rounded-lg border border-gray-200 p-3 space-y-3">
        <div className="text-sm font-semibold text-gray-900">Crear deal</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input value={form.projectId} onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))} placeholder="ID del proyecto" className="px-3 py-2 text-sm border border-gray-300 rounded-lg" title="Project ID" />
          <input value={form.unitId} onChange={(e) => setForm((prev) => ({ ...prev, unitId: e.target.value }))} placeholder="ID de la unidad" className="px-3 py-2 text-sm border border-gray-300 rounded-lg" title="Unit ID" />
          <input value={form.reservationId} onChange={(e) => setForm((prev) => ({ ...prev, reservationId: e.target.value }))} placeholder="ID de reserva (opcional)" className="px-3 py-2 text-sm border border-gray-300 rounded-lg" title="Reservation ID" />
          <input value={form.buyerName} onChange={(e) => setForm((prev) => ({ ...prev, buyerName: e.target.value }))} placeholder="Nombre del comprador" className="px-3 py-2 text-sm border border-gray-300 rounded-lg" title="Buyer name" />
          <input value={form.brokerName} onChange={(e) => setForm((prev) => ({ ...prev, brokerName: e.target.value }))} placeholder="Nombre del broker (opcional)" className="px-3 py-2 text-sm border border-gray-300 rounded-lg" title="Broker name" />
          <input value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} placeholder="Precio" className="px-3 py-2 text-sm border border-gray-300 rounded-lg" title="Price" />
          <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white" title="Deal status">
            {DEAL_STATUSES.filter((status) => status !== 'all').map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={form.currency} onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white" title="Currency">
            <option value="USD">USD</option>
            <option value="DOP">DOP</option>
          </select>
        </div>
        <button type="submit" disabled={creating} className="px-3 py-2 text-sm font-medium text-white bg-[#0B2545] rounded-lg hover:bg-[#12355f] disabled:opacity-50">
          {creating ? 'Creando...' : 'Crear deal'}
        </button>
      </form>

      <div className="mt-4 rounded-lg border border-gray-200 p-3">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por buyer, unit, project o broker"
            className="w-full md:flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            title="Buscar deals"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            title="Filtrar por estado"
          >
            {DEAL_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          {hasActiveFilters ? <button onClick={clearFilters} className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Limpiar</button> : null}
        </div>
      </div>

      {loading ? <p className="mt-4 text-sm text-gray-600">Cargando deals...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {!loading && !error && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[920px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Deal</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Unit</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Buyer</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Broker</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Línea de tiempo</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deals.map((deal) => (
                <tr key={deal.id}>
                  <td className="px-3 py-2 text-sm text-gray-700">{deal.id.slice(0, 8)}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{deal.unitId}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{deal.buyerName}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{deal.brokerName || '—'}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{Number(deal.price || 0).toLocaleString()} {deal.currency || 'USD'}</td>
                  <td className="px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <select
                        value={statusDraftById[deal.id] || deal.status}
                        onChange={(e) => setStatusDraftById((prev) => ({ ...prev, [deal.id]: e.target.value }))}
                        title="Actualizar estado del deal"
                        aria-label="Actualizar estado del deal"
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
                      >
                        {DEAL_STATUSES.filter((status) => status !== 'all').map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateDealStatus(deal.id)}
                        disabled={updatingDealId === deal.id}
                        className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {updatingDealId === deal.id ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{deal.timelineLabel || deal.timelineStage || '—'}</span>
                      {deal.healthLabel ? <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${deal.healthStatus === 'overdue' ? 'bg-rose-50 text-rose-700' : deal.healthStatus === 'attention' ? 'bg-amber-50 text-amber-700' : deal.healthStatus === 'complete' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{deal.healthLabel}</span> : null}
                      {typeof deal.stageAgeDays === 'number' ? <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{deal.stageAgeDays}d</span> : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/dashboard/constructora/deals/${deal.id}`} className="inline-flex items-center rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!deals.length ? <div className="p-4 text-sm text-gray-500">No hay deals para los filtros seleccionados.</div> : null}
        </div>
      )}
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
