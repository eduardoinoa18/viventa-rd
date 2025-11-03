import { useEffect, useState } from 'react'
import { db } from '../../../lib/firebaseClient'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { useRequireRole } from '../../../lib/useRequireRole'
import AdminCodeModal from '../../../components/AdminCodeModal'
import { FiRefreshCw, FiTool, FiInfo } from 'react-icons/fi'

export default function BrokeragesManagement() {
  const { loading, ok, showModal, setShowModal } = useRequireRole(['master_admin'])
  const [brokerages, setBrokerages] = useState<any[]>([])
  const [name, setName] = useState('')
  const [checking, setChecking] = useState(false)
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState<any | null>(null)
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
      {/* Migration tools */}
      <div className="mb-6 p-4 bg-white rounded shadow border">
        <div className="flex items-start gap-3">
          <div className="text-[#0B2545] mt-1"><FiTool /></div>
          <div className="flex-1">
            <div className="font-semibold text-[#0B2545] mb-1">Estandarizar brokerage_id</div>
            <div className="text-sm text-gray-600 mb-3 flex items-start gap-2">
              <FiInfo className="mt-0.5 flex-shrink-0" />
              <span>
                Esta utilidad asegura que todos los <strong>brokers</strong> y <strong>agentes</strong> tengan un <code>brokerage_id</code> consistente.
                Crea o asocia registros de <code>brokerages</code> cuando falten.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
                onClick={async () => {
                  setChecking(true)
                  try {
                    const res = await fetch('/api/admin/migrations/brokerage-id', { cache: 'no-store' })
                    const json = await res.json()
                    setSummary(json?.data || null)
                  } finally {
                    setChecking(false)
                  }
                }}
                disabled={checking || running}
                aria-label="Verificar consistencia"
              >
                <FiRefreshCw className={checking ? 'animate-spin' : ''} /> Verificar (dry-run)
              </button>
              <button
                className="inline-flex items-center gap-2 px-3 py-2 bg-[#00A676] text-white rounded hover:bg-[#008F64]"
                onClick={async () => {
                  setRunning(true)
                  try {
                    const res = await fetch('/api/admin/migrations/brokerage-id', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ dryRun: false })
                    })
                    const json = await res.json()
                    setSummary(json?.data || null)
                  } finally {
                    setRunning(false)
                  }
                }}
                disabled={running}
                aria-label="Ejecutar migración"
              >
                <FiTool className={running ? 'animate-spin' : ''} /> Estandarizar ahora
              </button>
              {summary && (
                <div className="text-xs text-gray-700 ml-2">
                  <span className="font-semibold">Resultado: </span>
                  {summary.dryRun ? 'Dry-run' : 'Ejecutado'} • Escaneados: {summary.scanned ?? summary.totalUsers ?? 0} • Actualizados: {summary.updated ?? 0} • Brokerages creados: {summary.createdBrokerages ?? 0} • Agentes sin id: {summary.agentsMissingBrokerageId ?? 0}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
