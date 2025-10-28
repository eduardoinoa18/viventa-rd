// app/admin/properties/page.tsx
'use client'
import { useState, useEffect } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import Link from 'next/link'
import { FiCheck, FiX, FiMapPin, FiDollarSign, FiEye, FiPlusSquare, FiEdit, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'

type Listing = { id: string; title: string; location?: string; city?: string; price: number; status: string; agentName?: string; agent?: string }

export default function AdminPropertiesPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { load() }, [statusFilter])

  async function load() {
    setLoading(true)
    try {
      const url = statusFilter === 'all' ? '/api/admin/properties' : `/api/admin/properties?status=${statusFilter}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.ok) setListings(json.data || [])
    } catch (e) {
      console.error('Failed to load properties', e)
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  async function approve(id: string) {
    try {
      const res = await fetch('/api/admin/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'active' })
      })
      if (res.ok) {
        toast.success('Property approved')
        load()
      } else {
        toast.error('Failed to approve property')
      }
    } catch (e) {
      console.error('Failed to approve property', e)
      toast.error('Failed to approve property')
    }
  }

  async function reject(id: string) {
    try {
      const res = await fetch('/api/admin/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' })
      })
      if (res.ok) {
        toast.success('Property rejected')
        load()
      } else {
        toast.error('Failed to reject property')
      }
    } catch (e) {
      console.error('Failed to reject property', e)
      toast.error('Failed to reject property')
    }
  }

  async function deleteListing(id: string) {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return
    try {
      const res = await fetch('/api/admin/properties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        toast.success('Property deleted')
        load()
      } else {
        toast.error('Failed to delete property')
      }
    } catch (e) {
      console.error('Failed to delete property', e)
      toast.error('Failed to delete property')
    }
  }

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#0B2545]">Property Listings</h1>
            <div className="flex gap-2 items-center">
              <Link href="/admin/properties/create" className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]">
                <FiPlusSquare /> New Listing
              </Link>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-lg shadow p-5 text-center text-gray-500">Loading...</div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-5 text-center text-gray-500">No properties found</div>
            ) : (
              listings.map(l => (
                <div key={l.id} className="bg-white rounded-lg shadow p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{l.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          l.status === 'active' ? 'bg-green-100 text-green-800' :
                          l.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          l.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {l.status}
                        </span>
                      </div>
                      <div className="text-gray-600 space-y-1">
                        <div className="flex items-center gap-2"><FiMapPin /> {l.location || l.city || 'N/A'}</div>
                        <div className="flex items-center gap-2"><FiDollarSign /> <span className="font-semibold text-[#00A676]">USD {l.price.toLocaleString()}</span></div>
                        <div className="text-sm">Agent: <span className="text-blue-600">{l.agentName || l.agent || 'N/A'}</span></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {l.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => approve(l.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] transition-colors"
                          >
                            <FiCheck /> Approve
                          </button>
                          <button 
                            onClick={() => reject(l.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                          >
                            <FiX /> Reject
                          </button>
                        </>
                      )}
                      <div className="flex gap-2">
                        <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                          <FiEye /> View
                        </button>
                        <button className="inline-flex items-center gap-2 px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm">
                          <FiEdit /> Edit
                        </button>
                        <button 
                          onClick={() => deleteListing(l.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}
