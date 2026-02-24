import { useEffect, useState } from 'react'
import { useRequireRole } from '../../../lib/useRequireRole'
import AdminCodeModal from '../../../components/AdminCodeModal'

type ListingItem = {
  id: string
  title?: string
  description?: string
  city?: string
  neighborhood?: string
  price_usd?: number
  status?: string
}

export default function ListingsModeration() {
  const { loading, ok, showModal, setShowModal } = useRequireRole(['master_admin'])
  const [listings, setListings] = useState<ListingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!ok || showModal) return
    void loadListings()
  }, [ok, showModal])

  async function loadListings() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/properties?status=pending', { cache: 'no-store' })
      const json = await res.json().catch(() => ({ ok: false }))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load listings')
      }
      const data = Array.isArray(json.data) ? json.data : []
      setListings(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load listings'
      setError(message)
      setListings([])
    } finally {
      setIsLoading(false)
    }
  }

  async function approveListing(id: string) {
    try {
      const res = await fetch('/api/admin/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'active' }),
      })
      const json = await res.json().catch(() => ({ ok: false }))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to approve listing')
      }
      await loadListings()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve listing'
      alert(message)
    }
  }
  async function rejectListing(id: string) {
    try {
      const res = await fetch('/api/admin/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' }),
      })
      const json = await res.json().catch(() => ({ ok: false }))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to reject listing')
      }
      await loadListings()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reject listing'
      alert(message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (showModal) return <AdminCodeModal onVerified={() => setShowModal(false)} />
  if (!ok) return <div>Access denied</div>
  if (isLoading) return <div>Loading listings...</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Moderation Queue</h2>
      <div className="space-y-4">
        {listings.length === 0 && <div className="text-gray-500">No pending listings.</div>}
        {listings.map(l => (
          <div key={l.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="font-semibold text-lg">{l.title}</div>
              <div className="text-sm text-gray-600">{l.city}, {l.neighborhood} • USD {l.price_usd}</div>
              <div className="mt-2 text-gray-700">{l.description}</div>
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              <button onClick={() => approveListing(l.id)} className="px-3 py-2 bg-green-600 text-white rounded">Approve</button>
              <button onClick={() => rejectListing(l.id)} className="px-3 py-2 bg-red-600 text-white rounded">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
