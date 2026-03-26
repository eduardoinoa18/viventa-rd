'use client'
import { useEffect, useState } from 'react'
import { FiMail, FiCheckCircle, FiXCircle, FiClock, FiAlertTriangle, FiRefreshCw, FiSkipForward } from 'react-icons/fi'

type JobTotals = {
  queued: number
  processing: number
  sent: number
  failed: number
  skipped: number
  total: number
}

type FailedJob = {
  id: string
  userId: string
  searchId: string
  listingCount: number
  error: string
  createdAt: string
}

type EmailEvent = {
  id: string
  userId: string
  type: string
  createdAt: string
}

type OverviewData = {
  jobs: {
    totals: JobTotals
    recentFailures: FailedJob[]
  }
  email: {
    recommendationEventsCount: number
    recentEvents: EmailEvent[]
  }
  range: string
}

const RANGE_OPTIONS = [
  { key: '24h', label: 'Last 24h' },
  { key: '7d',  label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
] as const

export default function RecommendationsPipelinePage() {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('24h')
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function load(r: string) {
    setLoading(true)
    setError(null)
    fetch(`/api/admin/recommendations/overview?range=${r}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'Error loading recommendations overview')
        setData(json.data)
      })
      .catch((e: any) => setError(e?.message || 'Error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(range) }, [range])

  const totals = data?.jobs?.totals
  const deliveryRate = totals && totals.total > 0
    ? Math.round((totals.sent / totals.total) * 100)
    : null

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0B2545] to-[#00A676] bg-clip-text text-transparent mb-1">
            Recommendation Pipeline
          </h1>
          <p className="text-gray-600 text-sm">Listing recommendation job queue health and email delivery metrics</p>
        </div>
        <div className="flex items-center gap-2">
          {RANGE_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${range === key ? 'bg-[#0B2545] text-white border-[#0B2545]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => load(range)}
            disabled={loading}
            className="ml-2 px-3 py-1.5 rounded-lg text-sm border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 inline-flex items-center gap-1 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-500">
          Loading recommendation pipeline data...
        </div>
      )}

      {/* Job Queue KPIs */}
      {totals && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiClock className="text-[#00A676]" /> Job Queue Status
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Total Jobs</div>
              <div className="text-2xl font-bold text-[#0B2545]">{totals.total}</div>
            </div>
            <div className="bg-white border border-blue-200 rounded-xl p-4">
              <div className="text-xs text-blue-600 mb-1 flex items-center gap-1"><FiClock /> Queued</div>
              <div className="text-2xl font-bold text-blue-700">{totals.queued}</div>
            </div>
            <div className="bg-white border border-yellow-200 rounded-xl p-4">
              <div className="text-xs text-yellow-600 mb-1 flex items-center gap-1"><FiRefreshCw /> Processing</div>
              <div className="text-2xl font-bold text-yellow-700">{totals.processing}</div>
            </div>
            <div className="bg-white border border-green-200 rounded-xl p-4">
              <div className="text-xs text-green-600 mb-1 flex items-center gap-1"><FiCheckCircle /> Sent</div>
              <div className="text-2xl font-bold text-green-700">{totals.sent}</div>
            </div>
            <div className="bg-white border border-red-200 rounded-xl p-4">
              <div className="text-xs text-red-600 mb-1 flex items-center gap-1"><FiXCircle /> Failed</div>
              <div className="text-2xl font-bold text-red-700">{totals.failed}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><FiSkipForward /> Skipped</div>
              <div className="text-2xl font-bold text-gray-700">{totals.skipped}</div>
            </div>
          </div>

          {deliveryRate !== null && (
            <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Delivery rate (sent / total)</div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${deliveryRate >= 80 ? 'bg-green-500' : deliveryRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${deliveryRate}%` }}
                  />
                </div>
              </div>
              <div className={`text-2xl font-bold ${deliveryRate >= 80 ? 'text-green-600' : deliveryRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {deliveryRate}%
              </div>
            </div>
          )}
        </section>
      )}

      {/* Email Delivery Events */}
      {data?.email && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiMail className="text-[#00A676]" /> Email Delivery Events
            <span className="ml-2 text-sm font-normal text-gray-500">({data.email.recommendationEventsCount} total in range)</span>
          </h2>
          {data.email.recentEvents.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">
              No recommendation email events found for this period.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">User ID</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">Event Type</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.email.recentEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{evt.userId || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {evt.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{evt.createdAt ? new Date(evt.createdAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Recent Failures */}
      {data?.jobs?.recentFailures && data.jobs.recentFailures.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-red-500" /> Recent Job Failures
          </h2>
          <div className="bg-white border border-red-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-red-50 border-b border-red-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-red-600 font-semibold">User ID</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-red-600 font-semibold">Search ID</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-red-600 font-semibold">Listings</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-red-600 font-semibold">Error</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-red-600 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {data.jobs.recentFailures.map((job) => (
                  <tr key={job.id} className="hover:bg-red-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{job.userId}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{job.searchId}</td>
                    <td className="px-4 py-3 text-gray-700">{job.listingCount}</td>
                    <td className="px-4 py-3 text-red-700 max-w-xs truncate" title={job.error}>{job.error || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{job.createdAt ? new Date(job.createdAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Empty healthy state */}
      {!loading && data && totals && totals.total === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <FiCheckCircle className="mx-auto text-4xl text-green-500 mb-3" />
          <p className="text-green-700 font-semibold text-lg">No recommendation jobs found</p>
          <p className="text-green-600 text-sm mt-1">The pipeline is idle for the selected time range. Jobs are created automatically when listings are published.</p>
        </div>
      )}
    </div>
  )
}
