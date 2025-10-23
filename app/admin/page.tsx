// app/admin/page.tsx
'use client'
import ProtectedClient from '../auth/ProtectedClient'
import AdminWidget from '../../components/AdminWidget'
import AdminSidebar from '../../components/AdminSidebar'
import AdminTopbar from '../../components/AdminTopbar'
import Link from 'next/link'

export default function AdminPage() {
  // minimal demo stats; in production fetch from /api/admin/stats
  const stats = {
    totalUsers: 124,
    activeListings: 78,
    monthlyRevenueUSD: 4500,
    pendingApprovals: 3
  }

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <h1 className="text-3xl font-bold text-[#0B2545] mb-6">Master Admin Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <AdminWidget title="Total Users" value={stats.totalUsers} icon="👥" subtitle="+12 this month" />
            <AdminWidget title="Active Listings" value={stats.activeListings} icon="🏠" subtitle="78 approved" />
            <AdminWidget title="Monthly Revenue" value={`$${stats.monthlyRevenueUSD.toLocaleString()}`} icon="💰" subtitle="USD" />
            <AdminWidget title="Pending Approvals" value={stats.pendingApprovals} icon="⏳" subtitle="Awaiting review" />
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Activity</h2>
            <div className="bg-white rounded-lg shadow p-5">
              <ul className="divide-y divide-gray-200">
                <li className="py-3 flex items-start gap-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <div>User <strong className="text-[#00A676]">maría@demo.com</strong> requested Agent approval</div>
                    <div className="text-xs text-gray-500">2 hours ago</div>
                  </div>
                </li>
                <li className="py-3 flex items-start gap-3">
                  <span className="text-2xl">🏠</span>
                  <div>
                    <div>Listing <strong className="text-[#00A676]">#L-0012</strong> submitted by agent carlos@demo.com</div>
                    <div className="text-xs text-gray-500">5 hours ago</div>
                  </div>
                </li>
                <li className="py-3 flex items-start gap-3">
                  <span className="text-2xl">💳</span>
                  <div>
                    <div>Payment succeeded for Broker <strong className="text-[#00A676]">B-001</strong></div>
                    <div className="text-xs text-gray-500">1 day ago</div>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
            <div className="flex gap-3 flex-wrap">
              <Link href="/admin/users" className="px-6 py-3 bg-[#3BAFDA] text-white rounded-lg font-semibold hover:bg-[#2A9FC7] transition-colors">
                Manage Users
              </Link>
              <Link href="/admin/properties" className="px-6 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] transition-colors">
                Review Listings
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
