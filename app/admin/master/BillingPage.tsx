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
          <label htmlFor="product-name" className="block text-sm font-medium">Product Name</label>
          <input 
            id="product-name"
            type="text"
            value={product} 
            onChange={e => setProduct(e.target.value)} 
            placeholder="Enter product name"
            className="px-3 py-2 border rounded w-full" 
          />
        </div>
        <div>
          <label htmlFor="product-price" className="block text-sm font-medium">Price</label>
          <input 
            id="product-price"
            type="text"
            value={price} 
            onChange={e => setPrice(e.target.value)} 
            placeholder="Enter price (e.g., $29.99)"
            className="px-3 py-2 border rounded w-full" 
          />
        </div>
        {/* TODO: Add save button and API integration once Stripe is configured */}
      </div>
    </div>
  )
}
