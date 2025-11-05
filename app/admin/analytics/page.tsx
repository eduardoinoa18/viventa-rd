'use client'
import { useState, useEffect } from 'react'
import ProtectedClient from '@/app/auth/ProtectedClient'
import AdminSidebar from '@/components/AdminSidebar'
import AdminTopbar from '@/components/AdminTopbar'
import { FiTrendingUp, FiActivity, FiCpu, FiBarChart2, FiPieChart, FiZap, FiUsers, FiHome, FiDollarSign, FiTarget, FiEye, FiHeart, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface AnalyticsData {
  totalUsers: number
  totalProperties: number
  totalAgents: number
  totalRevenue: number
  userGrowth: number
  propertyGrowth: number
  avgResponseTime: number
  conversionRate: number
  popularLocations: Array<{ name: string; count: number }>
  topAgents: Array<{ name: string; sales: number; revenue: number }>
  userActivity: {
    searches: number
    views: number
    favorites: number
    contacts: number
  }
  premiumPros?: { agents: number; brokers: number }
  leads?: { total: number; assigned: number; unassigned: number; last24h: number; avgAssignHours: number | null }
  aiInsights: Array<{
    id: string
    type: 'trend' | 'opportunity' | 'alert' | 'recommendation'
    title: string
    description: string
    confidence: number
    impact: 'high' | 'medium' | 'low'
  }>
}

// Discrete width classes (0-100 in 5% steps) to avoid inline styles
const WIDTH_CLASSES: Record<number, string> = {
  0: 'w-[0%]',
  5: 'w-[5%]',
  10: 'w-[10%]',
  15: 'w-[15%]',
  20: 'w-[20%]',
  25: 'w-[25%]',
  30: 'w-[30%]',
  35: 'w-[35%]',
  40: 'w-[40%]',
  45: 'w-[45%]',
  50: 'w-[50%]',
  55: 'w-[55%]',
  60: 'w-[60%]',
  65: 'w-[65%]',
  70: 'w-[70%]',
  75: 'w-[75%]',
  80: 'w-[80%]',
  85: 'w-[85%]',
  90: 'w-[90%]',
  95: 'w-[95%]',
  100: 'w-[100%]',
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'users' | 'properties' | 'agents'>('overview')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?range=${timeRange}`)
      const result = await res.json()
      if (result.ok) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Error al cargar analíticas')
    } finally {
      setLoading(false)
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <FiTrendingUp />
      case 'opportunity': return <FiTarget />
      case 'alert': return <FiZap />
      case 'recommendation': return <FiCpu />
      default: return <FiActivity />
    }
  }

  return (
  <ProtectedClient allowed={['master_admin','admin']}>
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminTopbar />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <FiCpu className="text-[#00A676]" />
                    AI & Analíticas
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Inteligencia artificial, tendencias de datos y machine learning
                  </p>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-2 bg-white rounded-lg p-1 shadow">
                  {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-md font-medium transition-all ${
                        timeRange === range
                          ? 'bg-[#00A676] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {range === '7d' ? '7 días' : range === '30d' ? '30 días' : range === '90d' ? '90 días' : '1 año'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6 flex gap-2 border-b overflow-x-auto">
                {[
                  { id: 'overview', label: 'Resumen', icon: FiBarChart2 },
                  { id: 'ai', label: 'AI Insights', icon: FiCpu },
                  { id: 'users', label: 'Usuarios', icon: FiUsers },
                  { id: 'properties', label: 'Propiedades', icon: FiHome },
                  { id: 'agents', label: 'Agentes', icon: FiTrendingUp }
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-b-2 border-[#00A676] text-[#00A676]'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Icon className="inline mr-2" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A676] mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando analíticas...</p>
                </div>
              ) : (
                <>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && data && (
                    <div className="space-y-6">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <FiUsers className="text-3xl text-blue-600" />
                            <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                              +{data.userGrowth}%
                            </span>
                          </div>
                          <div className="text-3xl font-bold text-gray-800 mb-1">{data.totalUsers.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">Usuarios Totales</div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <FiHome className="text-3xl text-purple-600" />
                            <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                              +{data.propertyGrowth}%
                            </span>
                          </div>
                          <div className="text-3xl font-bold text-gray-800 mb-1">{data.totalProperties.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">Propiedades Activas</div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <FiTrendingUp className="text-3xl text-green-600" />
                            <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {data.conversionRate}%
                            </span>
                          </div>
                          <div className="text-3xl font-bold text-gray-800 mb-1">{data.totalAgents}</div>
                          <div className="text-sm text-gray-600">Agentes Activos</div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <FiDollarSign className="text-3xl text-yellow-600" />
                            <span className="text-sm font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                              MRR
                            </span>
                          </div>
                          <div className="text-3xl font-bold text-gray-800 mb-1">
                            ${data.totalRevenue.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">Ingresos Mensuales</div>
                        </div>
                      </div>

                      {/* User Activity */}
                      <div className="bg-white rounded-xl p-6 shadow">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <FiActivity className="text-[#00A676]" />
                          Actividad de Usuarios
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <FiSearch className="text-3xl text-blue-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-gray-800">{data.userActivity.searches.toLocaleString()}</div>
                            <div className="text-sm text-gray-600">Búsquedas</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <FiEye className="text-3xl text-purple-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-gray-800">{data.userActivity.views.toLocaleString()}</div>
                            <div className="text-sm text-gray-600">Vistas</div>
                          </div>
                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <FiHeart className="text-3xl text-red-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-gray-800">{data.userActivity.favorites.toLocaleString()}</div>
                            <div className="text-sm text-gray-600">Favoritos</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <FiTarget className="text-3xl text-green-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-gray-800">{data.userActivity.contacts.toLocaleString()}</div>
                            <div className="text-sm text-gray-600">Contactos</div>
                          </div>
                        </div>
                      </div>

                      {/* Business KPIs */}
                      {data.leads && (
                        <div className="bg-white rounded-xl p-6 shadow">
                          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiTarget className="text-[#00A676]" />
                            Leads & Embudo
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                              <div className="text-xs text-gray-500 mb-1">Totales</div>
                              <div className="text-2xl font-bold text-[#0B2545]">{data.leads.total.toLocaleString()}</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Asignados</div>
                              <div className="text-2xl font-bold text-green-600">{data.leads.assigned.toLocaleString()}</div>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Sin asignar</div>
                              <div className="text-2xl font-bold text-yellow-600">{data.leads.unassigned.toLocaleString()}</div>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Nuevos (24h)</div>
                              <div className="text-2xl font-bold text-blue-600">{data.leads.last24h.toLocaleString()}</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Tiempo medio asignación</div>
                              <div className="text-2xl font-bold text-purple-600">{data.leads.avgAssignHours == null ? '—' : `${data.leads.avgAssignHours}h`}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Premium Pros */}
                      {data.premiumPros && (
                        <div className="bg-white rounded-xl p-6 shadow">
                          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiTrendingUp className="text-[#00A676]" />
                            Profesionales Premium
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-indigo-50 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Agentes Premium</div>
                              <div className="text-2xl font-bold text-indigo-600">{data.premiumPros.agents.toLocaleString()}</div>
                            </div>
                            <div className="text-center p-4 bg-pink-50 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Brokers Premium</div>
                              <div className="text-2xl font-bold text-pink-600">{data.premiumPros.brokers.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Activity Trends Chart */}
                      <div className="bg-white rounded-xl p-6 shadow">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Tendencias de Actividad (Últimos 30 días)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={[
                            { day: 'D-30', searches: 250, views: 800, favorites: 120, contacts: 15 },
                            { day: 'D-25', searches: 280, views: 900, favorites: 130, contacts: 18 },
                            { day: 'D-20', searches: 310, views: 950, favorites: 140, contacts: 20 },
                            { day: 'D-15', searches: 290, views: 880, favorites: 135, contacts: 17 },
                            { day: 'D-10', searches: 330, views: 1000, favorites: 150, contacts: 22 },
                            { day: 'D-5', searches: 350, views: 1100, favorites: 160, contacts: 24 },
                            { day: 'Hoy', searches: Math.round(data.userActivity.searches/30), views: Math.round(data.userActivity.views/30), favorites: Math.round(data.userActivity.favorites/30), contacts: Math.round(data.userActivity.contacts/30) },
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="day" stroke="#999" />
                            <YAxis stroke="#999" />
                            {/* eslint-disable-next-line */}
                            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
                            <Legend />
                            <Line type="monotone" dataKey="searches" stroke="#3B82F6" strokeWidth={2} name="Búsquedas" />
                            <Line type="monotone" dataKey="views" stroke="#8B5CF6" strokeWidth={2} name="Vistas" />
                            <Line type="monotone" dataKey="favorites" stroke="#EF4444" strokeWidth={2} name="Favoritos" />
                            <Line type="monotone" dataKey="contacts" stroke="#10B981" strokeWidth={2} name="Contactos" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Popular Locations & Top Agents */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-6 shadow">
                          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiPieChart className="text-[#00A676]" />
                            Ubicaciones Populares
                          </h3>
                          <div className="space-y-3">
                            {data.popularLocations.map((loc, idx) => {
                              const pctRaw = (loc.count / data.popularLocations[0].count) * 100
                              const pct = Math.round(pctRaw / 5) * 5
                              const clamped = Math.max(0, Math.min(100, pct)) as 0|5|10|15|20|25|30|35|40|45|50|55|60|65|70|75|80|85|90|95|100
                              const widthClass = WIDTH_CLASSES[clamped] || 'w-[0%]'
                              return (
                                <div key={idx} className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                                      {idx + 1}
                                    </div>
                                    <span className="font-medium">{loc.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                      <div className={`h-2 rounded-full bg-blue-600 ${widthClass}`} />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-600">{loc.count}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow">
                          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiTrendingUp className="text-[#00A676]" />
                            Top Agentes
                          </h3>
                          <div className="space-y-3">
                            {data.topAgents.map((agent, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-r from-[#004AAD] to-[#00A6A6] rounded-full flex items-center justify-center text-white font-bold">
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <div className="font-semibold">{agent.name}</div>
                                    <div className="text-xs text-gray-500">{agent.sales} ventas</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-green-600">${agent.revenue.toLocaleString()}</div>
                                  <div className="text-xs text-gray-500">revenue</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Insights Tab */}
                  {activeTab === 'ai' && data && (
                    <div className="space-y-6">
                      {/* AI Header */}
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <FiCpu className="text-4xl" />
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold mb-1">VIVENTA AI Engine</h2>
                            <p className="text-purple-100">Machine Learning & Predictive Analytics</p>
                          </div>
                        </div>
                        <p className="text-sm opacity-90">
                          Nuestro sistema de IA analiza millones de puntos de datos para proporcionar insights accionables,
                          predicciones de mercado y recomendaciones personalizadas para mejorar la experiencia de todos los usuarios.
                        </p>
                      </div>

                      {/* AI Insights Grid */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {data.aiInsights.map((insight) => (
                          <div 
                            key={insight.id}
                            className="bg-white rounded-xl p-6 shadow hover:shadow-xl transition-all border-l-4 border-[#00A676]"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${getImpactColor(insight.impact)}`}>
                                  {getInsightIcon(insight.type)}
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-gray-500 uppercase">{insight.type}</span>
                                  <h3 className="font-bold text-gray-800">{insight.title}</h3>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500">Confianza</div>
                                <div className="font-bold text-green-600">{insight.confidence}%</div>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{insight.description}</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getImpactColor(insight.impact)}`}>
                                Impacto: {insight.impact}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* ML Training Info */}
                      <div className="bg-white rounded-xl p-6 shadow">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <FiZap className="text-yellow-600" />
                          Estado del Machine Learning
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 mb-1">2.4M</div>
                            <div className="text-sm text-gray-600">Datos Procesados</div>
                            <div className="mt-2 text-xs text-gray-500">Últimas 24 horas</div>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600 mb-1">94.3%</div>
                            <div className="text-sm text-gray-600">Precisión del Modelo</div>
                            <div className="mt-2 text-xs text-gray-500">Mejorando continuamente</div>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600 mb-1">15ms</div>
                            <div className="text-sm text-gray-600">Tiempo de Respuesta</div>
                            <div className="mt-2 text-xs text-gray-500">Promedio por predicción</div>
                          </div>
                        </div>
                      </div>

                      {/* Future AI Features */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">🚀 Próximas Funcionalidades de IA</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0">✓</div>
                            <div>
                              <div className="font-semibold">Recomendaciones Personalizadas</div>
                              <div className="text-sm text-gray-600">ML para sugerir propiedades basado en comportamiento del usuario</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white flex-shrink-0">✓</div>
                            <div>
                              <div className="font-semibold">Predicción de Precios</div>
                              <div className="text-sm text-gray-600">Análisis de mercado para estimar valores de propiedades</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white flex-shrink-0">✓</div>
                            <div>
                              <div className="font-semibold">Chatbot Inteligente</div>
                              <div className="text-sm text-gray-600">Asistente virtual para responder preguntas en tiempo real</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white flex-shrink-0">✓</div>
                            <div>
                              <div className="font-semibold">Lead Scoring</div>
                              <div className="text-sm text-gray-600">Priorización automática de leads para agentes</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Placeholder for other tabs */}
                  {activeTab !== 'overview' && activeTab !== 'ai' && (
                    <div className="bg-white rounded-xl p-12 text-center shadow">
                      <FiBarChart2 className="text-6xl text-gray-300 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {activeTab === 'users' && 'Analíticas de Usuarios'}
                        {activeTab === 'properties' && 'Analíticas de Propiedades'}
                        {activeTab === 'agents' && 'Analíticas de Agentes'}
                      </h3>
                      <p className="text-gray-600">Gráficos detallados y métricas específicas próximamente</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedClient>
  )
}
