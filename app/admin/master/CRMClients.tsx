import { useEffect, useState } from 'react'
import { db } from '../../../lib/firebaseClient'
import { collection, onSnapshot } from 'firebase/firestore'
import { useRequireRole } from '../../../lib/useRequireRole'
import AdminCodeModal from '../../../components/AdminCodeModal'

export default function CRMClients() {
  const { loading, ok, showModal, setShowModal } = useRequireRole(['master_admin'])
  const [clients, setClients] = useState<any[]>([])
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clients'), (snap: any) => {
      setClients(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  if (loading) return <div>Loading...</div>
  if (showModal) return <AdminCodeModal onVerified={() => setShowModal(false)} />
  if (!ok) return <div>Access denied</div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Clients & CRM</h2>
      <div className="space-y-4">
        {clients.length === 0 && <div className="text-gray-500">No clients found.</div>}
        {clients.map(c => (
          <div key={c.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="font-semibold text-lg">{c.displayName || c.email}</div>
              <div className="text-sm text-gray-600">Saved Searches: {c.saved_searches?.length || 0}</div>
              <div className="text-sm text-gray-600">Favorites: {c.favorites?.length || 0}</div>
              <div className="text-sm text-gray-600">Contact History: {c.contact_history?.length || 0}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
