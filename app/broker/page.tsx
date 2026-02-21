'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/authSession'
import ProfessionalSidebar from '@/components/ProfessionalSidebar'
import dynamic from 'next/dynamic'
import { FiUsers, FiHome, FiTrendingUp, FiDollarSign, FiAward, FiSettings, FiUserPlus, FiBarChart2, FiCheckCircle, FiClock, FiAlertCircle, FiEdit, FiX } from 'react-icons/fi'
import { db } from '@/lib/firebaseClient'
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore'

const BrokerCharts = dynamic(() => import('./BrokerCharts'), {
  loading: () => <div className="text-center py-8 text-gray-400">Loading charts...</div>,
  ssr: false
})

type Agent = {
  id: string
  name: string
  email: string
  phone?: string
  status: string
  brokerage?: string
  listingsCount?: number
  soldCount?: number
  revenue?: number
  online?: boolean
  lastSeen?: any
}

export default function BrokerDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [user, setUser] = useState<any>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [brokerageId, setBrokerageId] = useState<string | null>(null)
  const [brokerageName, setBrokerageName] = useState<string | null>(null)
  // UI filters for Team tab
  const [teamSearch, setTeamSearch] = useState('')
  const [teamStatus, setTeamStatus] = useState<'all' | 'active' | 'pending' | 'inactive'>('all')
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeListings: 0,
    soldThisMonth: 0,
    totalRevenue: 0,
    pendingApprovals: 0
  })
  const [agentPerformance, setAgentPerformance] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<string | null>(null)
  const [inviteToken, setInviteToken] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'broker') {
      router.replace('/login')
      return
    }
    setUser(s)
    loadDashboard()
    // Load broker profile to determine brokerage filter
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'users', s.uid))
        const data: any = snap.data() || {}
        setBrokerageId(data.brokerage_id || data.brokerId || null)
        setBrokerageName(data.brokerage || data.company || null)
      } catch {}
    })()
  }, [])

  // Live subscribe to agents to reflect presence, filtered by brokerage when available
  useEffect(() => {
    if (!user) return
    let qRef: any
    if (brokerageId) {
      qRef = query(collection(db, 'users'), where('role', '==', 'agent'), where('brokerage_id', '==', brokerageId))
    } else if (brokerageName) {
      qRef = query(collection(db, 'users'), where('role', '==', 'agent'), where('brokerage', '==', brokerageName))
    } else {
      qRef = query(collection(db, 'users'), where('role', '==', 'agent'))
    }
    const unsub = onSnapshot(qRef, (snap: any) => {
      const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Agent[]
      setAgents(list)
    })
    return () => unsub()
  }, [user, brokerageId, brokerageName])

  async function loadDashboard() {
    setLoading(true)
    try {
      // Load team agents (in a real app, filter by brokerage)
      const agentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'agent')
      )
      const agentsSnap = await getDocs(agentsQuery)
      const agentsList = agentsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Agent[]

      // Load listings
      const listingsSnap = await getDocs(collection(db, 'listings'))
      const listings = listingsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))

      // Calculate stats
      const activeListings = listings.filter((l: any) => l.status === 'active').length
      const soldThisMonth = listings.filter((l: any) => {
        if (l.status !== 'sold') return false
        const soldDate = l.soldAt?.toDate?.() || new Date(l.soldAt)
        const now = new Date()
        return soldDate.getMonth() === now.getMonth() && soldDate.getFullYear() === now.getFullYear()
      }).length

      const totalRevenue = listings
        .filter((l: any) => l.status === 'sold')
        .reduce((sum: number, l: any) => sum + Number(l.price || 0), 0)

      // Agent performance
      const agentStats: Record<string, { name: string; listings: number; sold: number; revenue: number }> = {}
      listings.forEach((l: any) => {
        const agentId = l.agentId || 'unknown'
        const agentName = l.agentName || 'Desconocido'
        if (!agentStats[agentId]) {
          agentStats[agentId] = { name: agentName, listings: 0, sold: 0, revenue: 0 }
        }
        agentStats[agentId].listings++
        if (l.status === 'sold') {
          agentStats[agentId].sold++
          agentStats[agentId].revenue += Number(l.price || 0)
        }
      })

      const performance = Object.entries(agentStats).map(([id, data]) => ({
        id,
        name: data.name,
        listings: data.listings,
        sold: data.sold,
        revenue: data.revenue
      })).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

      // Mock revenue over time (last 6 months)
      const revenueMonths = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'].map((month, idx) => ({
        month,
        revenue: Math.floor(Math.random() * 500000) + 200000
      }))

      setAgents(agentsList)
      setStats({
        totalAgents: agentsList.length,
        activeListings,
        soldThisMonth,
        totalRevenue,
        pendingApprovals: agentsList.filter(a => a.status === 'pending').length
      })
      setAgentPerformance(performance)
      setRevenueData(revenueMonths)
    } catch (e) {
      console.error('Failed to load broker dashboard', e)
    } finally {
      setLoading(false)
    }
  }

  function formatLastSeen(ts: any) {
    if (!ts) return ''
    let date: Date | null = null
    if (typeof ts?.toDate === 'function') date = ts.toDate()
    else if (typeof ts === 'number') date = new Date(ts)
    else if (ts instanceof Date) date = ts
    if (!date) return ''
    const diffMs = Date.now() - date.getTime()
    const minutes = Math.floor(diffMs / 60000)
    if (minutes < 1) return 'hace un momento'
    if (minutes === 1) return 'hace 1 min'
    if (minutes < 60) return `hace ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours === 1) return 'hace 1 hora'
    if (hours < 24) return `hace ${hours} horas`
    const days = Math.floor(hours / 24)
    return days === 1 ? 'hace 1 día' : `hace ${days} días`
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ProfessionalSidebar role="broker" userName={user.name} professionalCode={user.professionalCode || user.brokerCode} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard de Bróker</h1>
          <p className="text-gray-600">Gestiona tu equipo y operaciones</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 sticky top-0 z-20">
          <div className="flex gap-2 p-2 border-b overflow-x-auto bg-white">
            <button
              onClick={() => { setActiveTab('overview'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'overview' ? 'bg-[#0B2545] text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FiBarChart2 className="inline mr-2" />
              Resumen
            </button>
            <button
              onClick={() => { setActiveTab('team'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'team' ? 'bg-[#0B2545] text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FiUsers className="inline mr-2" />
              Mi Equipo
            </button>
            <button
              onClick={() => { setActiveTab('listings'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'listings' ? 'bg-[#0B2545] text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FiHome className="inline mr-2" />
              Listados
            </button>
            <button
              onClick={() => { setActiveTab('performance'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'performance' ? 'bg-[#0B2545] text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FiTrendingUp className="inline mr-2" />
              Rendimiento
            </button>
            <button
              onClick={() => { setActiveTab('settings'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'settings' ? 'bg-[#0B2545] text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FiSettings className="inline mr-2" />
              Configuración
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando datos...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FiUsers className="text-2xl text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{stats.totalAgents}</div>
                        <div className="text-sm text-gray-600">Agentes</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FiHome className="text-2xl text-green-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{stats.activeListings}</div>
                        <div className="text-sm text-gray-600">Listados Activos</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FiCheckCircle className="text-2xl text-purple-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{stats.soldThisMonth}</div>
                        <div className="text-sm text-gray-600">Vendidas (mes)</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FiDollarSign className="text-2xl text-yellow-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">
                          ${(stats.totalRevenue / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-sm text-gray-600">Ingresos Totales</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FiClock className="text-2xl text-orange-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{stats.pendingApprovals}</div>
                        <div className="text-sm text-gray-600">Pendientes</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts - Dynamically imported */}
                <div className="grid md:grid-cols-2 gap-6">
                  <BrokerCharts
                    revenueData={revenueData}
                    agentPerformance={agentPerformance}
                    statusDistribution={[]}
                    COLORS={['#0B2545', '#00A676', '#00A6A6', '#FF6B35']}
                  />
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-[#0B2545] to-[#00A676] rounded-xl shadow p-6 text-white">
                  <h3 className="text-xl font-bold mb-4">Acciones Rápidas</h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => setActiveTab('team')}
                      className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-left transition-colors"
                    >
                      <FiUserPlus className="text-2xl mb-2" />
                      <div className="font-semibold">Agregar Agente</div>
                    </button>
                    <button className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-left transition-colors">
                      <FiHome className="text-2xl mb-2" />
                      <div className="font-semibold">Crear Listado</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('performance')}
                      className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-left transition-colors"
                    >
                      <FiBarChart2 className="text-2xl mb-2" />
                      <div className="font-semibold">Ver Reportes</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-left transition-colors"
                    >
                      <FiSettings className="text-2xl mb-2" />
                      <div className="font-semibold">Configuración</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Mi Equipo de Agentes</h2>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <input
                      type="text"
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      placeholder="Buscar por nombre o email"
                      className="px-3 py-2 border border-gray-300 rounded-lg min-w-[240px]"
                    />
                    <select
                      value={teamStatus}
                      onChange={(e) => setTeamStatus((e.target.value as any) || 'all')}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      aria-label="Filtrar por estado"
                    >
                      <option value="all">Todos</option>
                      <option value="active">Activos</option>
                      <option value="pending">Pendientes</option>
                      <option value="inactive">Inactivos</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => { setInviteEmail(''); setInviteName(''); setInviteStatus(null); setInviteToken(null); setShowInvite(true) }}
                      className="px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] inline-flex items-center gap-2"
                      aria-label="Invitar agente"
                    >
                      <FiUserPlus /> Invitar Agente
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-700">Agente</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Email</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Teléfono</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Estado</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Listados</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {agents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            No hay agentes en tu equipo aún
                          </td>
                        </tr>
                      ) : (
                        // Local filtering by search and status
                        agents
                          .filter(a => {
                            const matchesSearch = (a.name || '').toLowerCase().includes(teamSearch.toLowerCase()) || (a.email || '').toLowerCase().includes(teamSearch.toLowerCase())
                            const matchesStatus = teamStatus === 'all' ? true : (a.status || 'inactive') === teamStatus
                            return matchesSearch && matchesStatus
                          })
                          .map(agent => {
                          const perf = agentPerformance.find(p => p.id === agent.id)
                          return (
                            <tr key={agent.id} className="hover:bg-gray-50">
                              <td className="p-4">
                                <div className="font-semibold text-gray-800 flex items-center gap-2">
                                  {/* Online badge */}
                                  {agent.online ? (
                                    <span className="relative flex h-2.5 w-2.5" title="En línea">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-600"></span>
                                    </span>
                                  ) : (
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-300" title="Desconectado"></span>
                                  )}
                                  <span>{agent.name}</span>
                                  {/* Last seen hint */}
                                  {!agent.online && (
                                    <span className="text-xs text-gray-500">(Últ. vez {formatLastSeen(agent.lastSeen)})</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-gray-600">{agent.email}</td>
                              <td className="p-4 text-gray-600">{agent.phone || '-'}</td>
                              <td className="p-4">
                                <span
                                  className={`px-2 py-1 rounded text-sm font-semibold ${
                                    agent.status === 'active'
                                      ? 'bg-green-100 text-green-800'
                                      : agent.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {agent.status === 'active' ? 'Activo' : agent.status === 'pending' ? 'Pendiente' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="p-4 text-gray-600">{perf?.listings || 0}</td>
                              <td className="p-4">
                                <button className="text-blue-600 hover:underline mr-3">
                                  <FiEdit className="inline" /> Editar
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              {/* Invite Modal */}
              {showInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="invite-title">
                  <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 id="invite-title" className="text-lg font-bold text-gray-800">Invitar Agente</h3>
                      <button onClick={() => setShowInvite(false)} className="text-gray-500 hover:text-gray-700" aria-label="Cerrar">
                        <FiX className="text-xl" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="invite-email" className="block text-sm font-semibold text-gray-700 mb-1">Email del agente</label>
                        <input
                          id="invite-email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="agente@correo.com"
                          aria-required="true"
                        />
                      </div>
                      <div>
                        <label htmlFor="invite-name" className="block text-sm font-semibold text-gray-700 mb-1">Nombre (opcional)</label>
                        <input
                          id="invite-name"
                          type="text"
                          value={inviteName}
                          onChange={(e) => setInviteName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Nombre del agente"
                        />
                      </div>
                      {inviteStatus && (
                        <div className="text-sm text-gray-700 bg-gray-50 border rounded p-2">
                          {inviteStatus}
                          {inviteToken && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-500">Código:</div>
                              <div className="font-mono text-sm inline-flex items-center gap-2">
                                <span className="bg-gray-100 rounded px-2 py-1">{inviteToken}</span>
                                <a href={`/auth/invite?code=${inviteToken}`} className="text-blue-600 hover:underline">Abrir enlace</a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                      <button onClick={() => setShowInvite(false)} className="px-4 py-2 rounded border">Cancelar</button>
                      <button
                        onClick={async () => {
                          setInviteStatus(null)
                          setInviteToken(null)
                          if (!inviteEmail) { setInviteStatus('El email es requerido'); return }
                          setInviteLoading(true)
                          try {
                            const res = await fetch('/api/broker/invites', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: inviteEmail, name: inviteName })
                            })
                            const data = await res.json()
                            if (!res.ok || !data.ok) {
                              setInviteStatus(data.error ? `Error: ${data.error}` : 'No se pudo crear la invitación')
                            } else {
                              setInviteStatus(data.emailed ? 'Invitación enviada por email' : 'Invitación creada (no se pudo enviar el email)')
                              setInviteToken(data.token)
                            }
                          } catch (e: any) {
                            setInviteStatus('Error del servidor')
                          } finally {
                            setInviteLoading(false)
                          }
                        }}
                        className="px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] disabled:opacity-60"
                        disabled={inviteLoading}
                      >
                        {inviteLoading ? 'Enviando…' : 'Enviar invitación'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Listados del Equipo</h2>
                  <a
                    href="/master/properties/create"
                    className="px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] inline-flex items-center gap-2"
                  >
                    <FiHome /> Crear Listado
                  </a>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                  <div className="text-center py-12 text-gray-500">
                    <FiHome className="text-5xl mx-auto mb-4 text-gray-300" />
                    <p className="mb-4">Vista consolidada de todos los listados del equipo</p>
                    <p className="text-sm">Filtrar por agente, estado, fecha, etc.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Rendimiento del Equipo</h2>

                <div className="bg-white rounded-xl shadow overflow-hidden">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-bold text-gray-800">Clasificación de Agentes</h3>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-700">Rango</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Agente</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Listados</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Vendidos</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Ingresos</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Tasa de Cierre</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {agentPerformance.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            No hay datos de rendimiento aún
                          </td>
                        </tr>
                      ) : (
                        agentPerformance.map((agent, idx) => (
                          <tr key={agent.id} className="hover:bg-gray-50">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {idx === 0 && <FiAward className="text-yellow-500 text-xl" />}
                                {idx === 1 && <FiAward className="text-gray-400 text-xl" />}
                                {idx === 2 && <FiAward className="text-orange-400 text-xl" />}
                                <span className="font-bold text-gray-700">#{idx + 1}</span>
                              </div>
                            </td>
                            <td className="p-4 font-semibold text-gray-800">{agent.name}</td>
                            <td className="p-4 text-gray-600">{agent.listings}</td>
                            <td className="p-4 text-gray-600">{agent.sold}</td>
                            <td className="p-4 font-semibold text-[#0B2545]">
                              RD$ {Number(agent.revenue).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span className="text-green-600 font-semibold">
                                {agent.listings > 0 ? Math.round((agent.sold / agent.listings) * 100) : 0}%
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Configuración del Brokerage</h2>

                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Información del Brokerage</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Brokerage</label>
                      <input
                        type="text"
                        placeholder="Mi Brokerage"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Licencia</label>
                      <input
                        type="text"
                        placeholder="# Licencia"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono de Contacto</label>
                      <input
                        type="tel"
                        placeholder="+1 (809) 000-0000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email del Brokerage</label>
                      <input
                        type="email"
                        placeholder="contacto@mybrokerage.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <button className="px-6 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]">
                      Guardar Cambios
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Configuración de Comisiones</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        % Comisión Estándar
                      </label>
                      <input
                        type="number"
                        placeholder="6"
                        step="0.1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Split con Agentes (%)
                      </label>
                      <input
                        type="number"
                        placeholder="70"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <button className="px-6 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]">
                      Actualizar Comisiones
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
