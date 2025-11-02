import { useEffect, useState } from 'react'
import { db } from '../../../lib/firebaseClient'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { useRequireRole } from '../../../lib/useRequireRole'
import AdminCodeModal from '../../../components/AdminCodeModal'

export default function BrokeragesManagement() {
  const { loading, ok, showModal, setShowModal } = useRequireRole(['master_admin'])
  const [brokerages, setBrokerages] = useState<any[]>([])
  const [name, setName] = useState('')
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'brokerages'), (snap: any) => {
      setBrokerages(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  async function createBrokerage() {
    if (!name) return
    await updateDoc(doc(db, 'brokerages', name), { name })
    setName('')
    // TODO: Write audit log entry
  }

  if (loading) return <div>Loading...</div>
  if (showModal) return <AdminCodeModal onVerified={() => setShowModal(false)} />
  if (!ok) return <div>Access denied</div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Brokerages Management</h2>
      <div className="mb-4 flex space-x-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Brokerage Name" className="px-3 py-2 border rounded" />
        <button onClick={createBrokerage} className="px-3 py-2 bg-[#00A6A6] text-white rounded">Create</button>
      </div>
      <div className="space-y-4">
        {brokerages.length === 0 && <div className="text-gray-500">No brokerages found.</div>}
        {brokerages.map(b => (
          <div key={b.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="font-semibold text-lg">{b.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
