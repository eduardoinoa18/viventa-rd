// app/admin/people/page.tsx
'use client'
import ProtectedClient from '@/app/auth/ProtectedClient'
import AdminSidebar from '@/components/AdminSidebar'
import AdminTopbar from '@/components/AdminTopbar'
import Link from 'next/link'

export default function PeopleHubPage() {
  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#0B2545]">People</h1>
              <p className="text-gray-600">Unified management for Users, Agents, Brokers, and Applications</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/admin/users" className="block bg-white rounded-lg shadow p-5 hover:shadow-lg transition-shadow border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Directory</div>
                <div className="text-xl font-semibold text-[#0B2545]">Users</div>
                <div className="mt-2 text-sm text-gray-600">Regular user accounts and status</div>
              </Link>

              <Link href="/admin/agents" className="block bg-white rounded-lg shadow p-5 hover:shadow-lg transition-shadow border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Professionals</div>
                <div className="text-xl font-semibold text-[#0B2545]">Agents</div>
                <div className="mt-2 text-sm text-gray-600">Approve, edit, and manage agents</div>
              </Link>

              <Link href="/admin/brokers" className="block bg-white rounded-lg shadow p-5 hover:shadow-lg transition-shadow border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Organizations</div>
                <div className="text-xl font-semibold text-[#0B2545]">Brokers</div>
                <div className="mt-2 text-sm text-gray-600">Manage brokerages and teams</div>
              </Link>

              <Link href="/admin/applications" className="block bg-white rounded-lg shadow p-5 hover:shadow-lg transition-shadow border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Onboarding</div>
                <div className="text-xl font-semibold text-[#0B2545]">Applications</div>
                <div className="mt-2 text-sm text-gray-600">Review and approve applications</div>
              </Link>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-900">
                Tip: Use this consolidated hub to keep your staff management simple. Detailed views remain available in each section above.
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}
