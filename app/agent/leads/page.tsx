'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/authSession'
import ProfessionalSidebar from '@/components/ProfessionalSidebar'
import { FiUsers, FiMail, FiPhone, FiCalendar, FiCheckCircle, FiClock, FiX } from 'react-icons/fi'

export default function AgentLeadsPage() {
  const [user, setUser] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'qualified' | 'lost'>('all')
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'agent') {
      router.replace('/agent/login')
      return
    }
    setUser(s)
    loadLeads(s.uid)
  }, [])

  async function loadLeads(agentId: string) {
    setLoading(true)
    try {
      // In production, fetch from API filtered by agentId
      const response = await fetch(`/api/leads?agentId=${agentId}`)
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
      }
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLeads = leads.filter((lead) => {
    if (filter === 'all') return true
    return lead.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'qualified':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'lost':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ProfessionalSidebar
        role="agent"
        userName={user.name}
        professionalCode={user.professionalCode || user.agentCode}
      />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0B2545] mb-2">Mis Leads</h1>
            <p className="text-gray-600">Gestiona tus contactos y oportunidades</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {['all', 'new', 'contacted', 'qualified', 'lost'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === status
                      ? 'bg-[#00A676] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all'
                    ? 'Todos'
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Leads List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A676] mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <FiUsers className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay leads</h3>
              <p className="text-gray-500">
                {filter === 'all'
                  ? 'Aún no tienes leads asignados'
                  : `No hay leads con estado "${filter}"`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#0B2545] mb-1">
                        {lead.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        {lead.email && (
                          <span className="inline-flex items-center gap-1">
                            <FiMail className="text-gray-400" /> {lead.email}
                          </span>
                        )}
                        {lead.phone && (
                          <span className="inline-flex items-center gap-1">
                            <FiPhone className="text-gray-400" /> {lead.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        lead.status
                      )}`}
                    >
                      {lead.status}
                    </span>
                  </div>

                  {lead.property && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Propiedad:</strong> {lead.property}
                      </p>
                    </div>
                  )}

                  {lead.message && (
                    <p className="text-sm text-gray-700 mb-4">{lead.message}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <FiCalendar /> {new Date(lead.createdAt).toLocaleDateString('es-ES')}
                    </span>
                    {lead.source && <span>• Fuente: {lead.source}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
