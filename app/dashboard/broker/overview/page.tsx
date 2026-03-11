'use client'

import { useEffect, useState } from 'react'
import { FiTrendingUp, FiHome, FiDollarSign, FiCalendar } from 'react-icons/fi'
import PageHeader from '@/components/ui/PageHeader'
import { KpiGrid, KpiCard } from '@/components/ui/KpiCard'
import type { RevenueMetrics, TopBrokerRevenueRow } from '@/lib/domain/transaction'

type SummaryState = {
  myListings: number
  officeListings: number
  marketListings: number
  autoAssignable: number
  overdue: number
  followUpDue: number
  pipeline: number
  projectedValue: number
} & RevenueMetrics

type OfficeProfile = {
  id: string
  name?: string
  officeCode?: string
  brokerageName?: string
  city?: string
  province?: string
  status?: string
  subscription?: {
    plan?: string
    status?: string
    agentsLimit?: number
    listingsLimit?: number
    seatsUsed?: number
    currentPeriodEnd?: string | null
  }
}

type ActivitySummary = {
  unreadNotifications: number
  unreadActivity: number
  todayDealsOpened: number
  todayReservations: number
  todayDocuments: number
  todayTransactions: number
}

export default function BrokerOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [office, setOffice] = useState<OfficeProfile | null>(null)
  const [summary, setSummary] = useState<SummaryState>({
    myListings: 0,
    officeListings: 0,
    marketListings: 0,
    autoAssignable: 0,
    overdue: 0,
    followUpDue: 0,
    pipeline: 0,
    projectedValue: 0,
    officePipelineValue: 0,
    expectedCommission: 0,
    dealsClosingThisMonth: 0,
    activeDeals: 0,
  })
  const [topBrokers, setTopBrokers] = useState<TopBrokerRevenueRow[]>([])
  const [activitySummary, setActivitySummary] = useState<ActivitySummary>({
    unreadNotifications: 0,
    unreadActivity: 0,
    todayDealsOpened: 0,
    todayReservations: 0,
    todayDocuments: 0,
    todayTransactions: 0,
  })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')

        const [myRes, officeRes, marketRes, automationRes, txRes, officeProfileRes, revenueRes, activitySummaryRes] = await Promise.all([
          fetch('/api/broker/listings/my?status=active', { cache: 'no-store' }),
          fetch('/api/broker/listings/office?status=active', { cache: 'no-store' }),
          fetch('/api/broker/listings/market?status=active', { cache: 'no-store' }),
          fetch('/api/broker/leads/automation', { cache: 'no-store' }),
          fetch('/api/broker/transactions', { cache: 'no-store' }),
          fetch('/api/broker/office', { cache: 'no-store' }),
          fetch('/api/broker/analytics/revenue', { cache: 'no-store' }),
          fetch('/api/activity-events/summary', { cache: 'no-store' }),
        ])

        const [myJson, officeJson, marketJson, automationJson, txJson, officeProfileJson, revenueJson, activitySummaryJson] = await Promise.all([
          myRes.json().catch(() => ({})),
          officeRes.json().catch(() => ({})),
          marketRes.json().catch(() => ({})),
          automationRes.json().catch(() => ({})),
          txRes.json().catch(() => ({})),
          officeProfileRes.json().catch(() => ({})),
          revenueRes.json().catch(() => ({})),
          activitySummaryRes.json().catch(() => ({})),
        ])

        if (!active) return

        setSummary({
          myListings: Array.isArray(myJson?.listings) ? myJson.listings.length : 0,
          officeListings: Array.isArray(officeJson?.listings) ? officeJson.listings.length : 0,
          marketListings: Array.isArray(marketJson?.listings) ? marketJson.listings.length : 0,
          autoAssignable: Number(automationJson?.data?.autoAssignable || 0),
          overdue: Number(automationJson?.data?.overdue || 0),
          followUpDue: Number(automationJson?.data?.followUpDue || 0),
          pipeline: Number(txJson?.summary?.totalPipeline || 0),
          projectedValue: Number(txJson?.summary?.projectedValue || 0),
          officePipelineValue: Number(revenueJson?.metrics?.officePipelineValue || 0),
          expectedCommission: Number(revenueJson?.metrics?.expectedCommission || 0),
          dealsClosingThisMonth: Number(revenueJson?.metrics?.dealsClosingThisMonth || 0),
          activeDeals: Number(revenueJson?.metrics?.activeDeals || 0),
        })

        setTopBrokers(Array.isArray(revenueJson?.topBrokers) ? revenueJson.topBrokers : [])
        setActivitySummary({
          unreadNotifications: Number(activitySummaryJson?.summary?.unreadNotifications || 0),
          unreadActivity: Number(activitySummaryJson?.summary?.unreadActivity || 0),
          todayDealsOpened: Number(activitySummaryJson?.summary?.todayDealsOpened || 0),
          todayReservations: Number(activitySummaryJson?.summary?.todayReservations || 0),
          todayDocuments: Number(activitySummaryJson?.summary?.todayDocuments || 0),
          todayTransactions: Number(activitySummaryJson?.summary?.todayTransactions || 0),
        })

        if (officeProfileRes.ok && officeProfileJson?.ok) {
          setOffice((officeProfileJson?.office || null) as OfficeProfile | null)
        } else {
          setOffice(null)
        }
      } catch (loadError: any) {
        if (!active) return
        setError(loadError?.message || 'No se pudo cargar el overview')
        setOffice(null)
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
    <div>
      <PageHeader
        eyebrow="Broker Workspace"
        title="Overview"
        description="Métricas de rendimiento de tu oficina y pipeline"
        actions={[
          { label: '+ Create Deal', href: '/dashboard/broker/transactions' },
          { label: 'View Listings', href: '/dashboard/listings', variant: 'secondary' },
        ]}
      />

      {/* KPI Cards */}
      <KpiGrid cols={4}>
        <KpiCard label="Active Deals"         value={summary.activeDeals}          icon={<FiTrendingUp />} accent loading={loading} />
        <KpiCard label="Active Listings"      value={summary.myListings}           icon={<FiHome />}       loading={loading} />
        <KpiCard label="Expected Commission"  value={new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(summary.expectedCommission || 0)} icon={<FiDollarSign />} loading={loading} />
        <KpiCard label="Closing This Month"   value={summary.dealsClosingThisMonth} icon={<FiCalendar />}  loading={loading} />
      </KpiGrid>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {/* Secondary metrics */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-[#0B2545]">Pipeline Breakdown</h3>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Metric label="Office Listings"   value={summary.officeListings} />
          <Metric label="Market Listings"   value={summary.marketListings} />
          <Metric label="Auto-Asignables"   value={summary.autoAssignable} />
          <Metric label="SLA Vencido"       value={summary.overdue} />
          <Metric label="Follow-up Due"     value={summary.followUpDue} />
          <Metric label="Pipeline Value"    value={summary.pipeline} />
          <Metric label="Proyección"        value={new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(summary.projectedValue || 0)} />
          <Metric label="Office Pipeline"   value={new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(summary.officePipelineValue || 0)} />
        </div>
      </section>

      {/* Activity summary */}
      <section className="mt-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-[#0B2545]">Today&apos;s Activity</h3>
        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-6">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">🔔 Notif: <span className="font-semibold text-[#0B2545]">{activitySummary.unreadNotifications}</span></div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">⚡ Activity: <span className="font-semibold text-[#0B2545]">{activitySummary.unreadActivity}</span></div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">Deals: <span className="font-semibold text-[#0B2545]">{activitySummary.todayDealsOpened}</span></div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">Reservas: <span className="font-semibold text-[#0B2545]">{activitySummary.todayReservations}</span></div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">Docs: <span className="font-semibold text-[#0B2545]">{activitySummary.todayDocuments}</span></div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">Trans: <span className="font-semibold text-[#0B2545]">{activitySummary.todayTransactions}</span></div>
        </div>
      </section>

      {/* Office subscription */}
      {office ? (
        <section className="mt-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-[#0B2545]">Office Subscription</h3>
          <div className="text-sm font-semibold text-[#0B2545]">{office.name || 'Office'} ({office.officeCode || 'N/A'})</div>
          <div className="mt-0.5 text-xs text-gray-500">{office.brokerageName || 'Sin brokerage'} • {office.city || '—'}{office.province ? `, ${office.province}` : ''}</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
            <Metric label="Plan"     value={office.subscription?.plan || 'basic'} />
            <Metric label="Estado"   value={office.subscription?.status || 'active'} />
            <Metric label="Agents"   value={`${Number(office.subscription?.seatsUsed || 0)} / ${Number(office.subscription?.agentsLimit || 0)}`} />
            <Metric label="Listings" value={Number(office.subscription?.listingsLimit || 0)} />
          </div>
        </section>
      ) : null}

      {/* Top brokers */}
      <section className="mt-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-[#0B2545]">Top Brokers by Commission</h3>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        ) : topBrokers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
            <p className="text-sm text-gray-400">No hay brokers con datos todavía.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topBrokers.map((broker) => (
              <div key={broker.userId} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs">
                <div className="font-semibold text-[#0B2545]">{broker.name}</div>
                <div className="mt-1 text-gray-500">
                  Deals: {broker.deals} · Pipeline: {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(broker.pipelineValue || 0))} · Expected: {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(broker.expectedCommission || 0))} · Closed: {broker.closedDeals}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
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
