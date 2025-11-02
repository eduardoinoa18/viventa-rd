import { useEffect, useState } from 'react'
import { db } from '../../../lib/firebaseClient'
import { collection, onSnapshot } from 'firebase/firestore'
import type { QuerySnapshot, QueryDocumentSnapshot } from 'firebase/firestore'
import { useRequireRole } from '../../../lib/useRequireRole'
import AdminCodeModal from '../../../components/AdminCodeModal'

export default function AuditLogs() {
  const { loading, ok, showModal, setShowModal } = useRequireRole(['master_admin'])
  const [logs, setLogs] = useState<any[]>([])
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'audit_logs'), (snap: any) => {
      setLogs(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  if (loading) return <div>Loading...</div>
  if (showModal) return <AdminCodeModal onVerified={() => setShowModal(false)} />
  if (!ok) return <div>Access denied</div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Audit Logs</h2>
      <div className="space-y-2">
        {logs.length === 0 && <div className="text-gray-500">No audit logs found.</div>}
        {logs.map(l => (
          <div key={l.id} className="bg-white rounded shadow p-3 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="font-semibold">{l.action}</div>
              <div className="text-sm text-gray-600">Actor: {l.actor_uid} • {new Date(l.timestamp?.seconds*1000).toLocaleString()}</div>
              <div className="text-xs text-gray-500">Object: {l.objectId}</div>
              <div className="text-xs text-gray-500">Details: {JSON.stringify(l.details)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
