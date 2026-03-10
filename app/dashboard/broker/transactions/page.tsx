'use client'

import { useEffect, useMemo, useState } from 'react'
import type { TransactionRecord, TransactionStage } from '@/lib/domain/transaction'

const PIPELINE_STAGES = [
  { key: 'lead', label: 'Lead' },
  { key: 'showing', label: 'Showing' },
  { key: 'offer', label: 'Offer' },
  { key: 'reservation', label: 'Reservation' },
  { key: 'contract', label: 'Contract' },
  { key: 'closing', label: 'Closing' },
  { key: 'completed', label: 'Completed' },
] as const

type StageKey = (typeof PIPELINE_STAGES)[number]['key']

type TransactionItem = Partial<TransactionRecord> & { id: string; stage?: TransactionStage }

type Summary = {
  totalPipeline: number
  won: number
  projectedValue: number
  pendingCommissions: number
  paidCommissions: number
}

type CreateDealForm = {
  clientName: string
  clientEmail: string
  clientPhone: string
  salePrice: string
  commissionPercent: string
  agentSplitPercent: string
  stage: StageKey
  notes: string
}

export default function BrokerTransactionsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalPipeline: 0,
    won: 0,
    projectedValue: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
  })
  const [stageDraftById, setStageDraftById] = useState<Record<string, StageKey>>({})

  const [form, setForm] = useState<CreateDealForm>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    salePrice: '',
    commissionPercent: '5',
    agentSplitPercent: '70',
    stage: 'lead',
    notes: '',
  })

  async function loadBoard() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/broker/transactions', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo cargar transacciones')

      const tx = Array.isArray(json?.transactions) ? json.transactions : []
      const byId: Record<string, StageKey> = {}
      tx.forEach((item: TransactionItem) => {
        const stage = item.stage || 'lead'
        byId[item.id] = stage
      })

      setTransactions(tx)
      setStageDraftById(byId)
      setSummary({
        totalPipeline: Number(json?.summary?.totalPipeline || 0),
        won: Number(json?.summary?.won || 0),
        projectedValue: Number(json?.summary?.projectedValue || 0),
        pendingCommissions: Number(json?.summary?.pendingCommissions || 0),
        paidCommissions: Number(json?.summary?.paidCommissions || 0),
      })
    } catch (loadError: any) {
      setError(loadError?.message || 'No se pudo cargar transacciones')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBoard()
  }, [])

  const transactionsByStage = useMemo(() => {
    const grouped: Record<StageKey, TransactionItem[]> = {
      lead: [],
      showing: [],
      offer: [],
      reservation: [],
      contract: [],
      closing: [],
      completed: [],
    }

    for (const tx of transactions) {
      grouped[(tx.stage || 'lead') as StageKey].push(tx)
    }

    return grouped
  }, [transactions])

  async function createDeal(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientName.trim() || !form.salePrice.trim()) {
      setError('Client name y sale price son requeridos.')
      return
    }

    try {
      setSaving(true)
      setError('')
      const res = await fetch('/api/broker/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.clientName,
          clientEmail: form.clientEmail || undefined,
          clientPhone: form.clientPhone || undefined,
          salePrice: Number(form.salePrice),
          commissionPercent: Number(form.commissionPercent || 0),
          agentSplitPercent: Number(form.agentSplitPercent || 70),
          stage: form.stage,
          notes: form.notes || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo crear el deal')

      setForm({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        salePrice: '',
        commissionPercent: '5',
        agentSplitPercent: '70',
        stage: 'lead',
        notes: '',
      })
      await loadBoard()
    } catch (createError: any) {
      setError(createError?.message || 'No se pudo crear el deal')
    } finally {
      setSaving(false)
    }
  }

  async function updateStage(id: string) {
    const stage = stageDraftById[id] || 'lead'
    try {
      const res = await fetch('/api/broker/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stage }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo mover etapa')
      await loadBoard()
    } catch (updateError: any) {
      setError(updateError?.message || 'No se pudo mover etapa')
    }
  }

  async function toggleCommissionPaid(tx: TransactionItem) {
    try {
      const nextStatus = tx.commissionStatus === 'paid' ? 'pending' : 'paid'
      const res = await fetch('/api/broker/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tx.id, commissionStatus: nextStatus }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo actualizar comisión')
      await loadBoard()
    } catch (updateError: any) {
      setError(updateError?.message || 'No se pudo actualizar comisión')
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[#0B2545]">Transactions Board</h2>
        <p className="text-sm text-gray-600">Pipeline operacional del broker con comisiones.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 text-sm">
        <Metric label="Pipeline" value={summary.totalPipeline} />
        <Metric label="Cerrados" value={summary.won} />
        <Metric label="Proyección" value={currency(summary.projectedValue)} />
        <Metric label="Pendiente" value={currency(summary.pendingCommissions)} />
        <Metric label="Pagado" value={currency(summary.paidCommissions)} />
      </div>

      <form onSubmit={createDeal} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
        <div className="text-sm font-semibold text-[#0B2545] mb-2">Nuevo deal</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input value={form.clientName} onChange={(e) => setForm((prev) => ({ ...prev, clientName: e.target.value }))} placeholder="Cliente" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" title="Cliente" />
          <input value={form.clientEmail} onChange={(e) => setForm((prev) => ({ ...prev, clientEmail: e.target.value }))} placeholder="Email" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" title="Email" />
          <input value={form.clientPhone} onChange={(e) => setForm((prev) => ({ ...prev, clientPhone: e.target.value }))} placeholder="Teléfono" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" title="Teléfono" />
          <input value={form.salePrice} onChange={(e) => setForm((prev) => ({ ...prev, salePrice: e.target.value }))} placeholder="Precio de venta" inputMode="decimal" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" title="Precio de venta" />
          <input value={form.commissionPercent} onChange={(e) => setForm((prev) => ({ ...prev, commissionPercent: e.target.value }))} placeholder="Comisión %" inputMode="decimal" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" title="Comisión %" />
          <input value={form.agentSplitPercent} onChange={(e) => setForm((prev) => ({ ...prev, agentSplitPercent: e.target.value }))} placeholder="Split agente %" inputMode="decimal" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" title="Split agente %" />
          <select value={form.stage} onChange={(e) => setForm((prev) => ({ ...prev, stage: e.target.value as StageKey }))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" title="Etapa inicial">
            {PIPELINE_STAGES.map((stage) => (
              <option key={stage.key} value={stage.key}>{stage.label}</option>
            ))}
          </select>
          <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-medium disabled:opacity-50">
            {saving ? 'Creando...' : 'Crear deal'}
          </button>
          <textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notas" className="md:col-span-4 px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} title="Notas" />
        </div>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-gray-500">Cargando board...</p> : null}

      <div className="overflow-x-auto">
        <div className="min-w-[1200px] grid grid-cols-7 gap-3">
          {PIPELINE_STAGES.map((column) => (
            <div key={column.key} className="rounded-lg border border-gray-200 bg-gray-50 p-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[#0B2545]">{column.label}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600">
                  {transactionsByStage[column.key].length}
                </span>
              </div>

              <div className="space-y-2">
                {transactionsByStage[column.key].map((tx) => (
                  <div key={tx.id} className="rounded border border-gray-200 bg-white p-2">
                    <div className="text-xs font-semibold text-[#0B2545]">{tx.clientName || 'Cliente'}</div>
                    <div className="text-[11px] text-gray-600 mt-1">Venta: {currency(Number(tx.salePrice || 0), tx.currency || 'USD')}</div>
                    <div className="text-[11px] text-gray-600">Comisión: {currency(Number(tx.totalCommission || 0), tx.currency || 'USD')}</div>
                    <div className="text-[11px] text-gray-600">Agente: {currency(Number(tx.agentCommission || 0), tx.currency || 'USD')}</div>
                    <div className="text-[11px] text-gray-600">Broker: {currency(Number(tx.brokerCommission || 0), tx.currency || 'USD')}</div>

                    <div className="mt-2 space-y-1">
                      <select
                        value={stageDraftById[tx.id] || (tx.stage || 'lead')}
                        onChange={(e) => setStageDraftById((prev) => ({ ...prev, [tx.id]: e.target.value as StageKey }))}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                        title="Mover etapa"
                      >
                        {PIPELINE_STAGES.map((stage) => (
                          <option key={stage.key} value={stage.key}>{stage.label}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => updateStage(tx.id)} className="w-full px-2 py-1 rounded border border-gray-200 text-xs font-medium text-[#0B2545]">
                        Actualizar etapa
                      </button>
                      <button type="button" onClick={() => toggleCommissionPaid(tx)} className="w-full px-2 py-1 rounded border border-gray-200 text-xs font-medium text-[#0B2545]">
                        {tx.commissionStatus === 'paid' ? 'Marcar pendiente' : 'Marcar pagada'}
                      </button>
                    </div>
                  </div>
                ))}

                {!transactionsByStage[column.key].length ? (
                  <p className="text-xs text-gray-500">Sin deals</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function currency(value: number, currencyCode: 'USD' | 'DOP' = 'USD') {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(Number(value || 0))
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-base font-bold text-[#0B2545]">{value}</div>
    </div>
  )
}
