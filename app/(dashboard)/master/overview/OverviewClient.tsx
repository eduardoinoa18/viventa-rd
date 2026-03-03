'use client'

import { useEffect, useMemo, useState } from 'react'

type PerfRow = {
  key: string
  name: string
  assigned: number
  won: number
  late: number
  avgLatencyHours: number
  conversionRate: number
  slaRate: number
  escalationRate?: number
}

type OverviewData = {
  generatedAt: string
  slaHours: number
  operationalHealth: {
    slaComplianceRate: number
    avgAssignmentHours: number
    escalationRate: number
  }
  volumeFlow: {
    leads7d: number
    leads30d: number
    velocityTrend7dPct: number
    activePipelineCount: number
  }
  performance: {
    leadsToQualifiedRate: number
    qualifiedToDealRate: number
    topBroker: PerfRow | null
    topAgent: PerfRow | null
    worstSlaBroker: PerfRow | null
  }
  valueSources: {
    topSources: Array<{ label: string; value: number; ratio: number }>
    topSectors: Array<{ label: string; value: number; ratio: number }>
    topPropertyTypes: Array<{ label: string; value: number; ratio: number }>
  }
  risk: {
    agingOver48h: number
    slowAgents: PerfRow[]
    highEscalationBrokers: PerfRow[]
  }
}

export default function OverviewClient() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<OverviewData | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/admin/overview', { cache: 'no-store' })
      const json = await res.json()

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to fetch overview')
      }

      setData(json.data)
    } catch (err: any) {
      setError(err?.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 30000)
    return () => clearInterval(id)
  }, [])

  const generatedAtLabel = useMemo(() => {
    if (!data?.generatedAt) return ''
    const date = new Date(data.generatedAt)
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString()
  }, [data?.generatedAt])

  if (loading && !data) {
    return (
      <div className="p-6 md:p-8">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Loading executive overview data...
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="p-6 md:p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-700">Unable to load Executive Overview.</p>
          <p className="mt-1 text-xs text-red-600">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const health = data.operationalHealth
  const flow = data.volumeFlow
  const perf = data.performance

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Overview</h1>
          <p className="text-sm text-gray-600">CEO layer for rapid ratio and risk decisions.</p>
        </div>
        <div className="text-xs text-gray-500">Updated: {generatedAtLabel || 'N/A'}</div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Operational Health</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard
            title={`SLA Compliance (<= ${data.slaHours}h)`}
            value={`${health.slaComplianceRate}%`}
            status={getComplianceStatus(health.slaComplianceRate)}
            hint="Share of leads assigned within SLA target"
          />
          <MetricCard title="Avg Assignment Time" value={`${health.avgAssignmentHours}h`} hint="Average hours from lead creation to assignment" />
          <MetricCard
            title="Escalation Rate"
            value={`${health.escalationRate}%`}
            status={getInverseRateStatus(health.escalationRate)}
            tone={health.escalationRate >= 25 ? 'warn' : 'default'}
            hint="Open escalations as share of active queue"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Volume & Flow</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <MetricCard title="Leads 7d" value={String(flow.leads7d)} hint="New leads captured in the last 7 days" />
          <MetricCard title="Leads 30d" value={String(flow.leads30d)} hint="New leads captured in the last 30 days" />
          <MetricCard
            title="Velocity Trend 7d"
            value={`${flow.velocityTrend7dPct}%`}
            status={getTrendStatus(flow.velocityTrend7dPct)}
            tone={flow.velocityTrend7dPct < 0 ? 'warn' : 'default'}
            hint="Week-over-week lead flow change"
          />
          <MetricCard title="Active Pipeline" value={String(flow.activePipelineCount)} hint="Leads currently in non-terminal stages" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Performance</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-800">Conversion Funnel (30d)</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <KpiPair label="Lead → Qualified" value={`${perf.leadsToQualifiedRate}%`} />
              <KpiPair label="Qualified → Deal" value={`${perf.qualifiedToDealRate}%`} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-800">Top / Weak Operators</h3>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Top Broker" value={perf.topBroker ? `${perf.topBroker.name} (${perf.topBroker.conversionRate}%)` : 'N/A'} />
              <Row label="Top Agent" value={perf.topAgent ? `${perf.topAgent.name} (${perf.topAgent.conversionRate}%)` : 'N/A'} />
              <Row label="Weak SLA Broker" value={perf.worstSlaBroker ? `${perf.worstSlaBroker.name} (${perf.worstSlaBroker.slaRate}% SLA)` : 'N/A'} />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Source / Sector Value</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TopListCard title="Top Sources" rows={data.valueSources.topSources} />
          <TopListCard title="Top Sectors" rows={data.valueSources.topSectors} />
          <TopListCard title="Top Property Types" rows={data.valueSources.topPropertyTypes} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Risk Areas</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard
            title="Aging >48h (open)"
            value={String(data.risk.agingOver48h)}
            status={data.risk.agingOver48h > 0 ? 'risk' : 'ok'}
            tone={data.risk.agingOver48h > 0 ? 'warn' : 'default'}
            hint="Open leads older than 48 hours"
          />

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-800">Slow Agents</h3>
            <SimplePerfList rows={data.risk.slowAgents} metric="avgLatencyHours" suffix="h" />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-800">High Escalation Brokers</h3>
            <SimplePerfList rows={data.risk.highEscalationBrokers} metric="escalationRate" suffix="%" />
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          Partial refresh warning: {error}
        </div>
      ) : null}
    </div>
  )
}

