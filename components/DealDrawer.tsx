'use client'
// components/DealDrawer.tsx
// Right-side slide-over drawer that shows deal details when a Kanban card is clicked.
// Usage: <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />

import { useEffect, useRef, useState } from 'react'
import { FiX, FiDollarSign, FiUser, FiCalendar, FiFileText, FiLayers, FiTrendingUp, FiUpload, FiClock } from 'react-icons/fi'
import type { TransactionRecord, TransactionStage } from '@/lib/domain/transaction'
import { TRANSACTION_STAGES } from '@/lib/domain/transaction'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: 'USD' | 'DOP') {
  if (!isFinite(amount) || amount === 0) return currency === 'USD' ? '$0' : 'RD$0'
  const fmt = Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
  const s = currency === 'USD' ? '$' : 'RD$'
  if (amount >= 1_000_000) return `${s}${fmt.format(Math.round(amount / 1_000_000))}M`
  if (amount >= 1_000) return `${s}${fmt.format(Math.round(amount / 1_000))}K`
  return `${s}${fmt.format(amount)}`
}

function formatDate(ts: unknown): string {
  if (!ts) return '—'
  try {
    const hasToDate =
      typeof ts === 'object' &&
      ts !== null &&
      'toDate' in ts &&
      typeof (ts as { toDate?: () => Date }).toDate === 'function'
    const d = hasToDate ? (ts as { toDate: () => Date }).toDate() : new Date(String(ts))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo cargar la línea de tiempo'
}

const STAGE_CONFIG: Record<TransactionStage, { label: string; color: string; bg: string; dot: string }> = {
  lead:        { label: 'Lead',        color: 'text-gray-600',   bg: 'bg-gray-100',    dot: 'bg-gray-400'   },
  showing:     { label: 'Showing',     color: 'text-sky-700',    bg: 'bg-sky-50',      dot: 'bg-sky-400'    },
  offer:       { label: 'Offer',       color: 'text-yellow-700', bg: 'bg-yellow-50',   dot: 'bg-yellow-400' },
  reservation: { label: 'Reservation', color: 'text-blue-700',   bg: 'bg-blue-100',    dot: 'bg-blue-500'   },
  contract:    { label: 'Contract',    color: 'text-purple-700', bg: 'bg-purple-100',  dot: 'bg-purple-500' },
  closing:     { label: 'Closing',     color: 'text-orange-700', bg: 'bg-orange-100',  dot: 'bg-orange-500' },
  completed:   { label: 'Completed',   color: 'text-green-700',  bg: 'bg-green-50',    dot: 'bg-green-500'  },
  lost:        { label: 'Lost',        color: 'text-rose-700',   bg: 'bg-rose-50',     dot: 'bg-rose-500'   },
  archived:    { label: 'Archived',    color: 'text-zinc-700',   bg: 'bg-zinc-100',    dot: 'bg-zinc-500'   },
}

// ─── Row component ────────────────────────────────────────────────────────────

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="mt-0.5 truncate text-sm text-gray-800">{value || '—'}</p>
      </div>
    </div>
  )
}

// ─── DealDrawer ───────────────────────────────────────────────────────────────

export interface DealDrawerProps {
  deal: TransactionRecord | null
  onClose: () => void
}

type TimelineEvent = {
  id: string
  type: string
  createdAt?: unknown
  metadata?: Record<string, unknown>
}

function formatTimelineEventLabel(type: string): string {
  const labels: Record<string, string> = {
    deal_opened: 'Deal created',
    deal_updated: 'Deal updated',
    deal_stage_changed: 'Stage changed',
    reservation_created: 'Reservation submitted',
    contract_signed: 'Contract signed',
    closing_scheduled: 'Closing scheduled',
    transaction_created: 'Transaction created',
    commission_paid: 'Commission paid',
    document_uploaded: 'Document uploaded',
  }
  return labels[type] || type.replace(/_/g, ' ')
}

