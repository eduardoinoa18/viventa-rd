'use client'

import { useEffect, useState } from 'react'
import { FiTarget, FiHome, FiClock, FiTrendingUp } from 'react-icons/fi'
import PageHeader from '@/components/ui/PageHeader'
import { KpiGrid, KpiCard } from '@/components/ui/KpiCard'

type SummaryState = {
  myListings: number
  officeListings: number
  marketListings: number
  leadsAssigned: number
  leadsWon: number
  avgResponseMinutes: number
  newLeadsLast30Days: number
}

export default function AgentOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<SummaryState>({
    myListings: 0,
    officeListings: 0,
    marketListings: 0,
    leadsAssigned: 0,
    leadsWon: 0,
    avgResponseMinutes: 0,
    newLeadsLast30Days: 0,
  })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')

        const [myRes, officeRes, marketRes, agentOverviewRes] = await Promise.all([
          fetch('/api/broker/listings/my?status=active', { cache: 'no-store' }),
          fetch('/api/broker/listings/office?status=active', { cache: 'no-store' }),
          fetch('/api/broker/listings/market?status=active', { cache: 'no-store' }),
          fetch('/api/agent/dashboard/overview', { cache: 'no-store' }),
        ])

        const [myJson, officeJson, marketJson, overviewJson] = await Promise.all([
          myRes.json().catch(() => ({})),
          officeRes.json().catch(() => ({})),
          marketRes.json().catch(() => ({})),
          agentOverviewRes.json().catch(() => ({})),
        ])

        if (!active) return

        const profileSummary = overviewJson?.summary || {}
        setSummary({
          myListings: Array.isArray(myJson?.listings) ? myJson.listings.length : 0,
          officeListings: Array.isArray(officeJson?.listings) ? officeJson.listings.length : 0,
          marketListings: Array.isArray(marketJson?.listings) ? marketJson.listings.length : 0,
          leadsAssigned: Number(profileSummary.leadsAssigned || 0),
          leadsWon: Number(profileSummary.leadsWon || 0),
          avgResponseMinutes: Number(profileSummary.avgResponseMinutes || 0),
          newLeadsLast30Days: Number(profileSummary.newLeadsLast30Days || 0),
        })
      } catch (loadError: any) {
        if (!active) return
        setError(loadError?.message || 'No se pudo cargar el overview del agente')
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
        eyebrow="Agent Workspace"
        title="Overview"
        description="Tu pipeline de leads, listados y comisiones"
        actions={[
          { label: '+ Create Listing', href: '/dashboard/listings/create' },
          { label: 'View CRM', href: '/dashboard/agent/crm', variant: 'secondary' },
        ]}
      />

      <KpiGrid cols={4}>
        <KpiCard label="Leads Assigned"      value={summary.leadsAssigned}     icon={<FiTarget />}    accent loading={loading} />
        <KpiCard label="New Leads (30d)"     value={summary.newLeadsLast30Days} icon={<FiTrendingUp />} loading={loading} />
        <KpiCard label="Active Listings"     value={summary.myListings}         icon={<FiHome />}       loading={loading} />
        <KpiCard label="Avg Response"        value={`${summary.avgResponseMinutes} min`} icon={<FiClock />}  loading={loading} />
      </KpiGrid>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-[#0B2545]">Detalles</h3>
        {loading ? (
          <div className="space-y-2">
            {[1,2].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <Metric label="Office Listings"  value={summary.officeListings} />
            <Metric label="Market Listings"  value={summary.marketListings} />
            <Metric label="Leads Ganados"    value={summary.leadsWon} />
            <Metric label="Resp. Promedio"   value={`${summary.avgResponseMinutes} min`} />
          </div>
        )}
        {!loading && summary.leadsAssigned === 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-gray-200 py-8 text-center">
            <p className="text-sm font-medium text-gray-500">No tienes leads asignados todavía</p>
            <p className="mt-1 text-xs text-gray-400">Cuando se te asignen leads apareceran aquí.</p>
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
