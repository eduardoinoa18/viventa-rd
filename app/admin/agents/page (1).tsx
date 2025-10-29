// app/admin/agents/page.tsx
'use client'
import { useEffect, useState } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import { db } from '../../../lib/firebaseClient'
import { collection, getDocs, addDoc } from 'firebase/firestore'
import { FiUserPlus } from 'react-icons/fi'

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', brokerage: '' })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const snap = await getDocs(collection(db as any, 'users'))
      const rows = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) })).filter((u: any) => u.role === 'agent')
      setAgents(rows)
    } catch (e) {
      setAgents([])
    }
  }

  async function createAgent(e: React.FormEvent) {
    e.preventDefault()
    try {
      await addDoc(collection(db as any, 'users'), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        brokerage: form.brokerage,
        role: 'agent',
        status: 'pending',
        createdAt: new Date(),
      })
      setShowForm(false)
      setForm({ name: '', email: '', phone: '', brokerage: '' })
      load()
    } catch (e) {}
  }

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#0B2545]">Agents</h1>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]">
              <FiUserPlus /> New Agent
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-lg shadow p-5 mb-6">
              <form onSubmit={createAgent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="px-3 py-2 border rounded" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                <input className="px-3 py-2 border rounded" placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                <input className="px-3 py-2 border rounded" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <input className="px-3 py-2 border rounded" placeholder="Brokerage" value={form.brokerage} onChange={e => setForm({ ...form, brokerage: e.target.value })} />
                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-[#0B2545] text-white rounded">Create</button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button>
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
                </tr>
              </thead>
              <tbody className="divide-y">
                {agents.map(a => (
                  <tr key={a.id}>
                    <td className="p-4">{a.name}</td>
                    <td className="p-4 text-gray-600">{a.email}</td>
                    <td className="p-4">{a.phone || '-'}</td>
                    <td className="p-4">{a.brokerage || '-'}</td>
                    <td className="p-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">{a.status || 'pending'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}
