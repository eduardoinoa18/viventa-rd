'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FiUsers, FiHome, FiDollarSign, FiClock, FiUserPlus, FiActivity, FiCheckCircle, FiXCircle, FiMail } from 'react-icons/fi'

export default function MasterOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('month')
  const [stats, setStats] = useState({
    // Property Management KPIs
    totalProperties: 0,
    approvedProperties: 0,
    pendingApprovals: 0,
    rejectedProperties: 0,
    publishedProperties: 0,
    draftProperties: 0,
    thisWeekProperties: 0,
    // User & Engagement Metrics
    totalUsers: 0,
    activeListings: 0,
    monthlyRevenueUSD: 0,
    leads: 0,
    pendingApplications: 0,
    totalAgents: 0,
    totalBrokers: 0,
    newUsers: 0,
    listingsCreated: 0,
    newLeads: 0,
    conversionMetrics: {
      totalViews: 0,
      totalContacts: 0,
      totalLeads: 0,
      viewToContactRate: '0.00%',
      contactToLeadRate: '0.00%',
      window: {
        views: 0,
        contacts: 0,
        leads: 0,
        viewToContactRate: '0.00%',
        contactToLeadRate: '0.00%',
      },
    },
    window: 'all' as 'all'|'day'|'week'|'month',
    // Broker performance & velocity
    topBrokers: [] as Array<{id: string; name: string; leadsThis: number; conversionRate: number; revenue: number}>,
    leadVelocity: [] as Array<{day: string; count: number}>,
    registrationVelocity: [] as Array<{day: string; count: number}>,
    growthMetrics: {
      leadsGrowth: 0,
      usersGrowth: 0,
      revenueGrowth: 0,
      isGrowing: true,
    }
  })
  const [timeWindow, setTimeWindow] = useState<'all'|'day'|'week'|'month'>('all')
  const [activitySummary, setActivitySummary] = useState({
    unreadNotifications: 0,
    unreadActivity: 0,
    todayDealsOpened: 0,
    todayReservations: 0,
    todayDocuments: 0,
    todayTransactions: 0,
  })

  const getUiErrorMessage = (status?: number) => {
    if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente para ver el panel maestro.'
    if (status === 403) return 'No tienes permisos para acceder a este módulo del panel maestro.'
    return 'No se pudo cargar el resumen del panel maestro. Intenta nuevamente.'
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    const url = `/api/admin/stats${timeWindow && timeWindow !== 'all' ? `?window=${timeWindow}` : ''}`
    fetch(url)
      .then(async (r) => {
        const payload = await r.json().catch(() => ({}))
        if (!r.ok || !payload?.ok) {
          throw new Error(payload?.error || getUiErrorMessage(r.status))
        }
        return payload
      })
      .then((statsRes) => {
        if (statsRes?.ok && statsRes.data) {
          const d = statsRes.data
          const agents = d.roleCounts?.agents ?? 0
          const brokers = d.roleCounts?.brokers ?? 0
          setStats({
            // Property counts (from admin stats endpoint)
            totalProperties: (d.activeListings || 0) + (d.pendingApprovals || 0) + (d.rejectedProperties || 0),
            approvedProperties: d.activeListings || 0,
            pendingApprovals: d.pendingApprovals || 0,
            rejectedProperties: d.rejectedProperties || 0,
            publishedProperties: d.activeListings || 0,
            draftProperties: d.draftProperties || 0,
            thisWeekProperties: d.listingsCreated || 0,
            // User metrics
            totalUsers: d.totalUsers || 0,
            activeListings: d.activeListings || 0,
            monthlyRevenueUSD: d.monthlyRevenueUSD || 0,
            leads: d.leads || 0,
            pendingApplications: d.pendingApplications || 0,
            totalAgents: agents,
            totalBrokers: brokers,
            newUsers: d.newUsers || 0,
            listingsCreated: d.listingsCreated || 0,
            newLeads: d.newLeads || 0,
            conversionMetrics: d.conversionMetrics || {
              totalViews: 0,
              totalContacts: 0,
              totalLeads: 0,
              viewToContactRate: '0.00%',
              contactToLeadRate: '0.00%',
              window: {
                views: 0,
                contacts: 0,
                leads: 0,
                viewToContactRate: '0.00%',
                contactToLeadRate: '0.00%',
              },
            },
            window: timeWindow,
            topBrokers: d.topBrokers || [],
            leadVelocity: d.leadVelocity || [],
            registrationVelocity: d.registrationVelocity || [],
            growthMetrics: d.growthMetrics || {
              leadsGrowth: 0,
              usersGrowth: 0,
              revenueGrowth: 0,
              isGrowing: true,
            },
          })
        }
      })
      .catch((e: any) => {
        setError(e?.message || getUiErrorMessage())
      })
      .finally(() => setLoading(false))

    fetch('/api/activity-events/summary', { cache: 'no-store' })
      .then(async (r) => {
        const payload = await r.json().catch(() => ({}))
        if (!r.ok || !payload?.ok) return
        setActivitySummary({
          unreadNotifications: Number(payload?.summary?.unreadNotifications || 0),
          unreadActivity: Number(payload?.summary?.unreadActivity || 0),
          todayDealsOpened: Number(payload?.summary?.todayDealsOpened || 0),
          todayReservations: Number(payload?.summary?.todayReservations || 0),
          todayDocuments: Number(payload?.summary?.todayDocuments || 0),
          todayTransactions: Number(payload?.summary?.todayTransactions || 0),
        })
      })
      .catch(() => {})
  }, [timeWindow])

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0B2545] to-[#00A676] bg-clip-text text-transparent mb-2">
          Master Control Overview
        </h1>
        <p className="text-gray-600">Complete control of the Dominican Republic real estate network</p>
      </div>
      
      {/* Time window selector */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600 mr-2">Time window:</span>
        {([
          { key: 'all', label: 'All' },
          { key: 'day', label: 'Today' },
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            disabled={loading}
            onClick={() => setTimeWindow(key as any)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${timeWindow===key ? 'bg-[#0B2545] text-white border-[#0B2545]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          Cargando métricas del panel maestro...
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiActivity className="text-[#00A676]" />
          Platform Today
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500">Unread Notifications</div>
            <div className="text-2xl font-bold text-[#0B2545] mt-1">{activitySummary.unreadNotifications}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500">Unread Activity</div>
            <div className="text-2xl font-bold text-[#0B2545] mt-1">{activitySummary.unreadActivity}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500">Deals Opened</div>
            <div className="text-2xl font-bold text-[#0B2545] mt-1">{activitySummary.todayDealsOpened}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500">Reservations</div>
            <div className="text-2xl font-bold text-[#0B2545] mt-1">{activitySummary.todayReservations}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500">Documents</div>
            <div className="text-2xl font-bold text-[#0B2545] mt-1">{activitySummary.todayDocuments}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500">Transactions</div>
            <div className="text-2xl font-bold text-[#0B2545] mt-1">{activitySummary.todayTransactions}</div>
          </div>
        </div>
      </section>

      {/* === PROPERTY MODERATION KPIs (MAIN SECTION) === */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiHome className="text-[#00A676]" />
          Property Inventory Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Properties */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Total Properties</span>
              <FiHome className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold">{stats.totalProperties}</div>
            <div className="text-white/70 text-xs mt-2">All inventory</div>
          </div>

          {/* Approved/Active */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Published</span>
              <FiCheckCircle className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold">{stats.approvedProperties}</div>
            <div className="text-white/70 text-xs mt-2">status = active</div>
          </div>

          {/* Pending Approval */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Pending Review</span>
              <FiClock className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold">{stats.pendingApprovals}</div>
            <div className="text-white/70 text-xs mt-2">Awaiting moderation</div>
          </div>

          {/* Rejected */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Rejected</span>
              <FiXCircle className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold">{stats.rejectedProperties}</div>
            <div className="text-white/70 text-xs mt-2">status = rejected</div>
          </div>
        </div>

        {/* Second Row: Additional Property Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Draft */}
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Draft</span>
              <FiHome className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold">{stats.draftProperties}</div>
            <div className="text-white/70 text-xs mt-2">Incomplete listings</div>
          </div>

          {/* This Week */}
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">This Week</span>
              <FiActivity className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold">{stats.thisWeekProperties}</div>
            <div className="text-white/70 text-xs mt-2">New submissions</div>
          </div>

          {/* Quick Access */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Quick Action</span>
              <FiActivity className="text-3xl opacity-80" />
            </div>
            <Link
              href="/master/listings"
              className="inline-block mt-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors text-sm"
            >
              Review Queue →
            </Link>
          </div>
        </div>
      </section>

      {/* Leads & Conversion Metrics */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiActivity className="text-[#00A676]" />
          Leads & Conversion
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">{timeWindow==='all' ? 'Total Leads' : 'New Leads'}</span>
              <FiUsers className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-1">{timeWindow==='all' ? stats.leads : stats.newLeads}</div>
            <div className="text-white/70 text-xs">{timeWindow==='all' ? 'All sources' : 'Within selected window'}</div>
          </div>
          
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Property Views</span>
              <FiHome className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-1">{stats.conversionMetrics.window.views.toLocaleString()}</div>
            <div className="text-white/70 text-xs">{timeWindow==='all' ? 'All time' : 'Within selected window'}</div>
          </div>
          
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Contact Rate</span>
              <FiActivity className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-1">{stats.conversionMetrics.window.viewToContactRate}</div>
            <div className="text-white/70 text-xs">Views → Contacts</div>
          </div>
          
          <div className="bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Lead Rate</span>
              <FiClock className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-1">{stats.conversionMetrics.window.contactToLeadRate}</div>
            <div className="text-white/70 text-xs">Contacts → Leads</div>
          </div>
        </div>
      </section>

      {/* Professional Network */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiUserPlus className="text-[#00A676]" />
          Professional Network
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Active Agents</span>
              <FiUserPlus className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-1">{stats.totalAgents}</div>
            <div className="text-white/70 text-xs">With credentials issued</div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Active Brokers</span>
              <FiUsers className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-1">{stats.totalBrokers}</div>
            <div className="text-white/70 text-xs">Managing teams</div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Pending Applications</span>
              <FiClock className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-1">{stats.pendingApplications}</div>
            <div className="text-white/70 text-xs">Awaiting review</div>
          </div>
        </div>
      </section>

      {/* Growth & Performance */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Is Viventa Growing?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className={`rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1 ${stats.growthMetrics.isGrowing ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'} text-white`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Platform Status</span>
              <FiActivity className="text-3xl opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats.growthMetrics.isGrowing ? '✓ Growing' : '✗ Declining'}</div>
            <div className="text-white/70 text-xs">Network health</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Leads Growth</span>
              <FiUsers className="text-3xl opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats.growthMetrics.leadsGrowth > 0 ? '+' : ''}{stats.growthMetrics.leadsGrowth}%</div>
            <div className="text-white/70 text-xs">vs previous period</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">User Growth</span>
              <FiUserPlus className="text-3xl opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats.growthMetrics.usersGrowth > 0 ? '+' : ''}{stats.growthMetrics.usersGrowth}%</div>
            <div className="text-white/70 text-xs">Total registrations</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Revenue Growth</span>
              <FiDollarSign className="text-3xl opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats.growthMetrics.revenueGrowth > 0 ? '+' : ''}{stats.growthMetrics.revenueGrowth}%</div>
            <div className="text-white/70 text-xs">Monthly trend</div>
          </div>
        </div>
      </section>

      {/* Top Brokers This Month */}
      {stats.topBrokers.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Top performing brokers</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">Broker</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">Leads This Month</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">Conversion Rate</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.topBrokers.slice(0, 5).map((broker) => (
                  <tr key={broker.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-[#0B2545]">{broker.name}</td>
                    <td className="px-6 py-4 text-gray-700">{broker.leadsThis}</td>
                    <td className="px-6 py-4 text-gray-700">{broker.conversionRate}%</td>
                    <td className="px-6 py-4 text-gray-700">${broker.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Lead Velocity & Registration Velocity Charts */}
      {(stats.leadVelocity.length > 0 || stats.registrationVelocity.length > 0) && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Velocity & Momentum</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stats.leadVelocity.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Lead velocity (last 7 days)</h3>
                <div className="space-y-3">
                  {stats.leadVelocity.map((day, idx) => {
                    const maxCount = Math.max(...stats.leadVelocity.map(d => d.count), 1)
                    const widthClass = day.count === 0 ? 'w-1' : day.count >= maxCount ? 'w-full' : day.count >= maxCount * 0.75 ? 'w-4/5' : day.count >= maxCount * 0.5 ? 'w-3/5' : day.count >= maxCount * 0.25 ? 'w-2/5' : 'w-1/5'
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-12">{day.day}</span>
                        <div className={`h-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 flex-1 mx-3 ${widthClass}`} />
                        <span className="text-sm font-semibold text-gray-800 w-12 text-right">{day.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {stats.registrationVelocity.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Registration velocity (last 7 days)</h3>
                <div className="space-y-3">
                  {stats.registrationVelocity.map((day, idx) => {
                    const maxCount = Math.max(...stats.registrationVelocity.map(d => d.count), 1)
                    const widthClass = day.count === 0 ? 'w-1' : day.count >= maxCount ? 'w-full' : day.count >= maxCount * 0.75 ? 'w-4/5' : day.count >= maxCount * 0.5 ? 'w-3/5' : day.count >= maxCount * 0.25 ? 'w-2/5' : 'w-1/5'
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-12">{day.day}</span>
                        <div className={`h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex-1 mx-3 ${widthClass}`} />
                        <span className="text-sm font-semibold text-gray-800 w-12 text-right">{day.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Link 
            href="/master/listings" 
            className="px-6 py-3 bg-gradient-to-r from-[#00A6A6] to-[#00C896] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <FiHome /> Review Listings
          </Link>
          <Link 
            href="/master/applications" 
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <FiClock /> Review Applications
          </Link>
          <Link 
            href="/master/users?invite=agent" 
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <FiUsers /> Invite Agent
          </Link>
          <Link 
            href="/master/users?invite=broker" 
            className="px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <FiUsers /> Invite Broker
          </Link>
          <Link 
            href="/master/recommendations" 
            className="px-6 py-3 bg-gradient-to-r from-[#0B2545] to-[#1d4f7a] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <FiMail /> Recommendation Pipeline
          </Link>
        </div>
      </section>
    </div>
  )
}
