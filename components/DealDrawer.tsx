'use client'
// components/DealDrawer.tsx
// Right-side slide-over drawer that shows deal details when a Kanban card is clicked.
// Usage: <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />

import { useEffect, useRef } from 'react'
import { FiX, FiDollarSign, FiUser, FiCalendar, FiFileText, FiLayers, FiTrendingUp } from 'react-icons/fi'
import type { TransactionRecord, TransactionStage } from '@/lib/domain/transaction'

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
    const d = typeof ts === 'object' && (ts as any)?.toDate ? (ts as any).toDate() : new Date(ts as any)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}

const STAGE_CONFIG: Record<TransactionStage, { label: string; color: string; bg: string; dot: string }> = {
  lead:        { label: 'Lead',        color: 'text-gray-600',   bg: 'bg-gray-100',    dot: 'bg-gray-400'   },
  showing:     { label: 'Showing',     color: 'text-sky-700',    bg: 'bg-sky-50',      dot: 'bg-sky-400'    },
  offer:       { label: 'Offer',       color: 'text-yellow-700', bg: 'bg-yellow-50',   dot: 'bg-yellow-400' },
  reservation: { label: 'Reservation', color: 'text-blue-700',   bg: 'bg-blue-100',    dot: 'bg-blue-500'   },
  contract:    { label: 'Contract',    color: 'text-purple-700', bg: 'bg-purple-100',  dot: 'bg-purple-500' },
  closing:     { label: 'Closing',     color: 'text-orange-700', bg: 'bg-orange-100',  dot: 'bg-orange-500' },
  completed:   { label: 'Completed',   color: 'text-green-700',  bg: 'bg-green-50',    dot: 'bg-green-500'  },
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

export default function DealDrawer({ deal, onClose }: DealDrawerProps) {
  const ref = useRef<HTMLDivElement>(null)

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

  if (!deal) return null

  const stage = STAGE_CONFIG[deal.stage] ?? STAGE_CONFIG.lead

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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          <Row
            icon={<FiDollarSign />}
            label="Sale Price"
            value={
              <span className="font-bold text-[#0B2545]">
                {formatCurrency(deal.salePrice, deal.currency)}
              </span>
            }
          />
          <Row
            icon={<FiTrendingUp />}
            label="Commission"
            value={
              deal.totalCommission > 0
                ? `${formatCurrency(deal.totalCommission, deal.currency)} (${deal.commissionPercent}%)`
                : '—'
            }
          />
          <Row icon={<FiUser />} label="Client" value={deal.clientName} />
          {deal.clientEmail && <Row icon={<FiFileText />} label="Email" value={deal.clientEmail} />}
          {deal.clientPhone && <Row icon={<FiFileText />} label="Phone" value={deal.clientPhone} />}
          <Row icon={<FiUser />} label="Agent ID" value={deal.agentId ? deal.agentId.slice(0, 16) + '…' : null} />

          {deal.projectId && (
            <Row icon={<FiLayers />} label="Project" value={deal.projectId} />
          )}
          {deal.unitId && (
            <Row icon={<FiLayers />} label="Unit" value={deal.unitId} />
          )}
          {deal.listingId && (
            <Row icon={<FiLayers />} label="Listing ID" value={deal.listingId} />
          )}

          <Row icon={<FiCalendar />} label="Created" value={formatDate(deal.createdAt)} />
          <Row icon={<FiCalendar />} label="Updated" value={formatDate(deal.updatedAt)} />

          {deal.notes && (
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-100 px-5 py-4">
          <a
            href={`/dashboard/broker/transactions`}
            className="block w-full rounded-xl bg-gradient-to-r from-[#00A676] to-[#008F64] px-4 py-2.5 text-center
              text-sm font-semibold text-white shadow-sm hover:from-[#008F64] hover:to-[#007A55] transition-all"
          >
            Open Full Deal View
          </a>
        </div>
      </div>
    </>
  )
}
