import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { useRequireRole } from '../../../lib/useRequireRole'
import AdminCodeModal from '../../../components/AdminCodeModal'

type ApplicationItem = {
  id: string
  status?: string
  company?: string
  type?: string
  contact?: string
  email?: string
  agents?: string | number
  notes?: string
  brokerage_id?: string
  agent_id?: string
  inviteToken?: string
  years?: string
  markets?: string
  license?: string
  address?: string
  currency?: string
}

export default function ApplicationsQueue() {
  const { loading, ok, showModal, setShowModal } = useRequireRole(['master_admin'])
  const [items, setItems] = useState<ApplicationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('pending')
  const [selected, setSelected] = useState<ApplicationItem | null>(null)
  
  useEffect(() => {
    if (!ok || showModal) return
    void loadApplications(filter)
  }, [ok, showModal, filter])

  async function loadApplications(statusFilter: string) {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      const url = params.toString() ? `/api/admin/applications?${params}` : '/api/admin/applications'
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json().catch(() => ({ ok: false }))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load applications')
      }
      setItems(Array.isArray(json.data) ? json.data : [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load applications'
      setError(message)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  async function setStatus(id: string, status: 'approved' | 'rejected' | 'more_info') {
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const json = await res.json().catch(() => ({ ok: false }))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to update status')
      }
      await loadApplications(filter)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to process'
      alert(message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (showModal) return <AdminCodeModal onVerified={() => setShowModal(false)} />
  if (!ok) return <div>Access denied</div>
  if (isLoading) return <div>Loading applications...</div>
  if (error) return <div className="text-red-600">{error}</div>

  const filtered = items.filter(app => (filter === 'all' ? true : (app.status || 'pending') === filter))

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Applications</h2>
      <div className="mb-4 flex space-x-2">
        {['pending', 'approved', 'rejected', 'more_info', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded ${filter === f ? 'bg-[#004AAD] text-white' : 'bg-gray-100'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(app => (
          <div key={app.id} className="bg-white rounded shadow p-4 cursor-pointer" onClick={() => setSelected(app)}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{app.company} • {app.type}</div>
                <div className="text-sm text-gray-600">{app.contact} • {app.email} • Agents: {app.agents}</div>
              </div>
              <div className="space-x-2">
                <button onClick={e => { e.stopPropagation(); setStatus(app.id, 'approved') }} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                <button onClick={e => { e.stopPropagation(); setStatus(app.id, 'more_info') }} className="px-3 py-1 bg-yellow-600 text-white rounded">More info</button>
                <button onClick={e => { e.stopPropagation(); setStatus(app.id, 'rejected') }} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
              </div>
            </div>
            <div className="mt-2 text-gray-700 text-sm">{app.notes}</div>
            {app.brokerage_id && <div className="mt-1 text-xs text-blue-700">Brokerage ID: {app.brokerage_id}</div>}
            {app.agent_id && <div className="mt-1 text-xs text-blue-700">Agent ID: {app.agent_id}</div>}
          </div>
        ))}
      </div>
      <Dialog open={!!selected} onClose={() => setSelected(null)} className="fixed z-50 inset-0 flex items-center justify-center">
        {!!selected && <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />}
        {selected && (
          <div className="bg-white rounded shadow-lg p-6 max-w-lg mx-auto relative">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setSelected(null)}>×</button>
            <h3 className="text-lg font-bold mb-2">{selected.company} ({selected.type})</h3>
            <div className="mb-2 text-sm text-gray-700">Contact: {selected.contact} • {selected.email}</div>
            <div className="mb-2 text-sm">Agents: {selected.agents} | Years: {selected.years}</div>
            <div className="mb-2 text-sm">Markets: {selected.markets}</div>
            <div className="mb-2 text-sm">License: {selected.license}</div>
            <div className="mb-2 text-sm">Address: {selected.address}</div>
            <div className="mb-2 text-sm">Currency: {selected.currency}</div>
            <div className="mb-2 text-sm">Notes: {selected.notes}</div>
            {selected.brokerage_id && <div className="mb-2 text-xs text-blue-700">Brokerage ID: {selected.brokerage_id}</div>}
            {selected.agent_id && <div className="mb-2 text-xs text-blue-700">Agent ID: {selected.agent_id}</div>}
            {selected.inviteToken && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded">
                <span className="text-xs font-semibold text-green-700">Invite Token:</span>
                <code className="ml-2 text-xs text-green-800">{selected.inviteToken}</code>
              </div>
            )}
            <div className="mt-4">
              <strong>Audit History:</strong>
              <div className="text-xs text-gray-500">(Coming soon)</div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
