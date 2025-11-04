// app/admin/brokers/page.tsx
'use client'
import { useEffect, useState } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import CreateProfessionalModal from '../../../components/CreateProfessionalModal'
import { db } from '../../../lib/firebaseClient'
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import { FiBriefcase, FiCheck, FiX, FiEdit, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function AdminBrokersPage() {
  const [brokers, setBrokers] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const q = query(collection(db as any, 'users'), where('role', '==', 'broker'))
      const snap = await getDocs(q)
      const rows = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }))
      setBrokers(rows)
    } catch (e) { setBrokers([]) }
  }

  async function handleCreateBroker(data: any) {
    try {
      const response = await fetch('/api/admin/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Failed to create broker')
      }
      
      toast.success(`Broker created! Code: ${result.professionalCode}`)
      setShowModal(false)
      load()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create broker')
      throw error
    }
  }

  async function approveBroker(id: string) {
    try {
      await updateDoc(doc(db as any, 'users', id), {
        status: 'active',
        approvedAt: new Date(),
      })
      toast.success('Broker approved')
      load()
    } catch (e) {
      toast.error('Failed to approve broker')
    }
  }

  async function declineBroker(id: string) {
    if (!confirm('Are you sure you want to decline this broker?')) return
    try {
      await updateDoc(doc(db as any, 'users', id), {
        status: 'declined',
        declinedAt: new Date(),
      })
      toast.success('Broker declined')
      load()
    } catch (e) {
      toast.error('Failed to decline broker')
    }
  }

  async function deleteBroker(id: string) {
    if (!confirm('Are you sure you want to delete this broker? This action cannot be undone.')) return
    try {
      await deleteDoc(doc(db as any, 'users', id))
      toast.success('Broker deleted')
      load()
    } catch (e) {
      toast.error('Failed to delete broker')
    }
  }

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#0B2545]">Brokers</h1>
            <button 
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]"
            >
              <FiBriefcase /> Create Broker
            </button>
          </div>

          {showModal && (
            <CreateProfessionalModal 
              onClose={() => setShowModal(false)}
              onSubmit={handleCreateBroker}
              initialRole="broker"
            />
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4">Company</th>
                  <th className="text-left p-4">Contact</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {brokers.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">No brokers found</td></tr>
                ) : brokers.map(b => (
                  <tr key={b.id}>
                    <td className="p-4">{b.company || '-'}</td>
                    <td className="p-4">{b.name}</td>
                    <td className="p-4 text-gray-600">{b.email}</td>
                    <td className="p-4">{b.phone || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        b.status === 'active' ? 'bg-green-100 text-green-800' :
                        b.status === 'declined' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {b.status || 'pending'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {b.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveBroker(b.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Approve"
                              aria-label="Approve broker"
                            >
                              <FiCheck size={18} />
                            </button>
                            <button
                              onClick={() => declineBroker(b.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Decline"
                              aria-label="Decline broker"
                            >
                              <FiX size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteBroker(b.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                          aria-label="Delete broker"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
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
