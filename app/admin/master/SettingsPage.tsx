import { useState } from 'react'
import { useRequireRole } from '../../../lib/useRequireRole'
import AdminCodeModal from '../../../components/AdminCodeModal'

export default function SettingsPage() {
  const { loading, ok, showModal, setShowModal } = useRequireRole(['master_admin'])
  const [company, setCompany] = useState('VIVENTA')
  const [region, setRegion] = useState('Dominican Republic')
  const [pricing, setPricing] = useState('')

  if (loading) return <div>Loading...</div>
  if (showModal) return <AdminCodeModal onVerified={() => setShowModal(false)} />
  if (!ok) return <div>Access denied</div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Company Name</label>
          <input value={company} onChange={e => setCompany(e.target.value)} className="px-3 py-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Region</label>
          <input value={region} onChange={e => setRegion(e.target.value)} className="px-3 py-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Pricing Table</label>
          <textarea value={pricing} onChange={e => setPricing(e.target.value)} className="px-3 py-2 border rounded w-full" rows={4} />
        </div>
        {/* TODO: Add save logic, translation editor, etc. */}
      </div>
    </div>
  )
}
