// app/admin/people/page.tsx
'use client'
export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ProtectedClient from '@/app/auth/ProtectedClient'
import AdminSidebar from '@/components/AdminSidebar'
import AdminTopbar from '@/components/AdminTopbar'
import AdminPeopleTabs from '@/components/AdminPeopleTabs'
import CreateProfessionalModal from '@/components/CreateProfessionalModal'
import InviteModal from '@/components/InviteModal'
import { FiUserPlus, FiEdit, FiUserX, FiUserCheck, FiTrash2, FiX, FiRefreshCcw, FiEye, FiMail } from 'react-icons/fi'
import toast from 'react-hot-toast'
import AdminUserDetailsModal from '@/components/AdminUserDetailsModal'

type User = {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  status: string
  brokerage?: string
  company?: string
  photoURL?: string
  emailVerified?: boolean
  disabled?: boolean
  providerIds?: string[]
  lastLoginAt?: any
  uid?: string
  agentCode?: string
  brokerCode?: string
}

function PeopleUsersContent() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'user', brokerage: '', company: '' })
  const [filterRole, setFilterRole] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [details, setDetails] = useState<User | null>(null)
  const [showProfessionalModal, setShowProfessionalModal] = useState(false)
  const [professionalRole, setProfessionalRole] = useState<'agent' | 'broker'>('agent')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteType, setInviteType] = useState<'agent' | 'broker' | 'user'>('user')

  const searchParams = useSearchParams()
  const activeTab = (searchParams?.get('tab') || 'users') as 'users' | 'agents' | 'brokers'

  useEffect(() => { load() }, [filterRole, activeTab])

  useEffect(() => {
    const invite = searchParams?.get('invite')
    if (invite === 'agent' || invite === 'broker' || invite === 'user') {
      setInviteType(invite)
      setShowInviteModal(true)
    }
  }, [searchParams])

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.phone?.toLowerCase().includes(term) ||
      u.agentCode?.toLowerCase().includes(term) ||
      u.brokerCode?.toLowerCase().includes(term)
    )
  })

  async function load() {
    setLoading(true)
    try {
      const roleParam = activeTab === 'users' ? 'user' : activeTab === 'agents' ? 'agent' : 'broker'
      const url = `/api/admin/users?role=${encodeURIComponent(roleParam)}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.ok) {
        let filtered = json.data || []
        if (filterRole !== 'all') {
          filtered = filtered.filter((u: User) => u.status === filterRole)
        }
        setUsers(filtered)
      }
    } catch (e) {
      console.error('Failed to load users', e)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  async function createProfessional(data: any) {
    try {
      const res = await fetch('/api/admin/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`${data.role === 'broker' ? 'Broker' : 'Agent'} created successfully! Code: ${json.professionalCode}`)
        setShowProfessionalModal(false)
        load()
      } else {
        toast.error(json.error || 'Failed to create professional')
      }
    } catch (e) {
      console.error('Failed to create professional', e)
      toast.error('Failed to create professional')
    }
  }

  async function save() {
    try {
      const res = await fetch('/api/admin/users', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: editingId }),
      })
      const json = await res.json()
      if (json.ok) {
        toast.success(editingId ? 'User updated' : 'User created')
        setShowForm(false)
        setEditingId(null)
        setForm({ name: '', email: '', phone: '', role: 'user', brokerage: '', company: '' })
        load()
      } else {
        toast.error(json.error || 'Failed to save')
      }
    } catch (e) {
      console.error('Failed to save user', e)
      toast.error('Failed to save user')
    }
  }

  async function toggleStatus(uid: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uid, status: newStatus }),
      })
      const json = await res.json()
      if (json.ok) {
        toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
        load()
      } else {
        toast.error(json.error || 'Failed to update status')
      }
    } catch (e) {
      console.error('Failed to toggle status', e)
      toast.error('Failed to toggle status')
    }
  }

  async function deleteUser(uid: string) {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uid })
      })
      const json = await res.json()
      if (json.ok) {
        toast.success('User deleted')
        load()
      } else {
        toast.error(json.error || 'Failed to delete')
      }
    } catch (e) {
      console.error('Failed to delete user', e)
      toast.error('Failed to delete user')
    }
  }

  async function resetPassword(uid: string) {
    if (!confirm('Send password reset email to this user?')) return
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Password reset email sent')
      } else {
        toast.error(json.error || 'Failed to send reset email')
      }
    } catch (e) {
      console.error('Failed to reset password', e)
      toast.error('Failed to reset password')
    }
  }

  function editUser(u: User) {
    setForm({ name: u.name, email: u.email, phone: u.phone || '', role: u.role, brokerage: u.brokerage || '', company: u.company || '' })
    setEditingId(u.id)
    setShowForm(true)
  }

  async function setProfessionalStatus(uid: string, status: 'active' | 'declined') {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uid, status, approved: status === 'active' })
      })
      const json = await res.json()
      if (json.ok) {
        toast.success(status === 'active' ? 'Professional approved' : 'Professional declined')
        load()
      } else {
        toast.error(json.error || 'Failed to update status')
      }
    } catch (e) {
      console.error('Failed to update professional status', e)
      toast.error('Failed to update status')
    }
  }

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 bg-gray-50">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#0B2545]">People</h1>
              <p className="text-gray-600">Manage users, agents, and brokers</p>
            </div>
          </div>

          <AdminPeopleTabs />

          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              {/* People Tab Content */}
              <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex flex-wrap gap-2">
                  {activeTab === 'users' && (
                    <>
                      <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-[#00A676] text-white rounded-lg hover:bg-[#008F64] flex items-center gap-2 font-semibold"
                      >
                        <FiUserPlus /> Add User
                      </button>
                      <button
                        onClick={() => {
                          setInviteType('user')
                          setShowInviteModal(true)
                        }}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 font-semibold"
                      >
                        <FiMail /> Invite User
                      </button>
                    </>
                  )}
                  {activeTab === 'agents' && (
                    <>
                      <button
                        onClick={() => {
                          setProfessionalRole('agent')
                          setShowProfessionalModal(true)
                        }}
                        className="px-4 py-2 bg-[#0B2545] text-white rounded-lg hover:bg-[#1a3a5f] flex items-center gap-2 font-semibold"
                      >
                        <FiUserCheck /> Create Agent
                      </button>
                      <button
                        onClick={() => {
                          setInviteType('agent')
                          setShowInviteModal(true)
                        }}
                        className="px-4 py-2 border-2 border-[#0B2545] text-[#0B2545] rounded-lg hover:bg-[#0B2545] hover:text-white flex items-center gap-2 font-semibold transition-colors"
                      >
                        <FiMail /> Invite Agent
                      </button>
                    </>
                  )}
                  {activeTab === 'brokers' && (
                    <>
                      <button
                        onClick={() => {
                          setProfessionalRole('broker')
                          setShowProfessionalModal(true)
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-semibold"
                      >
                        <FiUserCheck /> Create Broker
                      </button>
                      <button
                        onClick={() => {
                          setInviteType('broker')
                          setShowInviteModal(true)
                        }}
                        className="px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-600 hover:text-white flex items-center gap-2 font-semibold transition-colors"
                      >
                        <FiMail /> Invite Broker
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={load}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <FiRefreshCcw className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>

              <div className="mb-4 flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search users"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  aria-label="Filter by status"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-12">Loading users...</div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {u.photoURL ? (
                                  <img src={u.photoURL} alt={u.name} className="w-10 h-10 rounded-full" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-[#0B2545] text-white flex items-center justify-center font-semibold">
                                    {u.name?.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-gray-900">{u.name}</div>
                                  <div className="text-sm text-gray-500">{u.role}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{u.email}</div>
                              {u.phone && <div className="text-sm text-gray-500">{u.phone}</div>}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  u.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {u.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setDetails(u)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                  title="View Details"
                                >
                                  <FiEye />
                                </button>
                                <button
                                  onClick={() => editUser(u)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <FiEdit />
                                </button>
                                {activeTab === 'users' ? (
                                  <button
                                    onClick={() => toggleStatus(u.id, u.status)}
                                    className={`p-2 rounded ${
                                      u.status === 'active'
                                        ? 'text-orange-600 hover:bg-orange-50'
                                        : 'text-green-600 hover:bg-green-50'
                                    }`}
                                    title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                                  >
                                    {u.status === 'active' ? <FiUserX /> : <FiUserCheck />}
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => setProfessionalStatus(u.id, 'active')}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                                      title="Approve"
                                      aria-label="Approve"
                                    >
                                      <FiUserCheck />
                                    </button>
                                    <button
                                      onClick={() => setProfessionalStatus(u.id, 'declined')}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                                      title="Decline"
                                      aria-label="Decline"
                                    >
                                      <FiUserX />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => deleteUser(u.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#0B2545]">{editingId ? 'Edit User' : 'Add User'}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-gray-500 hover:text-gray-700" aria-label="Close form">
                <FiX size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  id="user-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter user name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="user-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  id="user-phone"
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(809) 555-1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={save}
                  className="flex-1 px-4 py-2 bg-[#00A676] text-white rounded-lg hover:bg-[#008F64] font-semibold"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditingId(null) }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfessionalModal && (
        <CreateProfessionalModal
          initialRole={professionalRole}
          onClose={() => setShowProfessionalModal(false)}
          onSubmit={createProfessional}
        />
      )}

      {showInviteModal && (
        <InviteModal
          inviteType={inviteType}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {details && (
        <AdminUserDetailsModal
          user={details}
          onClose={() => setDetails(null)}
          onSaved={() => { setDetails(null); load(); }}
        />
      )}
    </ProtectedClient>
  )
}

export default function PeopleUsersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PeopleUsersContent />
    </Suspense>
  )
}
