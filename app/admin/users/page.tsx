// app/admin/users/page.tsx
'use client'
import { useState, useEffect } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import { FiUserPlus, FiEdit, FiUserX, FiUserCheck } from 'react-icons/fi'

type User = { id: string; name: string; email: string; phone?: string; role: string; status: string; brokerage?: string; company?: string }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
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
    } finally {
      setLoading(false)
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const json = await res.json()
      if (json.ok) {
        setShowForm(false)
        setForm({ name: '', email: '', phone: '', role: 'user', brokerage: '', company: '' })
        load()
      }
    } catch (e) {
      console.error('Failed to create user', e)
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (res.ok) load()
    } catch (e) {
      console.error('Failed to update user', e)
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
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]">
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

          {/* Create User Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow p-5 mb-6">
              <h2 className="text-xl font-bold mb-4">Create New User</h2>
              <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <button type="submit" className="px-4 py-2 bg-[#0B2545] text-white rounded">Create</button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button>
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
                      <td className="p-4 flex gap-2">
                        {u.status === 'pending' && (
                          <button onClick={() => updateStatus(u.id, 'active')} className="text-green-600 hover:text-green-800" title="Approve">
                            <FiUserCheck />
                          </button>
                        )}
                        {u.status === 'active' && (
                          <button onClick={() => updateStatus(u.id, 'suspended')} className="text-red-600 hover:text-red-800" title="Suspend">
                            <FiUserX />
                          </button>
                        )}
                        {u.status === 'suspended' && (
                          <button onClick={() => updateStatus(u.id, 'active')} className="text-green-600 hover:text-green-800" title="Activate">
                            <FiUserCheck />
                          </button>
                        )}
                        <button className="text-blue-600 hover:text-blue-800" title="Edit">
                          <FiEdit />
                        </button>
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
