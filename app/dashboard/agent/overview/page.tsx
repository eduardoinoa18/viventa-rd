'use client'

import { useEffect, useState } from 'react'

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
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-[#0B2545]">Overview del agente</h2>
      {loading ? <p className="mt-2 text-sm text-gray-600">Cargando métricas...</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Metric label="Mis listados" value={summary.myListings} />
        <Metric label="Oficina" value={summary.officeListings} />
        <Metric label="Mercado" value={summary.marketListings} />
        <Metric label="Leads asignados" value={summary.leadsAssigned} />
        <Metric label="Nuevos leads 30d" value={summary.newLeadsLast30Days} />
        <Metric label="Leads ganados" value={summary.leadsWon} />
        <Metric label="Resp. promedio" value={`${summary.avgResponseMinutes} min`} />
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
