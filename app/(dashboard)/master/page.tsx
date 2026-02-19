'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FiUsers, FiHome, FiDollarSign, FiClock, FiUserPlus, FiActivity, FiCheckCircle, FiXCircle } from 'react-icons/fi'

export default function MasterOverviewPage() {
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
  })
  const [timeWindow, setTimeWindow] = useState<'all'|'day'|'week'|'month'>('all')

  useEffect(() => {
    const url = `/api/admin/stats${timeWindow && timeWindow !== 'all' ? `?window=${timeWindow}` : ''}`
    fetch(url)
      .then(r => r.json())
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
          })
        }
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
            onClick={() => setTimeWindow(key as any)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${timeWindow===key ? 'bg-[#0B2545] text-white border-[#0B2545]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

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
        </div>
      </section>
    </div>
  )
}
