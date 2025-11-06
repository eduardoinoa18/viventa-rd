// app/admin/agents/page.tsx
'use client'
import { useEffect, useState } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import CreateProfessionalModal from '../../../components/CreateProfessionalModal'
import { db } from '../../../lib/firebaseClient'
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import { FiUserPlus, FiCheck, FiX, FiEdit, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      // Query both agents collection and users collection for backwards compatibility
      const [agentsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db as any, 'agents')),
        getDocs(query(collection(db as any, 'users'), where('role', '==', 'agent')))
      ])
      
      // Combine results, using Map to deduplicate by uid
      const agentsMap = new Map()
      
      agentsSnap.docs.forEach((d: any) => {
        const data = d.data() as any
        agentsMap.set(d.id, { id: d.id, ...data })
      })
      
      usersSnap.docs.forEach((d: any) => {
        const data = d.data() as any
        if (!agentsMap.has(d.id)) {
          agentsMap.set(d.id, { id: d.id, ...data })
        }
      })
      
      const rows = Array.from(agentsMap.values())
      setAgents(rows)
    } catch (e) {
      console.error('Failed to load agents:', e)
      setAgents([])
    }
  }

  async function handleCreateAgent(data: any) {
    try {
      const response = await fetch('/api/admin/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Failed to create agent')
      }
      
      toast.success(`Agent created! Code: ${result.professionalCode}`)
      setShowModal(false)
      load()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create agent')
      throw error
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

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#0B2545]">Agents</h1>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]"
            >
              <FiUserPlus /> Create Agent
            </button>
          </div>

          {showModal && (
            <CreateProfessionalModal 
              onClose={() => setShowModal(false)}
              onSubmit={handleCreateAgent}
              initialRole="agent"
            />
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
                                aria-label="Approve agent"
                              >
                                <FiCheck size={18} />
                              </button>
                              <button
                                onClick={() => declineAgent(a.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Decline"
                                aria-label="Decline agent"
                              >
                                <FiX size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteAgent(a.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                            aria-label="Delete agent"
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