export default function DealDrawer({ deal, onClose }: DealDrawerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [actionMode, setActionMode] = useState<'stage' | 'note' | null>(null)
  const [savingAction, setSavingAction] = useState(false)
  const [stageDraft, setStageDraft] = useState<TransactionStage>('lead')
  const [stageValue, setStageValue] = useState<TransactionStage>('lead')
  const [lostReasonDraft, setLostReasonDraft] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineError, setTimelineError] = useState('')
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Trap focus inside drawer
  useEffect(() => {
    if (deal) {
      setTimeout(() => ref.current?.focus(), 50)
    }
  }, [deal])

  useEffect(() => {
    if (!deal) return
    setActionMode(null)
    setStageDraft(deal.stage)
    setStageValue(deal.stage)
    setLostReasonDraft((deal as any).lostReason || '')
    setNoteDraft(deal.notes || '')
  }, [deal])

  useEffect(() => {
    if (!deal?.id) return
    const dealId = deal.id
    let mounted = true

    async function loadTimeline() {
      try {
        setTimelineLoading(true)
        setTimelineError('')
        const search = new URLSearchParams({
          entityType: 'transaction',
          entityId: dealId,
          limit: '12',
        })
        const res = await fetch(`/api/activity-events?${search.toString()}`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({ ok: false }))
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to load timeline')
        if (!mounted) return
        setTimelineEvents(Array.isArray(json.events) ? json.events : [])
      } catch (error: unknown) {
        if (!mounted) return
        setTimelineError(getErrorMessage(error))
        setTimelineEvents([])
      } finally {
        if (mounted) setTimelineLoading(false)
      }
    }

    loadTimeline()
    return () => {
      mounted = false
    }
  }, [deal?.id])

  if (!deal) return null

  const stage = STAGE_CONFIG[stageValue] ?? STAGE_CONFIG.lead

  async function updateDeal(payload: { stage?: TransactionStage; notes?: string; lostReason?: string }) {
    if (!deal?.id) return
    try {
      setSavingAction(true)
      const res = await fetch(`/api/broker/transactions/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({ ok: false }))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to update deal')
      if (payload.stage) {
        setStageValue(payload.stage)
        if (payload.stage !== 'lost') setLostReasonDraft('')
        setActionMode(null)
      }
      if (payload.notes !== undefined) {
        setNoteDraft(payload.notes)
        setActionMode(null)
      }
    } catch (error) {
      console.error('Deal update error:', error)
    } finally {
      setSavingAction(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Deal details"
        className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl outline-none
          animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#00A676]">DEAL DETAILS</p>
            <h2 className="mt-0.5 truncate text-lg font-bold text-[#0B2545]">
              {deal.clientName || 'Unnamed Deal'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Close drawer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Stage badge */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
          <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${stage.color} ${stage.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${stage.dot}`} />
            {stage.label}
          </span>
          {deal.commissionStatus === 'paid' && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
              Commission Paid
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 border-b border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={() => setActionMode((prev) => (prev === 'stage' ? null : 'stage'))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Move Stage
          </button>
          <button
            type="button"
            onClick={() => setActionMode((prev) => (prev === 'note' ? null : 'note'))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Add Note
          </button>
          <a
            href={`/dashboard/broker/transactions?dealId=${deal.id}&action=upload-document`}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <FiUpload className="h-3.5 w-3.5" />
            Upload Document
          </a>
          <a
            href={`/dashboard/broker/transactions?dealId=${deal.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-[#00A676]/30 bg-[#00A676]/5 px-3 py-2 text-xs font-semibold text-[#00A676] hover:bg-[#00A676]/10"
          >
            Open Full Deal
          </a>
        </div>

        {actionMode === 'stage' && (
          <div className="border-b border-gray-100 px-5 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Move stage</p>
            <div className="flex items-center gap-2">
              <select
                value={stageDraft}
                onChange={(e) => setStageDraft(e.target.value as TransactionStage)}
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                title="Move stage"
              >
                {TRANSACTION_STAGES.map((s) => (
                  <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => updateDeal({ stage: stageDraft, lostReason: stageDraft === 'lost' ? lostReasonDraft : undefined })}
                disabled={savingAction || (stageDraft === 'lost' && !lostReasonDraft.trim())}
                className="rounded-lg bg-[#0B2545] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {savingAction ? 'Saving...' : 'Save'}
              </button>
            </div>
            {stageDraft === 'lost' && (
              <textarea
                rows={2}
                value={lostReasonDraft}
                onChange={(e) => setLostReasonDraft(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Motivo de perdida"
              />
            )}
          </div>
        )}

        {actionMode === 'note' && (
          <div className="border-b border-gray-100 px-5 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Nota del negocio</p>
            <textarea
              rows={3}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Agregar nota..."
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => updateDeal({ notes: noteDraft })}
                disabled={savingAction}
                className="rounded-lg bg-[#0B2545] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {savingAction ? 'Guardando...' : 'Guardar nota'}
              </button>
            </div>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          <Row
            icon={<FiDollarSign />}
            label="Precio de venta"
            value={
              <span className="font-bold text-[#0B2545]">
                {formatCurrency(deal.salePrice, deal.currency)}
              </span>
            }
          />
          <Row
            icon={<FiTrendingUp />}
            label="Comisión"
            value={
              deal.totalCommission > 0
                ? `${formatCurrency(deal.totalCommission, deal.currency)} (${deal.commissionPercent}%)`
                : '—'
            }
          />
          <Row icon={<FiUser />} label="Cliente" value={deal.clientName} />
          {deal.clientEmail && <Row icon={<FiFileText />} label="Email" value={deal.clientEmail} />}
          {deal.clientPhone && <Row icon={<FiFileText />} label="Teléfono" value={deal.clientPhone} />}
          <Row icon={<FiUser />} label="ID de Agente" value={deal.agentId ? deal.agentId.slice(0, 16) + '…' : null} />

          {deal.projectId && (
            <Row icon={<FiLayers />} label="Proyecto" value={deal.projectId} />
          )}
          {deal.unitId && (
            <Row icon={<FiLayers />} label="Unidad" value={deal.unitId} />
          )}
          {deal.listingId && (
            <Row icon={<FiLayers />} label="ID de listado" value={deal.listingId} />
          )}

          <Row icon={<FiCalendar />} label="Creado" value={formatDate(deal.createdAt)} />
          <Row icon={<FiCalendar />} label="Actualizado" value={formatDate(deal.updatedAt)} />

          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Línea de tiempo</p>
            {timelineLoading ? (
              <p className="text-sm text-gray-500">Cargando línea de tiempo...</p>
            ) : timelineError ? (
              <p className="text-sm text-red-600">{timelineError}</p>
            ) : timelineEvents.length === 0 ? (
              <p className="text-sm text-gray-500">Sin eventos en la línea de tiempo.</p>
            ) : (
              <div className="space-y-2">
                {timelineEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-[#0B2545]">{formatTimelineEventLabel(event.type)}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                        <FiClock className="h-3 w-3" />
                        {formatDate(event.createdAt)}
                      </span>
                    </div>
                    {event.type === 'deal_stage_changed' && Boolean(event.metadata?.from) && Boolean(event.metadata?.to) && (
                      <p className="mt-1 text-[11px] text-gray-600">
                        {String(event.metadata?.from)} → {String(event.metadata?.to)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {noteDraft && (
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Notas</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{noteDraft}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-100 px-5 py-4">
          <a
            href={`/dashboard/broker/transactions?dealId=${deal.id}`}
            className="block w-full rounded-xl bg-gradient-to-r from-[#00A676] to-[#008F64] px-4 py-2.5 text-center
              text-sm font-semibold text-white shadow-sm hover:from-[#008F64] hover:to-[#007A55] transition-all"
          >
            Ver negocio completo
          </a>
        </div>
      </div>
    </>
  )
}
