'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/authSession'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { FiUsers, FiHome, FiTrendingUp, FiDollarSign, FiAward, FiSettings, FiUserPlus, FiBarChart2, FiCheckCircle, FiClock, FiAlertCircle, FiEdit } from 'react-icons/fi'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { db } from '@/lib/firebaseClient'
import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore'

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
}

export default function BrokerDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [user, setUser] = useState<any>(null)
  const [agents, setAgents] = useState<Agent[]>([])
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
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'broker') {
      router.replace('/login')
      return
    }
    setUser(s)
    loadDashboard()
  }, [])

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

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
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

                {/* Charts */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Ingresos Mensuales</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `RD$ ${Number(value).toLocaleString()}`} />
                        <Line type="monotone" dataKey="revenue" stroke="#0B2545" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Agentes (Ingresos)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={agentPerformance.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `RD$ ${Number(value).toLocaleString()}`} />
                        <Bar dataKey="revenue" fill="#00A676" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
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
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Mi Equipo de Agentes</h2>
                  <a
                    href="/apply"
                    className="px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] inline-flex items-center gap-2"
                  >
                    <FiUserPlus /> Invitar Agente
                  </a>
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
                        agents.map(agent => {
                          const perf = agentPerformance.find(p => p.id === agent.id)
                          return (
                            <tr key={agent.id} className="hover:bg-gray-50">
                              <td className="p-4">
                                <div className="font-semibold text-gray-800">{agent.name}</div>
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
              </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Listados del Equipo</h2>
                  <a
                    href="/admin/properties/create"
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
      <Footer />
    </div>
  )
}
