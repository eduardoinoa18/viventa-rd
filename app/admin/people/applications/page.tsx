// app/admin/people/applications/page.tsx
'use client'
import { useEffect, useState } from 'react'
import ProtectedClient from '@/app/auth/ProtectedClient'
import AdminSidebar from '@/components/AdminSidebar'
import AdminTopbar from '@/components/AdminTopbar'
import AdminPeopleTabs from '@/components/AdminPeopleTabs'
import { FiCheck, FiX, FiUser, FiUsers, FiBriefcase, FiTrash2 } from 'react-icons/fi'

export default function PeopleApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    loadApplications()
  }, [filter])

  async function loadApplications() {
    try {
      setLoading(true)
      const qs = filter === 'all' ? '' : `?status=${encodeURIComponent(filter)}`
      const res = await fetch(`/api/admin/applications${qs}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setApplications(json?.data || [])
    } catch (err: any) {
      console.error('Error loading applications:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    const app = applications.find((a) => a.id === id)
    if (!app) return

    const notes = prompt(`Add notes for ${status} (optional):`) || ''

    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes, adminEmail: 'admin@viventa.com' }),
      })

      if (!res.ok) throw new Error('Failed to update')
      
      const patchJson = await res.json().catch(() => null)

      // Send email notification
      await fetch('/api/admin/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: id,
          email: app.email,
          name: app.contact,
          status,
          notes,
          type: app.type,
          resetLink: patchJson?.resetLink,
          code: patchJson?.code,
        }),
      })

      loadApplications()
    } catch (err) {
      console.error('Error:', err)
      alert('Error updating application')
    }
  }

  async function deleteApplication(id: string) {
    if (!confirm('Delete this application permanently?')) return
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      loadApplications()
    } catch (err) {
      console.error('Error:', err)
      alert('Error deleting application')
    }
  }

  const filtered = applications.filter((a) => filter === 'all' || a.status === filter)

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
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Professional Applications</h2>
                <button
                  onClick={loadApplications}
                  className="px-4 py-2 bg-[#00A676] text-white rounded-lg hover:bg-[#008F64] font-semibold"
                >
                  Refresh
                </button>
              </div>

              {/* Filter tabs */}
              <div className="mb-6 flex gap-2 border-b">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                      filter === f
                        ? 'border-[#00A676] text-[#00A676]'
                        : 'border-transparent text-gray-600 hover:text-[#0B2545]'
                    }`}
                  >
                    {f === 'all' && 'All'}
                    {f === 'pending' && 'Pending'}
                    {f === 'approved' && 'Approved'}
                    {f === 'rejected' && 'Rejected'}
                    {' '}
                    <span className="text-xs">
                      ({applications.filter((a) => f === 'all' || a.status === f).length})
                    </span>
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading applications...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-600">No applications in this category</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filtered.map((app) => {
                    const typeIcon = app.type === 'broker' ? <FiUsers /> : app.type === 'agent' ? <FiUser /> : <FiBriefcase />
                    const typeLabel = app.type === 'broker' ? 'Broker' : app.type === 'agent' ? 'Agent' : 'Developer'
                    
                    return (
                      <div key={app.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-[#0B2545]/10 rounded-full text-[#0B2545]">
                              {typeIcon}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{app.contact || 'No name'}</div>
                              <div className="text-sm text-gray-600">{app.email}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {typeLabel} • {app.phone || 'No phone'} • {app.company || app.brokerage || '-'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                app.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : app.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {app.status || 'pending'}
                            </span>
                            {app.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateStatus(app.id, 'approved')}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                                  title="Approve"
                                  aria-label="Approve application"
                                >
                                  <FiCheck size={18} />
                                </button>
                                <button
                                  onClick={() => updateStatus(app.id, 'rejected')}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                  title="Reject"
                                  aria-label="Reject application"
                                >
                                  <FiX size={18} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => deleteApplication(app.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                              aria-label="Delete application"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}
