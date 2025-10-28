// app/admin/users/page.tsx
'use client'
import { useState, useEffect } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import { FiUserPlus, FiEdit, FiUserX, FiUserCheck, FiTrash2, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

type User = { id: string; name: string; email: string; phone?: string; role: string; status: string; brokerage?: string; company?: string }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'user', brokerage: '', company: '' })
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => { load() }, [filterRole])

  async function load() {
    setLoading(true)
    try {
      const url = filterRole === 'all' ? '/api/admin/users' : `/api/admin/users?role=${filterRole}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.ok) setUsers(json.data || [])
    } catch (e) {
      console.error('Failed to load users', e)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
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
            <h1 className="text-3xl font-bold text-[#0B2545]">User Management</h1>
            <button onClick={openCreateForm} className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]">
              <FiUserPlus /> New User
            </button>
          </div>

          {/* Filters */}
          <div className="mb-4 flex items-center gap-2">
            <label className="font-semibold text-gray-700">Filter by role:</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-3 py-2 border rounded">
              <option value="all">All</option>
              <option value="user">User</option>
              <option value="agent">Agent</option>
              <option value="broker">Broker</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* User Form (Create/Edit) */}
          {showForm && (
            <div className="bg-white rounded-lg shadow p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{editingId ? 'Edit User' : 'Create New User'}</h2>
                <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-gray-500 hover:text-gray-700">
                  <FiX size={24} />
                </button>
              </div>
              <form onSubmit={saveUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="px-3 py-2 border rounded" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                <input className="px-3 py-2 border rounded" placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                <input className="px-3 py-2 border rounded" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <select className="px-3 py-2 border rounded" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} required>
                  <option value="user">User</option>
                  <option value="agent">Agent</option>
                  <option value="broker">Broker</option>
                  <option value="admin">Admin</option>
                </select>
                <input className="px-3 py-2 border rounded" placeholder="Brokerage" value={form.brokerage} onChange={e => setForm({ ...form, brokerage: e.target.value })} />
                <input className="px-3 py-2 border rounded" placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-[#0B2545] text-white rounded hover:bg-[#0B2545]/90">{editingId ? 'Update' : 'Create'}</button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">No users found</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id}>
                      <td className="p-4">{u.name}</td>
                      <td className="p-4 text-gray-600">{u.email}</td>
                      <td className="p-4">{u.phone || '-'}</td>
                      <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{u.role}</span></td>
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
                          {u.status === 'pending' && (
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
        </main>
      </div>
    </ProtectedClient>
  )
}
