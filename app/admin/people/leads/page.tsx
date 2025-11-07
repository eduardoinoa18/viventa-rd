// app/admin/people/leads/page.tsx
'use client'
import ProtectedClient from '@/app/auth/ProtectedClient'
import AdminSidebar from '@/components/AdminSidebar'
import AdminTopbar from '@/components/AdminTopbar'
import AdminPeopleTabs from '@/components/AdminPeopleTabs'
import { FiTarget, FiTrendingUp } from 'react-icons/fi'

export default function PeopleLeadsPage() {
  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 bg-gray-50">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#0B2545]">People</h1>
              <p className="text-gray-600">Manage users, agents, brokers, leads, and applications</p>
            </div>
          </div>

          <AdminPeopleTabs />

          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Leads Management</h2>
                <p className="text-sm text-gray-500">Track and manage property inquiries and potential clients</p>
              </div>

              {/* Placeholder for future CRM implementation */}
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="max-w-2xl mx-auto">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00A676]/10 rounded-full mb-4">
                    <FiTarget className="w-8 h-8 text-[#00A676]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#0B2545] mb-2">Leads Management Coming Soon</h3>
                  <p className="text-gray-600 mb-6">
                    A comprehensive CRM system to track property inquiries, contact submissions, and manage lead assignment workflows is in development.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <FiTrendingUp className="w-6 h-6 text-[#00A676] mb-2 mx-auto" />
                      <h4 className="font-semibold text-gray-900 mb-1">Auto-Assignment</h4>
                      <p className="text-sm text-gray-600">Automatically assign leads to available agents</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <FiTarget className="w-6 h-6 text-[#00A676] mb-2 mx-auto" />
                      <h4 className="font-semibold text-gray-900 mb-1">Lead Tracking</h4>
                      <p className="text-sm text-gray-600">Track status from inquiry to conversion</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <FiTrendingUp className="w-6 h-6 text-[#00A676] mb-2 mx-auto" />
                      <h4 className="font-semibold text-gray-900 mb-1">Analytics</h4>
                      <p className="text-sm text-gray-600">Performance metrics and conversion rates</p>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      <strong>For now:</strong> Property inquiries and contact submissions can be viewed in the Inbox tab. 
                      Lead assignment features will be added in the next update.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}
