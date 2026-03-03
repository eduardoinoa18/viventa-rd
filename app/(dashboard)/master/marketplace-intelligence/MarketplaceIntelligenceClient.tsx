'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiRefreshCw, FiMap, FiBarChart2, FiLayers } from 'react-icons/fi'

type ZoneRow = {
  zone: string
  listings: number
  avgPrice: number
  avgDaysOnMarket: number
  wonLeads: number
  totalLeads: number
  leadToCloseRate: number
  topBroker: string
}

type MarketplaceOverview = {
  totals: {
    zones: number
    listings: number
    avgPrice: number
    avgDaysOnMarket: number
    leadToCloseRate: number
  }
  topInventoryZones: ZoneRow[]
  topPriceZones: ZoneRow[]
}

const DEFAULT_DATA: MarketplaceOverview = {
  totals: {
    zones: 0,
    listings: 0,
    avgPrice: 0,
    avgDaysOnMarket: 0,
    leadToCloseRate: 0,
  },
  topInventoryZones: [],
  topPriceZones: [],
}

function usd(value: number) {
  if (!value) return '$0'
  return `$${value.toLocaleString()}`
}

export default function MarketplaceIntelligenceClient() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MarketplaceOverview>(DEFAULT_DATA)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/marketplace-intelligence/overview')
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Unable to load marketplace intelligence')
      }
      setData(json.data || DEFAULT_DATA)
    } catch (error: any) {
      console.error('marketplace intelligence error', error)
      toast.error(error?.message || 'Unable to load marketplace intelligence')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B2545]">Marketplace Intelligence</h1>
          <p className="text-sm text-gray-600 mt-1">National market visibility by zone, inventory, pricing, and broker dominance.</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-100 disabled:opacity-60"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"><div className="text-xs uppercase tracking-wide text-gray-500">Zones</div><div className="mt-2 text-2xl font-bold text-[#0B2545]">{data.totals.zones}</div></div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"><div className="text-xs uppercase tracking-wide text-gray-500">Listings Indexed</div><div className="mt-2 text-2xl font-bold text-[#0B2545]">{data.totals.listings}</div></div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"><div className="text-xs uppercase tracking-wide text-gray-500">Avg Price</div><div className="mt-2 text-2xl font-bold text-[#0B2545]">{usd(data.totals.avgPrice)}</div></div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"><div className="text-xs uppercase tracking-wide text-gray-500">Avg Days on Market</div><div className="mt-2 text-2xl font-bold text-amber-700">{data.totals.avgDaysOnMarket}</div></div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"><div className="text-xs uppercase tracking-wide text-gray-500">Lead-to-Close</div><div className="mt-2 text-2xl font-bold text-green-700">{data.totals.leadToCloseRate}%</div></div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide inline-flex items-center gap-2"><FiLayers /> Inventory by Zone</h2>
          <div className="mt-3 space-y-2">
            {data.topInventoryZones.length === 0 ? (
              <div className="text-xs text-gray-500">No zone inventory data yet.</div>
            ) : (
              data.topInventoryZones.map((row) => (
                <div key={`inv-${row.zone}`} className="rounded-md border border-gray-200 px-3 py-2">
                  <div className="text-xs font-semibold text-[#0B2545]">{row.zone}</div>
                  <div className="text-[11px] text-gray-500 mt-1">Listings: {row.listings} · Avg Price: {usd(row.avgPrice)} · Top Broker: {row.topBroker}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide inline-flex items-center gap-2"><FiBarChart2 /> Pricing & Conversion Zones</h2>
          <div className="mt-3 space-y-2">
            {data.topPriceZones.length === 0 ? (
              <div className="text-xs text-gray-500">No pricing intelligence data yet.</div>
            ) : (
              data.topPriceZones.map((row) => (
                <div key={`price-${row.zone}`} className="rounded-md border border-gray-200 px-3 py-2">
                  <div className="text-xs font-semibold text-[#0B2545]">{row.zone}</div>
                  <div className="text-[11px] text-gray-500 mt-1">Avg Price: {usd(row.avgPrice)} · DOM: {row.avgDaysOnMarket} · Lead-close: {row.leadToCloseRate}%</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide inline-flex items-center gap-2"><FiMap /> Strategic Note</h2>
        <p className="mt-2 text-sm text-gray-600">Use this intelligence to decide sector expansion, pricing strategy, and broker partnership concentration by zone.</p>
      </section>
    </div>
  )
}
