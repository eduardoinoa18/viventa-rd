// app/admin/users/page.tsx
'use client'
/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import CreateProfessionalModal from '../../../components/CreateProfessionalModal'
import { FiUserPlus, FiEdit, FiUserX, FiUserCheck, FiTrash2, FiX, FiRefreshCcw, FiEye, FiAward } from 'react-icons/fi'
import toast from 'react-hot-toast'
import AdminUserDetailsModal from '../../../components/AdminUserDetailsModal'

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

export default function AdminUsersPage() {
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

  useEffect(() => { load() }, [filterRole])

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
      // Always filter for role=user ONLY (regular users, not agents/brokers)
      const url = '/api/admin/users?role=user'
      const res = await fetch(url)
      const json = await res.json()
      if (json.ok) {
        // Client-side filter by status if needed
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

  async function approveProfessional(uid: string) {
    if (!confirm('Send welcome email with login credentials?')) return
    
    try {
      const res = await fetch('/api/admin/professionals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Professional approved and email sent!')
        load()
      } else {
        toast.error(json.error || 'Failed to approve professional')
      }
    } catch (e) {
      console.error('Failed to approve professional', e)
      toast.error('Failed to approve professional')
    }
  }

  async function syncFromAuth() {
    try {
      const res = await fetch('/api/admin/users/sync', { method: 'POST' })
      const json = await res.json()
      if (json.ok) {
        const { created, updated } = json.data || {}
        toast.success(`Synced users. Created: ${created || 0}, Updated: ${updated || 0}`)
        load()
      } else {
        toast.error(json.error || 'Failed to sync users')
      }
    } catch (e) {
      console.error('Failed to sync users', e)
      toast.error('Failed to sync users')
    }
  }

  function openCreateForm() {
    setEditingId(null)
    setForm({ name: '', email: '', phone: '', role: 'user', brokerage: '', company: '' })
    setShowForm(true)
  }

  function openEditForm(user: User) {
    setEditingId(user.id)
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      brokerage: user.brokerage || '',
      company: user.company || ''
    })
    setShowForm(true)
  }

  async function saveUser(e: React.FormEvent) {
    e.preventDefault()
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId
        ? { id: editingId, ...form }
        : form
      const res = await fetch('/api/admin/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = await res.json()
      if (json.ok) {
        toast.success(editingId ? 'User updated' : 'User created')
        setShowForm(false)
        setEditingId(null)
        setForm({ name: '', email: '', phone: '', role: 'user', brokerage: '', company: '' })
        load()
      } else {
        toast.error(json.error || 'Failed to save user')
      }
    } catch (e) {
      console.error('Failed to save user', e)
      toast.error('Failed to save user')
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (res.ok) {
        toast.success(`User ${status}`)
        load()
      } else {
        toast.error('Failed to update status')
      }
    } catch (e) {
      console.error('Failed to update user', e)
      toast.error('Failed to update user')
    }
  }

  async function deleteUser(id: string) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        toast.success('User deleted')
        load()
      } else {
        toast.error('Failed to delete user')
      }
    } catch (e) {
      console.error('Failed to delete user', e)
      toast.error('Failed to delete user')
    }
  }

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#0B2545]">User Management</h1>
              <p className="text-gray-600 mt-1">Manage users, agents, and brokers</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={() => {
                  setProfessionalRole('agent')
                  setShowProfessionalModal(true)
                }} 
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]"
              >
                <FiAward /> Create Agent
              </button>
              <button 
                onClick={() => {
                  setProfessionalRole('broker')
                  setShowProfessionalModal(true)
                }} 
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0B2545] to-[#134074] text-white rounded-lg font-semibold hover:shadow-lg"
              >
                <FiAward /> Create Broker
              </button>
              <button onClick={syncFromAuth} className="inline-flex items-center gap-2 px-4 py-2 border border-[#00A676] text-[#00A676] rounded-lg font-semibold hover:bg-[#00A676] hover:text-white">
                <FiRefreshCcw /> Sync from Auth
              </button>
              <button onClick={openCreateForm} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">
                <FiUserPlus /> New User
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 mt-0.5">ℹ️</div>
              <div>
                <p className="text-sm text-blue-900 font-medium">Esta página muestra únicamente usuarios regulares (role: 'user')</p>
                <p className="text-xs text-blue-800 mt-1">
                  Los <strong>Agentes</strong> y <strong>Brokers</strong> se gestionan en sus respectivas pestañas con credenciales y permisos especiales.
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="font-semibold text-gray-700">Filter by status:</label>
              <select id="status-filter" value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-3 py-2 border rounded" aria-label="Filter users by status">
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <label htmlFor="search-input" className="font-semibold text-gray-700">Search:</label>
              <input
                id="search-input"
                type="text"
                placeholder="Name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                aria-label="Search users by name, email, or phone"
              />
            </div>
          </div>

          {/* User Form (Create/Edit) */}
          {showForm && (
            <div className="bg-white rounded-lg shadow p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{editingId ? 'Edit User' : 'Create New User'}</h2>
                <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-gray-500 hover:text-gray-700" aria-label="Close form">
                  <FiX size={24} />
                </button>
              </div>
              <form onSubmit={saveUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="px-3 py-2 border rounded" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                <input className="px-3 py-2 border rounded" placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                <input className="px-3 py-2 border rounded" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <input type="hidden" value="user" />
                <p className="md:col-span-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <strong>Nota:</strong> Usuarios creados aquí tendrán role='user'. Para crear Agentes o Brokers, usa sus respectivas páginas.
                </p>
                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-[#0B2545] text-white rounded hover:bg-[#0B2545]/90">{editingId ? 'Update' : 'Create'}</button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {!loading && (
              <div className="px-4 py-3 bg-gray-50 border-b text-sm text-gray-600">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            )}
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Joined</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={7} className="p-4 text-center text-gray-500">Loading...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">No users found</td></tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td className="p-4 font-medium">{u.name}</td>
                      <td className="p-4 text-gray-600">{u.email}</td>
                      <td className="p-4">{u.phone || '-'}</td>
                      <td className="p-4 text-sm text-gray-500">
                        {u.lastLoginAt ? new Date(u.lastLoginAt.seconds ? u.lastLoginAt.seconds * 1000 : u.lastLoginAt).toLocaleDateString('es-DO') : 'Never'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          u.status === 'active' ? 'bg-green-100 text-green-800' :
                          u.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => setDetails(u)} className="p-2 text-gray-700 hover:text-[#0B2545] hover:bg-gray-50 rounded transition-colors" title="View Details">
                            <FiEye size={18} />
                          </button>
                          {u.status === 'pending' && (u.role === 'agent' || u.role === 'broker') && (
                            <button 
                              onClick={() => approveProfessional(u.uid || u.id)} 
                              className="p-2 text-white bg-[#00A676] hover:bg-[#008F64] rounded transition-colors" 
                              title="Approve & Send Credentials"
                            >
                              <FiAward size={18} />
                            </button>
                          )}
                          {u.status === 'pending' && u.role !== 'agent' && u.role !== 'broker' && (
                            <button onClick={() => updateStatus(u.id, 'active')} className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors" title="Approve">
                              <FiUserCheck size={18} />
                            </button>
                          )}
                          {u.status === 'active' && (
                            <button onClick={() => updateStatus(u.id, 'suspended')} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors" title="Suspend">
                              <FiUserX size={18} />
                            </button>
                          )}
                          {u.status === 'suspended' && (
                            <button onClick={() => updateStatus(u.id, 'active')} className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors" title="Activate">
                              <FiUserCheck size={18} />
                            </button>
                          )}
                          <button onClick={() => openEditForm(u)} className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors" title="Edit">
                            <FiEdit size={18} />
                          </button>
                          <button onClick={() => deleteUser(u.id)} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors" title="Delete">
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Details Modal - with admin editing */}
          {details && (
            <AdminUserDetailsModal 
              user={{
                id: details.id,
                uid: details.uid || details.id,
                name: details.name,
                email: details.email,
                phone: details.phone,
                role: details.role,
                status: details.status,
                company: (details as any).company,
                brokerage: (details as any).brokerage,
                emailVerified: details.emailVerified,
                verified: (details as any).verified,
                professionalCode: (details as any).professionalCode,
                agentCode: (details as any).agentCode,
                brokerCode: (details as any).brokerCode,
              }}
              onClose={() => setDetails(null)}
              onSaved={() => load()}
            />
          )}

          {/* Professional Creation Modal */}
          {showProfessionalModal && (
            <CreateProfessionalModal
              onClose={() => setShowProfessionalModal(false)}
              onSubmit={createProfessional}
              initialRole={professionalRole}
            />
          )}
        </main>
      </div>
    </ProtectedClient>
  )
}
