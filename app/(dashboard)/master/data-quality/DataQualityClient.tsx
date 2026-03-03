'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiRefreshCw, FiShield, FiImage, FiCheckCircle, FiAlertTriangle, FiLayers } from 'react-icons/fi'

type DuplicateGroup = {
  key: string
  count: number
  sample: Array<{ id: string; title: string; city: string }>
}

type LowQualityListing = {
  id: string
  title: string
  status: string
  city: string
  sector: string
  completenessScore: number
  imageCount: number
  verified: boolean
  updatedAt: string
}

type DataQualityOverview = {
  totals: {
    listings: number
    verified: number
    verificationRate: number
    missingImages: number
    lowCompleteness: number
    duplicateRisk: number
    avgCompleteness: number
  }
  possibleDuplicates: DuplicateGroup[]
  lowestQualityListings: LowQualityListing[]
}

const DEFAULT_DATA: DataQualityOverview = {
  totals: {
    listings: 0,
    verified: 0,
    verificationRate: 0,
    missingImages: 0,
    lowCompleteness: 0,
    duplicateRisk: 0,
    avgCompleteness: 0,
  },
  possibleDuplicates: [],
  lowestQualityListings: [],
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

export default function DataQualityClient() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DataQualityOverview>(DEFAULT_DATA)

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/data-quality/overview')
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Unable to load data quality overview')
      }
      setData(json.data || DEFAULT_DATA)
    } catch (error: any) {
      console.error('data quality overview error', error)
      toast.error(error?.message || 'Unable to load data quality overview')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  const cards = [
    { label: 'Listings', value: data.totals.listings, tone: 'text-[#0B2545]', icon: <FiLayers /> },
    { label: 'Verification Rate', value: `${data.totals.verificationRate}%`, tone: 'text-green-700', icon: <FiCheckCircle /> },
    { label: 'Avg Completeness', value: `${data.totals.avgCompleteness}%`, tone: 'text-[#0B2545]', icon: <FiShield /> },
    { label: 'Missing Images', value: data.totals.missingImages, tone: 'text-amber-700', icon: <FiImage /> },
    { label: 'Duplicate Risk', value: data.totals.duplicateRisk, tone: 'text-red-700', icon: <FiAlertTriangle /> },
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B2545]">Data Quality</h1>
          <p className="text-sm text-gray-600 mt-1">Listing completeness, duplicate risk, and verification quality controls.</p>
        </div>
        <button
          onClick={loadOverview}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-100 disabled:opacity-60"
          title="Reload data quality metrics"
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
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Possible Duplicate Groups</h2>
          <div className="mt-3 space-y-2">
            {data.possibleDuplicates.length === 0 ? (
              <div className="text-xs text-gray-500">No duplicate risk groups detected.</div>
            ) : (
              data.possibleDuplicates.map((group) => (
                <div key={group.key} className="rounded-md border border-gray-200 p-3">
                  <div className="text-xs font-semibold text-red-700">{group.count} listings share the same title/city/price key</div>
                  <div className="mt-1 text-[11px] text-gray-500 break-all">{group.key}</div>
                  <div className="mt-2 space-y-1">
                    {group.sample.map((item) => (
                      <div key={item.id} className="text-xs text-gray-700">
                        {item.title} {item.city ? `· ${item.city}` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Lowest Completeness Listings</h2>
          <div className="mt-3 space-y-2">
            {data.lowestQualityListings.length === 0 ? (
              <div className="text-xs text-gray-500">No listings available for quality scoring.</div>
            ) : (
              data.lowestQualityListings.map((listing) => (
                <div key={listing.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2">
                  <div>
                    <div className="text-xs font-semibold text-[#0B2545]">{listing.title}</div>
                    <div className="text-[11px] text-gray-500">
                      {listing.city || 'No city'}{listing.sector ? ` · ${listing.sector}` : ''} · {listing.status}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-semibold ${listing.completenessScore < 60 ? 'text-red-700' : 'text-amber-700'}`}>
                      {listing.completenessScore}%
                    </div>
                    <div className="text-[11px] text-gray-500">{listing.imageCount} imgs · {formatRelative(listing.updatedAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
