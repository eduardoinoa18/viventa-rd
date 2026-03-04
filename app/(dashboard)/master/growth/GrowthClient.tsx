'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiRefreshCw, FiTrendingUp, FiUsers, FiTarget, FiMail } from 'react-icons/fi'

type DayPoint = { date: string; value: number }

type GrowthOverview = {
  totals: {
    signups30d: number
    leads30d: number
    views30d: number
    inquiries30d: number
    emailSent30d: number
    messageSent30d: number
    registrationCompletionRate: number
    inquiryConversionRate: number
    leadToCloseRate: number
  }
  funnel: {
    users: number
    registrationCompleted: number
    leadsCreated: number
    leadsContacted: number
    leadsWon: number
    leadsLost: number
  }
  trends: {
    signupsDaily: DayPoint[]
    leadsDaily: DayPoint[]
  }
}

const DEFAULT_DATA: GrowthOverview = {
  totals: {
    signups30d: 0,
    leads30d: 0,
    views30d: 0,
    inquiries30d: 0,
    emailSent30d: 0,
    messageSent30d: 0,
    registrationCompletionRate: 0,
    inquiryConversionRate: 0,
    leadToCloseRate: 0,
  },
  funnel: {
    users: 0,
    registrationCompleted: 0,
    leadsCreated: 0,
    leadsContacted: 0,
    leadsWon: 0,
    leadsLost: 0,
  },
  trends: {
    signupsDaily: [],
    leadsDaily: [],
  },
}

export default function GrowthClient() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<GrowthOverview>(DEFAULT_DATA)

  const loadGrowth = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/growth/overview')
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Unable to load growth overview')
      }
      setData(json.data || DEFAULT_DATA)
    } catch (error: any) {
      console.error('growth overview error', error)
      toast.error(error?.message || 'Unable to load growth overview')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGrowth()
  }, [loadGrowth])

  const maxSignups = useMemo(() => Math.max(...data.trends.signupsDaily.map((item) => item.value), 1), [data.trends.signupsDaily])
  const maxLeads = useMemo(() => Math.max(...data.trends.leadsDaily.map((item) => item.value), 1), [data.trends.leadsDaily])

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B2545]">Growth Engine</h1>
          <p className="text-sm text-gray-600 mt-1">User acquisition, funnel performance, and growth velocity control center.</p>
        </div>
        <button
          onClick={loadGrowth}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-100 disabled:opacity-60"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500 flex items-center justify-between"><span>Signups (30d)</span><FiUsers className="text-[#0B2545]" /></div>
          <div className="mt-2 text-2xl font-bold text-[#0B2545]">{data.totals.signups30d}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500 flex items-center justify-between"><span>Leads (30d)</span><FiTarget className="text-[#0B2545]" /></div>
          <div className="mt-2 text-2xl font-bold text-[#0B2545]">{data.totals.leads30d}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500 flex items-center justify-between"><span>Reg. Completion</span><FiTrendingUp className="text-green-700" /></div>
          <div className="mt-2 text-2xl font-bold text-green-700">{data.totals.registrationCompletionRate}%</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500 flex items-center justify-between"><span>View → Inquiry</span><FiTrendingUp className="text-amber-700" /></div>
          <div className="mt-2 text-2xl font-bold text-amber-700">{data.totals.inquiryConversionRate}%</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500 flex items-center justify-between"><span>Lead → Close</span><FiTrendingUp className="text-[#0B2545]" /></div>
          <div className="mt-2 text-2xl font-bold text-[#0B2545]">{data.totals.leadToCloseRate}%</div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 xl:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Embudo de Crecimiento</h2>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-md border border-gray-200 p-3"><div className="text-gray-500">Usuarios</div><div className="text-xl font-semibold text-[#0B2545]">{data.funnel.users}</div></div>
            <div className="rounded-md border border-gray-200 p-3"><div className="text-gray-500">Registros completados</div><div className="text-xl font-semibold text-[#0B2545]">{data.funnel.registrationCompleted}</div></div>
            <div className="rounded-md border border-gray-200 p-3"><div className="text-gray-500">Leads creados</div><div className="text-xl font-semibold text-[#0B2545]">{data.funnel.leadsCreated}</div></div>
            <div className="rounded-md border border-gray-200 p-3"><div className="text-gray-500">Leads contactados</div><div className="text-xl font-semibold text-[#0B2545]">{data.funnel.leadsContacted}</div></div>
            <div className="rounded-md border border-gray-200 p-3"><div className="text-gray-500">Leads ganados</div><div className="text-xl font-semibold text-green-700">{data.funnel.leadsWon}</div></div>
            <div className="rounded-md border border-gray-200 p-3"><div className="text-gray-500">Leads perdidos</div><div className="text-xl font-semibold text-red-700">{data.funnel.leadsLost}</div></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Resultados de interacción (30d)</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="rounded-md border border-gray-200 p-3 flex items-center justify-between"><span className="text-gray-600">Emails enviados</span><span className="font-semibold text-[#0B2545] inline-flex items-center gap-1"><FiMail /> {data.totals.emailSent30d}</span></div>
            <div className="rounded-md border border-gray-200 p-3 flex items-center justify-between"><span className="text-gray-600">Mensajes enviados</span><span className="font-semibold text-[#0B2545]">{data.totals.messageSent30d}</span></div>
            <div className="rounded-md border border-gray-200 p-3 flex items-center justify-between"><span className="text-gray-600">Vistas</span><span className="font-semibold text-[#0B2545]">{data.totals.views30d}</span></div>
            <div className="rounded-md border border-gray-200 p-3 flex items-center justify-between"><span className="text-gray-600">Consultas</span><span className="font-semibold text-[#0B2545]">{data.totals.inquiries30d}</span></div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Signup Velocity (30d)</h2>
          <div className="mt-3 space-y-2">
            {data.trends.signupsDaily.slice(-14).map((point) => {
              const pct = Math.max(4, Math.round((point.value / maxSignups) * 100))
              const widthClass = pct >= 95 ? 'w-full' : pct >= 80 ? 'w-5/6' : pct >= 65 ? 'w-2/3' : pct >= 50 ? 'w-1/2' : pct >= 35 ? 'w-1/3' : pct >= 20 ? 'w-1/4' : 'w-1/6'
              return (
                <div key={point.date} className="flex items-center gap-3">
                  <div className="w-20 text-[11px] text-gray-500">{point.date.slice(5)}</div>
                  <div className={`h-2 rounded bg-cyan-500 ${widthClass}`} />
                  <div className="text-xs font-semibold text-[#0B2545]">{point.value}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Lead Velocity (30d)</h2>
          <div className="mt-3 space-y-2">
            {data.trends.leadsDaily.slice(-14).map((point) => {
              const pct = Math.max(4, Math.round((point.value / maxLeads) * 100))
              const widthClass = pct >= 95 ? 'w-full' : pct >= 80 ? 'w-5/6' : pct >= 65 ? 'w-2/3' : pct >= 50 ? 'w-1/2' : pct >= 35 ? 'w-1/3' : pct >= 20 ? 'w-1/4' : 'w-1/6'
              return (
                <div key={point.date} className="flex items-center gap-3">
                  <div className="w-20 text-[11px] text-gray-500">{point.date.slice(5)}</div>
                  <div className={`h-2 rounded bg-purple-500 ${widthClass}`} />
                  <div className="text-xs font-semibold text-[#0B2545]">{point.value}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