function MetricCard({
  title,
  value,
  tone = 'default',
  status,
  hint,
}: {
  title: string
  value: string
  tone?: 'default' | 'warn'
  status?: 'ok' | 'watch' | 'risk'
  hint?: string
}) {
  return (
    <div className={`rounded-xl border p-4 ${tone === 'warn' ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
        {status ? (
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getStatusChipClass(status)}`}>
            {statusLabel(status)}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-gray-500">{hint}</p> : null}
    </div>
  )
}

function KpiPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}

function TopListCard({ title, rows }: { title: string; rows: Array<{ label: string; value: number; ratio: number }> }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <div className="mt-3 space-y-2 text-sm">
        {rows.length ? (
          rows.map((row) => (
            <div key={`${title}-${row.label}`} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
              <span className="truncate text-gray-700">{row.label}</span>
              <span className="font-medium text-gray-900">{row.value} ({row.ratio}%)</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-500">No data yet</p>
        )}
      </div>
    </div>
  )
}

function SimplePerfList({ rows, metric, suffix }: { rows: PerfRow[]; metric: 'avgLatencyHours' | 'escalationRate'; suffix: string }) {
  if (!rows.length) {
    return <p className="mt-3 text-xs text-gray-500">No significant risks detected</p>
  }

  return (
    <div className="mt-3 space-y-2 text-sm">
      {rows.map((row) => {
        const value = metric === 'avgLatencyHours' ? row.avgLatencyHours : Number(row.escalationRate || 0)
        return (
          <div key={`risk-${metric}-${row.key}`} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
            <span className="truncate text-gray-700">{row.name}</span>
            <span className="font-medium text-gray-900">{value}{suffix}</span>
          </div>
        )
      })}
    </div>
  )
}

function getComplianceStatus(value: number): 'ok' | 'watch' | 'risk' {
  if (value >= 80) return 'ok'
  if (value >= 60) return 'watch'
  return 'risk'
}

function getInverseRateStatus(value: number): 'ok' | 'watch' | 'risk' {
  if (value <= 10) return 'ok'
  if (value <= 20) return 'watch'
  return 'risk'
}

function getTrendStatus(value: number): 'ok' | 'watch' | 'risk' {
  if (value >= 0) return 'ok'
  if (value >= -10) return 'watch'
  return 'risk'
}

function getStatusChipClass(status: 'ok' | 'watch' | 'risk') {
  if (status === 'ok') return 'border-green-200 bg-green-50 text-green-700'
  if (status === 'watch') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-red-200 bg-red-50 text-red-700'
}

function statusLabel(status: 'ok' | 'watch' | 'risk') {
  if (status === 'ok') return 'Healthy'
  if (status === 'watch') return 'Watch'
  return 'Risk'
}
