// app/admin/agents/page.tsx
'use client'
import { useEffect, useState } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import { db } from '../../../lib/firebaseClient'
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { FiUserPlus, FiCheck, FiX, FiEdit, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', brokerage: '' })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const snap = await getDocs(collection(db as any, 'users'))
      const rows = snap.docs
        .map((d: any) => ({ id: d.id, ...(d.data() as any) }))
        .filter((u: any) => u.role === 'agent')
      setAgents(rows)
    } catch (e) {
      setAgents([])
    }
  }

  async function createAgent(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingId) {
        await updateDoc(doc(db as any, 'users', editingId), {
          name: form.name,
          email: form.email,
          phone: form.phone,
          brokerage: form.brokerage,
          updatedAt: new Date(),
        })
        toast.success('Agent updated successfully')
        setEditingId(null)
      } else {
        await addDoc(collection(db as any, 'users'), {
          name: form.name,
          email: form.email,
          phone: form.phone,
          brokerage: form.brokerage,
          role: 'agent',
          status: 'pending',
          createdAt: new Date(),
        })
        toast.success('Agent created successfully')
      }
      setShowForm(false)
      setForm({ name: '', email: '', phone: '', brokerage: '' })
      load()
    } catch (e) {
      toast.error('Failed to save agent')
    }
  }

  async function approveAgent(id: string) {
    try {
      await updateDoc(doc(db as any, 'users', id), {
        status: 'active',
        approvedAt: new Date(),
      })
      toast.success('Agent approved')
      load()
    } catch (e) {
      toast.error('Failed to approve agent')
    }
  }

  async function declineAgent(id: string) {
    if (!confirm('Are you sure you want to decline this agent?')) return
    try {
      await updateDoc(doc(db as any, 'users', id), {
        status: 'declined',
        declinedAt: new Date(),
      })
      toast.success('Agent declined')
      load()
    } catch (e) {
      toast.error('Failed to decline agent')
    }
  }

  async function deleteAgent(id: string) {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) return
    try {
      await deleteDoc(doc(db as any, 'users', id))
      toast.success('Agent deleted')
      load()
    } catch (e) {
      toast.error('Failed to delete agent')
    }
  }

  function editAgent(agent: any) {
    setForm({
      name: agent.name,
      email: agent.email,
      phone: agent.phone || '',
      brokerage: agent.brokerage || ''
    })
    setEditingId(agent.id)
    setShowForm(true)
  }

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#0B2545]">Agents</h1>
            <button
              onClick={() => {
                setEditingId(null)
                setForm({ name: '', email: '', phone: '', brokerage: '' })
                setShowForm(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]"
            >
              <FiUserPlus /> New Agent
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-lg shadow p-5 mb-6">
              <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Agent' : 'Create New Agent'}</h2>
              <form onSubmit={createAgent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="px-3 py-2 border rounded" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                <input className="px-3 py-2 border rounded" placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                <input className="px-3 py-2 border rounded" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <input className="px-3 py-2 border rounded" placeholder="Brokerage" value={form.brokerage} onChange={e => setForm({ ...form, brokerage: e.target.value })} />
                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-[#0B2545] text-white rounded hover:bg-[#0a1f3a]">
                    {editingId ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingId(null)
                      setForm({ name: '', email: '', phone: '', brokerage: '' })
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Brokerage</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {agents.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">No agents found</td></tr>
                ) : (
                  agents.map(a => (
                    <tr key={a.id}>
                      <td className="p-4">{a.name}</td>
                      <td className="p-4 text-gray-600">{a.email}</td>
                      <td className="p-4">{a.phone || '-'}</td>
                      <td className="p-4">{a.brokerage || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          a.status === 'active' ? 'bg-green-100 text-green-800' :
                          a.status === 'declined' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {a.status || 'pending'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {a.status === 'pending' && (
                            <>
                              <button
                                onClick={() => approveAgent(a.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded"
                                title="Approve"
                              >
                                <FiCheck size={18} />
                              </button>
                              <button
                                onClick={() => declineAgent(a.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Decline"
                              >
                                <FiX size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => editAgent(a)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => deleteAgent(a.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
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
