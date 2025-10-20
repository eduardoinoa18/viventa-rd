import { useEffect, useState } from 'react'
import { db } from '../../../lib/firebaseClient'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import type { QuerySnapshot, QueryDocumentSnapshot } from 'firebase/firestore'
import { useRequireRole } from '../../../lib/useRequireRole'
import AdminCodeModal from '../../../components/AdminCodeModal'

export default function UsersManagement() {
  const { loading, ok, showModal, setShowModal } = useRequireRole(['master_admin'])
  const [users, setUsers] = useState<any[]>([])
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap: any) => {
      setUsers(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  async function promote(uid: string) {
    await updateDoc(doc(db, 'users', uid), { role: 'master_admin' })
    // TODO: Write audit log entry
  }
  async function demote(uid: string) {
    await updateDoc(doc(db, 'users', uid), { role: 'agent' })
    // TODO: Write audit log entry
  }

  if (loading) return <div>Loading...</div>
  if (showModal) return <AdminCodeModal onVerified={() => setShowModal(false)} />
  if (!ok) return <div>Access denied</div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Users Management</h2>
      <div className="space-y-4">
        {users.length === 0 && <div className="text-gray-500">No users found.</div>}
        {users.map(u => (
          <div key={u.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="font-semibold text-lg">{u.displayName || u.email}</div>
              <div className="text-sm text-gray-600">Role: {u.role}</div>
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              {u.role !== 'master_admin' && <button onClick={() => promote(u.id)} className="px-3 py-2 bg-blue-600 text-white rounded">Promote to Master Admin</button>}
              {u.role === 'master_admin' && <button onClick={() => demote(u.id)} className="px-3 py-2 bg-gray-600 text-white rounded">Demote to Agent</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
