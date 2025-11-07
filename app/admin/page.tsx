// app/admin/page.tsx
'use client'
import ProtectedClient from '../auth/ProtectedClient'
import AdminWidget from '../../components/AdminWidget'
import AdminSidebar from '../../components/AdminSidebar'
import AdminTopbar from '../../components/AdminTopbar'
import ActivityWidget from '../../components/ActivityWidget'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FiUsers, FiHome, FiDollarSign, FiClock, FiUserPlus, FiCreditCard, FiActivity } from 'react-icons/fi'

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeListings: 0,
    monthlyRevenueUSD: 0,
    pendingApprovals: 0,
    leads: 0,
    totalAgents: 0,
    totalBrokers: 0,
    pendingApplications: 0,
    window: 'all' as 'all'|'day'|'week'|'month',
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
  })
  const [timeWindow, setTimeWindow] = useState<'all'|'day'|'week'|'month'>('all')

  useEffect(() => {
    const url = `/api/admin/stats${timeWindow && timeWindow !== 'all' ? `?window=${timeWindow}` : ''}`
    fetch(url)
      .then(r => r.json())
      .then((statsRes) => {
        const baseStats = statsRes?.ok ? statsRes.data : {}
        const agents = baseStats.roleCounts?.agents ?? 0
        const brokers = baseStats.roleCounts?.brokers ?? 0
        setStats({
          ...baseStats,
          totalAgents: agents,
          totalBrokers: brokers,
          pendingApplications: baseStats.pendingApplications || 0,
          window: (baseStats.window || 'all'),
          newUsers: baseStats.newUsers || 0,
          listingsCreated: baseStats.listingsCreated || 0,
          newLeads: baseStats.newLeads || 0,
          conversionMetrics: baseStats.conversionMetrics || {
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
        })
      })
      .catch(() => {})
  }, [timeWindow])

  const [showActivity, setShowActivity] = useState(false)

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0B2545] to-[#00A676] bg-clip-text text-transparent mb-2">
              Master Admin Dashboard
            </h1>
            <p className="text-gray-600">Monitor your platform metrics and activity</p>
          </div>
          
          {/* Time window selector */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#00A676] to-[#008F64] text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm font-medium">{timeWindow==='all' ? 'Total Users' : 'New Users'}</span>
                <FiUsers className="text-3xl opacity-80" />
              </div>
              <div className="text-4xl font-bold mb-1">{timeWindow==='all' ? stats.totalUsers : stats.newUsers}</div>
              <div className="text-white/70 text-xs">{timeWindow==='all' ? 'All roles' : 'Within selected window'}</div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm font-medium">{timeWindow==='all' ? 'Active Listings' : 'New Listings'}</span>
                <FiHome className="text-3xl opacity-80" />
              </div>
              <div className="text-4xl font-bold mb-1">{timeWindow==='all' ? stats.activeListings : stats.listingsCreated}</div>
              <div className="text-white/70 text-xs">{timeWindow==='all' ? 'Published' : 'Within selected window'}</div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm font-medium">Monthly Revenue</span>
                <FiDollarSign className="text-3xl opacity-80" />
              </div>
              <div className="text-4xl font-bold mb-1">${Number(stats.monthlyRevenueUSD || 0).toLocaleString()}</div>
              <div className="text-white/70 text-xs">USD</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm font-medium">Pending Listings</span>
                <FiClock className="text-3xl opacity-80" />
              </div>
              <div className="text-4xl font-bold mb-1">{stats.pendingApprovals}</div>
              <div className="text-white/70 text-xs">Awaiting review</div>
            </div>
          </div>

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

          {/* Collapsible Activity Feed */}
          <section className="mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setShowActivity(!showActivity)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FiActivity className="text-[#00A676]" />
                  Recent Activity
                </h2>
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${showActivity ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showActivity && (
                <div className="p-5 border-t border-gray-200 animate-fadeIn">
                  <ActivityWidget />
                </div>
              )}
              
              {!showActivity && (
                <div className="px-5 pb-4 text-sm text-gray-500">
                  Click to view recent platform activity and events
                </div>
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="flex gap-3 flex-wrap">
              <Link 
                href="/admin/applications" 
                className="px-6 py-3 bg-gradient-to-r from-[#00A676] to-[#008F64] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                <FiUserPlus /> Review Applications
              </Link>
              <Link 
                href="/admin/users" 
                className="px-6 py-3 bg-gradient-to-r from-[#3BAFDA] to-[#2A9FC7] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                <FiUsers /> Manage Users
              </Link>
              <Link 
                href="/admin/properties" 
                className="px-6 py-3 bg-gradient-to-r from-[#0B2545] to-[#0a1f3a] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                <FiHome /> Review Listings
              </Link>
              <Link 
                href="/admin/leads" 
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                <FiActivity /> Manage Leads
              </Link>
              <Link 
                href="/social" 
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                <FiUsers /> Social Network
              </Link>
              <Link 
                href="/admin/settings" 
                className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                System Settings
              </Link>
            </div>
          </section>
        </main>
      </div>
    </ProtectedClient>
  )
}
