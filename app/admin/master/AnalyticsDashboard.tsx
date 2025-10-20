import { useEffect, useState } from 'react'
import { db } from '../../../lib/firebaseClient'
import { collection, onSnapshot } from 'firebase/firestore'
import { useRequireRole } from '../../../lib/useRequireRole'
import AdminCodeModal from '../../../components/AdminCodeModal'

export default function AnalyticsDashboard() {
  const { loading, ok, showModal, setShowModal } = useRequireRole(['master_admin'])
  const [trends, setTrends] = useState<any[]>([])
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'search_trends'), (snap: any) => {
      setTrends(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  if (loading) return <div>Loading...</div>
  if (showModal) return <AdminCodeModal onVerified={() => setShowModal(false)} />
  if (!ok) return <div>Access denied</div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Analytics & Trends</h2>
      <div className="space-y-2">
        {trends.length === 0 && <div className="text-gray-500">No search trends found.</div>}
        {trends.map(t => (
          <div key={t.id} className="bg-white rounded shadow p-3 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="font-semibold">{t.query}</div>
              <div className="text-sm text-gray-600">Count: {t.count}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
