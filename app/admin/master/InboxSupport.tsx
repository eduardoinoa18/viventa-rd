import { useEffect, useState } from 'react'
import { db } from '../../../lib/firebaseClient'
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { useRequireRole } from '../../../lib/useRequireRole'
import AdminCodeModal from '../../../components/AdminCodeModal'

export default function InboxSupport() {
  const { loading, ok, showModal, setShowModal } = useRequireRole(['master_admin'])
  const [tickets, setTickets] = useState<any[]>([])
  const [message, setMessage] = useState('')
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tickets'), (snap: any) => {
      setTickets(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  async function sendMessage() {
    if (!message) return
    await addDoc(collection(db, 'tickets'), { message, createdAt: serverTimestamp(), status: 'open' })
    setMessage('')
  }

  if (loading) return <div>Loading...</div>
  if (showModal) return <AdminCodeModal onVerified={() => setShowModal(false)} />
  if (!ok) return <div>Access denied</div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Inbox / Support</h2>
      <div className="mb-4 flex space-x-2">
        <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." className="px-3 py-2 border rounded w-full" />
        <button onClick={sendMessage} className="px-3 py-2 bg-[#00A6A6] text-white rounded">Send</button>
      </div>
      <div className="space-y-4">
        {tickets.length === 0 && <div className="text-gray-500">No tickets found.</div>}
        {tickets.map(t => (
          <div key={t.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="font-semibold text-lg">{t.message}</div>
              <div className="text-sm text-gray-600">Status: {t.status}</div>
              <div className="text-xs text-gray-500">{new Date(t.createdAt?.seconds*1000).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
