// app/dashboard/agent/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { getCurrentUser } from '../../../lib/authClient'
import ProtectedClient from '../../auth/ProtectedClient'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import Link from 'next/link'

export default function AgentDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [listings] = useState([
    { id: 1, title: 'Villa Example', price: 350000, status: 'active' }, 
    { id: 2, title: 'Apt Example', price: 220000, status: 'pending' }
  ])

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  return (
    <ProtectedClient allowed={['agent', 'broker', 'admin', 'master_admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#0B2545]">Hello, {user?.name || 'Agent'}</h1>
              <p className="text-gray-600 mt-1">Role: <span className="font-semibold text-[#00A676]">{user?.role}</span></p>
            </div>
            <Link href="/dashboard/agent/properties/new" className="px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]">
              + New Listing
            </Link>
          </div>

          <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-5">
              <div className="text-sm text-gray-500 mb-1">Active Listings</div>
              <div className="text-3xl font-bold text-[#0B2545]">{listings.length}</div>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <div className="text-sm text-gray-500 mb-1">Leads this month</div>
              <div className="text-3xl font-bold text-[#0B2545]">12</div>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <div className="text-sm text-gray-500 mb-1">Conversion Rate</div>
              <div className="text-3xl font-bold text-[#00A676]">18%</div>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <div className="text-sm text-gray-500 mb-1">Total Views</div>
              <div className="text-3xl font-bold text-[#0B2545]">1,234</div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#0B2545]">My Listings</h2>
            <div className="space-y-3">
              {listings.map(l => (
                <div key={l.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center hover:shadow-lg transition-shadow">
                  <div>
                    <div className="font-semibold text-lg">{l.title}</div>
                    <div className="text-gray-600">
                      USD <span className="font-bold text-[#00A676]">{l.price.toLocaleString()}</span>
                      <span className={`ml-3 px-2 py-1 rounded text-xs font-medium ${
                        l.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {l.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/properties/${l.id}`} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">
                      View
                    </Link>
                    <button className="px-3 py-1 text-red-600 text-sm hover:bg-red-50 rounded">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </ProtectedClient>
  )
}
