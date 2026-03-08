'use client'

import { useEffect, useState } from 'react'

type SummaryState = {
  myListings: number
  officeListings: number
  marketListings: number
  autoAssignable: number
  overdue: number
  followUpDue: number
  pipeline: number
  projectedValue: number
}

export default function BrokerOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<SummaryState>({
    myListings: 0,
    officeListings: 0,
    marketListings: 0,
    autoAssignable: 0,
    overdue: 0,
    followUpDue: 0,
    pipeline: 0,
    projectedValue: 0,
  })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')

        const [myRes, officeRes, marketRes, automationRes, txRes] = await Promise.all([
          fetch('/api/broker/listings/my?status=active', { cache: 'no-store' }),
          fetch('/api/broker/listings/office?status=active', { cache: 'no-store' }),
          fetch('/api/broker/listings/market?status=active', { cache: 'no-store' }),
          fetch('/api/broker/leads/automation', { cache: 'no-store' }),
          fetch('/api/broker/transactions', { cache: 'no-store' }),
        ])

        const [myJson, officeJson, marketJson, automationJson, txJson] = await Promise.all([
          myRes.json().catch(() => ({})),
          officeRes.json().catch(() => ({})),
          marketRes.json().catch(() => ({})),
          automationRes.json().catch(() => ({})),
          txRes.json().catch(() => ({})),
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
        })
      } catch (loadError: any) {
        if (!active) return
        setError(loadError?.message || 'No se pudo cargar el overview')
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
      <h2 className="text-lg font-semibold text-[#0B2545]">Overview del broker</h2>
      {loading ? <p className="mt-2 text-sm text-gray-600">Cargando métricas...</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Metric label="Mis listados" value={summary.myListings} />
        <Metric label="Oficina" value={summary.officeListings} />
        <Metric label="Mercado" value={summary.marketListings} />
        <Metric label="Auto-asignables" value={summary.autoAssignable} />
        <Metric label="SLA vencido" value={summary.overdue} />
        <Metric label="Follow-up due" value={summary.followUpDue} />
        <Metric label="Pipeline" value={summary.pipeline} />
        <Metric label="Proyección" value={new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(summary.projectedValue || 0)} />
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
