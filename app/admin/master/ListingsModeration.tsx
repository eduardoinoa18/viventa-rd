import { useEffect, useState } from 'react'
import { db } from '../../../lib/firebaseClient'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { useRequireRole } from '../../../lib/useRequireRole'
import AdminCodeModal from '../../../components/AdminCodeModal'

export default function ListingsModeration() {
  const { loading, ok, showModal, setShowModal } = useRequireRole(['master_admin'])
  const [listings, setListings] = useState<any[]>([])
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'listings'), (snap: any) => {
      setListings(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })).filter((l: any) => l.status === 'pending'))
    })
    return () => unsub()
  }, [])

  async function approveListing(id: string) {
    await updateDoc(doc(db, 'listings', id), { status: 'active', verified: true, updatedAt: new Date() })
    // TODO: Write audit log entry
  }
  async function rejectListing(id: string) {
    await updateDoc(doc(db, 'listings', id), { status: 'rejected', updatedAt: new Date() })
    // TODO: Write audit log entry
  }

  if (loading) return <div>Loading...</div>
  if (showModal) return <AdminCodeModal onVerified={() => setShowModal(false)} />
  if (!ok) return <div>Access denied</div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Moderation Queue</h2>
      <div className="space-y-4">
        {listings.length === 0 && <div className="text-gray-500">No pending listings.</div>}
        {listings.map(l => (
          <div key={l.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="font-semibold text-lg">{l.title}</div>
              <div className="text-sm text-gray-600">{l.city}, {l.neighborhood} • USD {l.price_usd}</div>
              <div className="mt-2 text-gray-700">{l.description}</div>
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              <button onClick={() => approveListing(l.id)} className="px-3 py-2 bg-green-600 text-white rounded">Approve</button>
              <button onClick={() => rejectListing(l.id)} className="px-3 py-2 bg-red-600 text-white rounded">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
