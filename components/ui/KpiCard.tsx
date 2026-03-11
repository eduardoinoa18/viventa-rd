// components/ui/KpiCard.tsx
// Reusable KPI metric card + responsive grid container.
//
// Usage:
//   <KpiGrid>
//     <KpiCard label="Deals in Pipeline" value={12} icon={<FiTrendingUp />} />
//     <KpiCard label="Active Listings"   value={34} trend={+5} trendLabel="vs last month" />
//     <KpiCard label="Closed This Month" value="$1.2M" accent />
//   </KpiGrid>

import React from 'react'

// ── KpiCard ─────────────────────────────────────────────────────────────────

type KpiCardProps = {
  label: string
  value: string | number
  subValue?: string
  icon?: React.ReactNode
  /** Positive = green, negative = red */
  trend?: number
  trendLabel?: string
  /** Highlight with teal accent border */
  accent?: boolean
  loading?: boolean
}

export function KpiCard({ label, value, subValue, icon, trend, trendLabel, accent = false, loading = false }: KpiCardProps) {
  const trendColor =
    trend === undefined ? '' : trend >= 0 ? 'text-emerald-600' : 'text-red-500'
  const trendSign = trend !== undefined && trend > 0 ? '+' : ''

  return (
    <div
      className={`relative flex flex-col gap-1 rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
        accent ? 'border-[#00A676]' : 'border-gray-100'
      }`}
    >
      {/* Top row: icon + label */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
        {icon && (
          <span className={`text-xl ${accent ? 'text-[#00A676]' : 'text-gray-300'}`}>{icon}</span>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="mt-1 h-7 w-24 animate-pulse rounded bg-gray-100" />
      ) : (
        <span className="mt-1 text-2xl font-bold text-[#0B2545]">{value}</span>
      )}

      {/* Sub-value / trend */}
      <div className="flex items-center gap-1 text-xs text-gray-400">
        {subValue && <span>{subValue}</span>}
        {trend !== undefined && !loading && (
          <span className={`font-semibold ${trendColor}`}>
            {trendSign}{trend}% {trendLabel || ''}
          </span>
        )}
      </div>

      {/* Accent border indicator */}
      {accent && (
        <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-[#00A676] to-[#008F64]" />
      )}
    </div>
  )
}

// ── KpiGrid ──────────────────────────────────────────────────────────────────

type KpiGridProps = {
  children: React.ReactNode
  cols?: 2 | 3 | 4
}

export function KpiGrid({ children, cols = 4 }: KpiGridProps) {
  const gridClass =
    cols === 2 ? 'grid-cols-1 sm:grid-cols-2' :
    cols === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'

  return (
    <div className={`mb-6 grid gap-4 ${gridClass}`}>
      {children}
    </div>
  )
}
