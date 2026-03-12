'use client'

import { useCallback, useEffect, useState } from 'react'
import { FiLayout, FiTrendingUp, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import KanbanBoard from '@/components/KanbanBoard'
import DealDrawer from '@/components/DealDrawer'
import PageHeader from '@/components/ui/PageHeader'
import { KpiCard, KpiGrid } from '@/components/ui/KpiCard'
import type { TransactionRecord, TransactionStage } from '@/lib/domain/transaction'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'USD') {
  const fmt = Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
  const symbol = currency === 'USD' ? '$' : 'RD$'
  if (amount >= 1_000_000) return `${symbol}${fmt.format(Math.round(amount / 1_000_000))}M`
  if (amount >= 1_000) return `${symbol}${fmt.format(Math.round(amount / 1_000))}K`
  return `${symbol}${fmt.format(amount)}`
}

const ACTIVE_STAGES: TransactionStage[] = ['lead', 'showing', 'offer', 'reservation', 'contract', 'closing']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrokerPipelinePage() {
  const [deals, setDeals] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDeal, setSelectedDeal] = useState<TransactionRecord | null>(null)

  // Fetch pipeline
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/broker/transactions', { cache: 'no-store' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body?.ok) throw new Error(body?.error || 'Failed to load transactions')
      setDeals(body.transactions ?? [])
    } catch (e: any) {
      setError(e.message ?? 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Handle drag-and-drop stage change
  const handleStageChange = useCallback(async (dealId: string, newStage: TransactionStage) => {
    const res = await fetch(`/api/broker/transactions/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok || !body?.ok) {
      toast.error(body?.error || 'Failed to update deal stage')
      throw new Error(body?.error || 'Failed to update')
    }
    // Sync the updated transaction back into local state
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)),
    )
    toast.success(`Deal moved to ${newStage}`)
  }, [])

  // ── KPI computations ──────────────────────────────────────────────────────

  const totalDeals = deals.length
  const activeDeals = deals.filter((d) => ACTIVE_STAGES.includes(d.stage)).length
  const completedDeals = deals.filter((d) => d.stage === 'completed').length

  const primaryCurrency = deals.length > 0
    ? (deals.filter((d) => d.currency === 'USD').length >= deals.length / 2 ? 'USD' : 'DOP')
    : 'USD'

  const pipelineValue = deals
    .filter((d) => ACTIVE_STAGES.includes(d.stage))
    .reduce((sum, d) => sum + (d.salePrice || 0), 0)

  const totalCommission = deals
    .filter((d) => d.stage === 'completed')
    .reduce((sum, d) => sum + (d.totalCommission || 0), 0)

  const closingDeals = deals.filter((d) => d.stage === 'closing').length

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 min-w-0 p-4 sm:p-6">
      <PageHeader
        eyebrow="Broker Workspace"
        title="Deal Pipeline"
        description="Drag deals across stages to track your team's transaction progress"
        actions={[
          { label: '+ New Deal', href: '/dashboard/broker/transactions', variant: 'primary' },
          { label: 'All Deals', href: '/dashboard/broker/transactions', variant: 'secondary' },
        ]}
      />

      {/* KPI Row */}
      <KpiGrid>
        <KpiCard
          label="Total Deals"
          value={loading ? '—' : totalDeals}
          icon={<FiLayout />}
          loading={loading}
        />
        <KpiCard
          label="Active Pipeline"
          value={loading ? '—' : formatCurrency(pipelineValue, primaryCurrency)}
          subValue={`${activeDeals} deal${activeDeals !== 1 ? 's' : ''}`}
          icon={<FiTrendingUp />}
          accent
          loading={loading}
        />
        <KpiCard
          label="Closing Soon"
          value={loading ? '—' : closingDeals}
          subValue="in closing stage"
          icon={<FiClock />}
          loading={loading}
        />
        <KpiCard
          label="Closed"
          value={loading ? '—' : completedDeals}
          subValue={totalCommission > 0 ? `${formatCurrency(totalCommission, primaryCurrency)} comm.` : undefined}
          icon={<FiCheckCircle />}
          loading={loading}
        />
      </KpiGrid>

      {/* Error state */}
      {error && !loading && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FiAlertCircle className="shrink-0" />
          {error}
          <button
            type="button"
            onClick={load}
            className="ml-auto rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-medium hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <KanbanBoard
          deals={deals}
          onStageChange={handleStageChange}
          onCardClick={setSelectedDeal}
          loading={loading}
          error={!loading ? error : null}
        />
      </div>

      {/* Deal detail drawer */}
      <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </div>
  )
}
