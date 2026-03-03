'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiRefreshCw, FiDollarSign, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi'

type RevenueOverview = {
  totals: {
    records: number
    activeOrTrialing: number
    pastDue: number
    canceled: number
    paymentFailures: number
    healthScore: number
  }
  statusBuckets: Record<string, number>
  paymentBuckets: Record<string, number>
  priceBreakdown: Array<{ priceId: string; subscribers: number }>
  recentStripeEvents: Array<{ id: string; type: string; createdAt: string }>
}

const DEFAULT_DATA: RevenueOverview = {
  totals: {
    records: 0,
    activeOrTrialing: 0,
    pastDue: 0,
    canceled: 0,
    paymentFailures: 0,
    healthScore: 0,
  },
  statusBuckets: {},
  paymentBuckets: {},
  priceBreakdown: [],
  recentStripeEvents: [],
}

function formatRelative(value?: string) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return '—'

  const diffMs = Date.now() - parsed.getTime()
  if (diffMs < 0) return 'just now'
  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function RevenueClient() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RevenueOverview>(DEFAULT_DATA)

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/revenue/overview')
      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Unable to load revenue overview')
      }

      setData(json.data || DEFAULT_DATA)
    } catch (error: any) {
      console.error('revenue overview error', error)
      toast.error(error?.message || 'Unable to load revenue overview')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  const cards = [
    { label: 'Billing Records', value: data.totals.records, tone: 'text-[#0B2545]', icon: <FiDollarSign /> },
    { label: 'Active / Trialing', value: data.totals.activeOrTrialing, tone: 'text-green-700', icon: <FiCheckCircle /> },
    { label: 'Past Due', value: data.totals.pastDue, tone: 'text-amber-700', icon: <FiClock /> },
    { label: 'Payment Failures', value: data.totals.paymentFailures, tone: 'text-red-700', icon: <FiAlertCircle /> },
    { label: 'Health Score', value: `${data.totals.healthScore}%`, tone: 'text-[#0B2545]', icon: <FiCheckCircle /> },
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B2545]">Revenue & Billing</h1>
          <p className="text-sm text-gray-600 mt-1">Subscription health, payment risk, and Stripe activity monitoring.</p>
        </div>
        <button
          onClick={loadOverview}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-100 disabled:opacity-60"
          title="Reload revenue and billing metrics"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500 flex items-center justify-between">
              <span>{card.label}</span>
              <span className={card.tone}>{card.icon}</span>
            </div>
            <div className={`mt-2 text-2xl font-bold ${card.tone}`}>{card.value}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Subscription Status Mix</h2>
          <div className="mt-3 space-y-2">
            {Object.keys(data.statusBuckets).length === 0 ? (
              <div className="text-xs text-gray-500">No billing status data yet.</div>
            ) : (
              Object.entries(data.statusBuckets).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                  <span className="text-xs text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                  <span className="text-xs font-semibold text-[#0B2545]">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Plan Price IDs</h2>
          <div className="mt-3 space-y-2">
            {data.priceBreakdown.length === 0 ? (
              <div className="text-xs text-gray-500">No plan-linked subscriptions tracked yet.</div>
            ) : (
              data.priceBreakdown.slice(0, 8).map((plan) => (
                <div key={plan.priceId} className="rounded-md border border-gray-200 px-3 py-2">
                  <div className="text-[11px] text-gray-600 break-all">{plan.priceId}</div>
                  <div className="text-xs font-semibold text-[#0B2545] mt-1">{plan.subscribers} subscribers</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Recent Stripe Events</h2>
        <div className="mt-3 space-y-2">
          {data.recentStripeEvents.length === 0 ? (
            <div className="text-xs text-gray-500">No Stripe events captured yet.</div>
          ) : (
            data.recentStripeEvents.map((event) => (
              <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2">
                <div className="text-xs font-medium text-[#0B2545]">{event.type}</div>
                <div className="text-[11px] text-gray-500">{formatRelative(event.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
