import { useState } from 'react'
import { useRequireRole } from '../../../lib/useRequireRole'
import AdminCodeModal from '../../../components/AdminCodeModal'

export default function BillingPage() {
  const { loading, ok, showModal, setShowModal } = useRequireRole(['master_admin'])
  const [product, setProduct] = useState('')
  const [price, setPrice] = useState('')

  if (loading) return <div>Loading...</div>
  if (showModal) return <AdminCodeModal onVerified={() => setShowModal(false)} />
  if (!ok) return <div>Access denied</div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Billing / Pricing</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Product Name</label>
          <input value={product} onChange={e => setProduct(e.target.value)} className="px-3 py-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Price</label>
          <input value={price} onChange={e => setPrice(e.target.value)} className="px-3 py-2 border rounded w-full" />
        </div>
        {/* TODO: Add save logic, connect to landing page, etc. */}
      </div>
    </div>
  )
}
