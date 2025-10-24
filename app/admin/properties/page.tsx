// app/admin/properties/page.tsx
'use client'
import { useState, useEffect } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import Link from 'next/link'
import { FiCheck, FiX, FiMapPin, FiDollarSign, FiEye, FiPlusSquare } from 'react-icons/fi'

type Listing = { id: string; title: string; city: string; price: number; status: string; agent: string }

export default function AdminPropertiesPage() {
  const [listings, setListings] = useState<Listing[]>([])

  useEffect(() => {
    // minimal mock. In production, fetch from /api/admin/properties
    setListings([
      { id: 'L-001', title: 'Casa Punta Cana', city: 'Punta Cana', price: 240000, status: 'pending', agent: 'carlos@demo.com' },
      { id: 'L-002', title: 'Condo Samaná', city: 'Samaná', price: 380000, status: 'active', agent: 'maria@demo.com' },
      { id: 'L-003', title: 'Villa Santo Domingo', city: 'Santo Domingo', price: 520000, status: 'pending', agent: 'ana@demo.com' }
    ])
  }, [])

  async function approve(id: string) {
    // call API to approve; here we update locally
    setListings(listings.map(l => l.id === id ? { ...l, status: 'active' } : l))
    // In production: await fetch('/api/admin/properties/approve', { method:'POST', body: JSON.stringify({ id })})
  }

  async function reject(id: string) {
    setListings(listings.map(l => l.id === id ? { ...l, status: 'rejected' } : l))
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
              <select className="px-3 py-2 border rounded">
                <option>All Status</option>
                <option>Pending</option>
                <option>Active</option>
                <option>Rejected</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {listings.map(l => (
              <div key={l.id} className="bg-white rounded-lg shadow p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{l.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        l.status === 'active' ? 'bg-green-100 text-green-800' :
                        l.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {l.status}
                      </span>
                    </div>
                    <div className="text-gray-600 space-y-1">
                      <div className="flex items-center gap-2"><FiMapPin /> {l.city}</div>
                      <div className="flex items-center gap-2"><FiDollarSign /> <span className="font-semibold text-[#00A676]">USD {l.price.toLocaleString()}</span></div>
                      <div className="text-sm">Agent: <span className="text-blue-600">{l.agent}</span></div>
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
                    <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <FiEye /> View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}
