// app/admin/page.tsx
'use client'
import ProtectedClient from '../auth/ProtectedClient'
import AdminWidget from '../../components/AdminWidget'
import AdminSidebar from '../../components/AdminSidebar'
import AdminTopbar from '../../components/AdminTopbar'
import ActivityWidget from '../../components/ActivityWidget'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FiUsers, FiHome, FiDollarSign, FiClock, FiUserPlus, FiCreditCard } from 'react-icons/fi'

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
  })

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then((statsRes) => {
        const baseStats = statsRes?.ok ? statsRes.data : {}
        const agents = baseStats.roleCounts?.agents ?? 0
        const brokers = baseStats.roleCounts?.brokers ?? 0
        setStats({ ...baseStats, totalAgents: agents, totalBrokers: brokers, pendingApplications: baseStats.pendingApplications || 0 })
      })
      .catch(() => {})
  }, [])

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <h1 className="text-3xl font-bold text-[#0B2545] mb-6">Master Admin Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <AdminWidget title="Total Users" value={stats.totalUsers} icon={<FiUsers />} subtitle="All roles" />
            <AdminWidget title="Active Listings" value={stats.activeListings} icon={<FiHome />} subtitle="Published" />
            <AdminWidget title="Monthly Revenue" value={`$${Number(stats.monthlyRevenueUSD || 0).toLocaleString()}`} icon={<FiDollarSign />} subtitle="USD" />
            <AdminWidget title="Pending Listings" value={stats.pendingApprovals} icon={<FiClock />} subtitle="Awaiting review" />
          </div>

          {/* Professional Onboarding Stats */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Professional Network</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-sm font-medium">Active Agents</span>
                  <FiUserPlus className="text-2xl opacity-80" />
                </div>
                <div className="text-4xl font-bold mb-1">{stats.totalAgents}</div>
                <div className="text-white/70 text-xs">With credentials issued</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-sm font-medium">Active Brokers</span>
                  <FiUsers className="text-2xl opacity-80" />
                </div>
                <div className="text-4xl font-bold mb-1">{stats.totalBrokers}</div>
                <div className="text-white/70 text-xs">Managing teams</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-sm font-medium">Pending Applications</span>
                  <FiClock className="text-2xl opacity-80" />
                </div>
                <div className="text-4xl font-bold mb-1">{stats.pendingApplications}</div>
                <div className="text-white/70 text-xs">Awaiting review</div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <ActivityWidget />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
            <div className="flex gap-3 flex-wrap">
              <Link href="/admin/applications" className="px-6 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] transition-colors inline-flex items-center gap-2">
                <FiUserPlus /> Review Applications
              </Link>
              <Link href="/admin/users" className="px-6 py-3 bg-[#3BAFDA] text-white rounded-lg font-semibold hover:bg-[#2A9FC7] transition-colors inline-flex items-center gap-2">
                <FiUsers /> Manage Users
              </Link>
              <Link href="/admin/properties" className="px-6 py-3 bg-[#0B2545] text-white rounded-lg font-semibold hover:bg-[#0a1f3a] transition-colors inline-flex items-center gap-2">
                <FiHome /> Review Listings
              </Link>
              <Link href="/social" className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors inline-flex items-center gap-2">
                <FiUsers /> Social Network
              </Link>
              <Link href="/admin/settings" className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                System Settings
              </Link>
            </div>
          </section>
        </main>
      </div>
    </ProtectedClient>
  )
}
