"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfessionalSidebar from '@/components/ProfessionalSidebar'
import { getSession } from '@/lib/authSession'
import { db } from '@/lib/firebaseClient'
import { collection, query, where, getDocs } from 'firebase/firestore'
import toast from 'react-hot-toast'
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiCheckSquare,
  FiTrendingUp,
  FiMessageSquare,
  FiPhone,
  FiMail,
  FiPlus,
  FiEye,
  FiStar,
  FiEdit,
  FiClock,
  FiDollarSign,
  FiTrash2,
} from 'react-icons/fi'

type Listing = {
  id: string
  title: string
  price?: number | string
  price_usd?: number
  location?: string
  status?: 'active' | 'sold' | 'inactive' | string
  bedrooms?: number
  bathrooms?: number
  images?: string[]
}

type Lead = {
  id: string
  name: string
  email: string
  phone?: string
  property?: string
  status: 'new' | 'contacted' | 'qualified' | 'lost'
  createdAt: any
}

type Task = {
  id: string
  title: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  completed: boolean
}

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'leads' | 'tasks' | 'calendar'>('overview')
  const [user, setUser] = useState<any>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskModal, setTaskModal] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'medium' as 'high'|'medium'|'low' })
  const [taskSaving, setTaskSaving] = useState(false)
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldThisMonth: 0,
    totalViews: 0,
    newLeads: 0,
    pendingTasks: 0,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'agent') {
      router.replace('/login')
      return
    }
    setUser(s)
    loadDashboard(s.uid)
  }, [])

  async function loadDashboard(agentId: string) {
    setLoading(true)
    try {
      // Load agent's listings
      const listingsQuery = query(collection(db, 'listings'), where('agentId', '==', agentId))
  const listingsSnap = await getDocs(listingsQuery)
  const listingsList = listingsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Listing[]

      // Calculate stats
      const activeListings = listingsList.filter((l) => l.status === 'active').length
      const soldThisMonth = listingsList.filter((l) => {
        if (l.status !== 'sold') return false
        // In real app, check soldAt date
        return true
      }).length

      // Mock leads (in real app, query from leads collection)
      const mockLeads: Lead[] = [
        {
          id: '1',
          name: 'Carlos Pérez',
          email: 'carlos@example.com',
          phone: '809-555-0101',
          property: 'Apartamento en Piantini',
          status: 'new',
          createdAt: new Date(),
        },
        {
          id: '2',
          name: 'María González',
          email: 'maria@example.com',
          phone: '809-555-0102',
          property: 'Villa en Casa de Campo',
          status: 'contacted',
          createdAt: new Date(),
        },
      ]

      // Fetch tasks from API
      try {
        const res = await fetch('/api/agent/tasks')
        const data = await res.json()
        if (data.ok) {
          setTasks(data.tasks as Task[])
        }
      } catch {}

      setListings(listingsList)
      setLeads(mockLeads)
      setStats({
        totalListings: listingsList.length,
        activeListings,
        soldThisMonth,
        totalViews: Math.floor(Math.random() * 500) + 200,
        newLeads: mockLeads.filter((l) => l.status === 'new').length,
        pendingTasks: tasks.filter((t) => !t.completed).length,
      })
    } catch (e) {
      console.error('Failed to load agent dashboard', e)
    } finally {
      setLoading(false)
    }
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTask.title || !newTask.dueDate) return
    setTaskSaving(true)
    try {
      const res = await fetch('/api/agent/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      })
      const data = await res.json()
      if (data.ok) {
        // Refresh list quickly
        const r = await fetch('/api/agent/tasks')
        const d = await r.json()
        if (d.ok) setTasks(d.tasks)
        setTaskModal(false)
        setNewTask({ title: '', dueDate: '', priority: 'medium' })
        toast.success('Tarea creada exitosamente')
      } else {
        toast.error('Error al crear tarea')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setTaskSaving(false)
    }
  }

  async function toggleTaskComplete(task: Task) {
    try {
      const res = await fetch('/api/agent/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, completed: !task.completed })
      })
      const data = await res.json()
      if (data.ok) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))
        toast.success(task.completed ? 'Tarea marcada como pendiente' : 'Tarea completada')
      }
    } catch {}
  }

  async function deleteTask(taskId: string) {
    if (!confirm('¿Eliminar esta tarea?')) return
    try {
      const res = await fetch(`/api/agent/tasks?id=${taskId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId))
        toast.success('Tarea eliminada')
      } else {
        toast.error('Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ProfessionalSidebar role="agent" userName={user.name} professionalCode={user.professionalCode || user.agentCode} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {/* Header with Welcome Message */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Panel de Agente</h1>
            <p className="text-gray-600">Bienvenido de nuevo, <span className="font-semibold text-[#00A676]">{user.name || 'Agente'}</span></p>
          </div>
          <button
            onClick={() => router.push('/agent/listings/create')}
            className="px-6 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] transition-colors flex items-center gap-2 shadow-lg"
          >
            <FiPlus /> Nuevo Listado
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 sticky top-0 z-20">
          <div className="flex gap-1 p-2 overflow-x-auto">
            <button
              onClick={() => { setActiveTab('overview'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'overview' ? 'bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FiTrendingUp className="text-lg" />
              Resumen
            </button>
            <button
              onClick={() => { setActiveTab('listings'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'listings' ? 'bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FiHome className="text-lg" />
              Mis Listados ({stats.totalListings})
            </button>
            <button
              onClick={() => { setActiveTab('leads'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'leads' ? 'bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FiUsers className="text-lg" />
              Leads ({leads.length})
            </button>
            <button
              onClick={() => { setActiveTab('tasks'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'tasks' ? 'bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FiCheckSquare className="text-lg" />
              Tareas ({stats.pendingTasks})
            </button>
            <button
              onClick={() => { setActiveTab('calendar'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'calendar' ? 'bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FiCalendar className="text-lg" />
              Agenda
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <FiHome className="text-4xl opacity-80" />
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">Listados</span>
                    </div>
                    <div className="text-4xl font-bold mb-1">{stats.totalListings}</div>
                    <div className="text-blue-100 text-sm mb-3">Total de Propiedades</div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-green-400 rounded text-xs font-semibold">✓ {stats.activeListings} Activos</span>
                      <span className="px-2 py-1 bg-white/20 rounded text-xs">{stats.totalListings - stats.activeListings} Otros</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <FiEye className="text-4xl opacity-80" />
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">Este Mes</span>
                    </div>
                    <div className="text-4xl font-bold mb-1">{stats.totalViews.toLocaleString()}</div>
                    <div className="text-purple-100 text-sm mb-3">Vistas Totales</div>
                    <div className="flex items-center gap-1 text-sm">
                      <FiTrendingUp className="text-green-300" />
                      <span className="text-green-300 font-semibold">+{Math.floor(Math.random() * 20)}%</span>
                      <span className="text-purple-200">vs. mes anterior</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <FiUsers className="text-4xl opacity-80" />
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">Nuevos</span>
                    </div>
                    <div className="text-4xl font-bold mb-1">{stats.newLeads}</div>
                    <div className="text-green-100 text-sm mb-3">Leads Activos</div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-200">{leads.length} total</span>
                      <span className="text-green-200">•</span>
                      <span className="text-green-200">{leads.filter(l => l.status === 'contacted').length} contactados</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <FiCheckSquare className="text-4xl opacity-80" />
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">Urgente</span>
                    </div>
                    <div className="text-4xl font-bold mb-1">{stats.pendingTasks}</div>
                    <div className="text-orange-100 text-sm mb-3">Tareas Pendientes</div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-red-500 rounded text-xs font-semibold">{tasks.filter(t => !t.completed && t.priority === 'high').length} Alta</span>
                      <span className="px-2 py-1 bg-white/20 rounded text-xs">{tasks.filter(t => !t.completed && t.priority === 'medium').length} Media</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <FiDollarSign className="text-4xl opacity-80" />
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">Este Mes</span>
                    </div>
                    <div className="text-4xl font-bold mb-1">{stats.soldThisMonth}</div>
                    <div className="text-yellow-100 text-sm mb-3">Propiedades Vendidas</div>
                    <div className="flex items-center gap-1 text-sm">
                      <FiTrendingUp className="text-green-300" />
                      <span className="text-yellow-100">Excelente desempeño</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <FiStar className="text-4xl opacity-80" />
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">Rating</span>
                    </div>
                    <div className="text-4xl font-bold mb-1">4.8 <span className="text-2xl">⭐</span></div>
                    <div className="text-pink-100 text-sm mb-3">Calificación Promedio</div>
                    <div className="text-sm text-pink-200">
                      Basado en {Math.floor(Math.random() * 50) + 20} reviews
                    </div>
                  </div>
                </div>

                {/* Quick Actions Banner */}
                <div className="bg-gradient-to-r from-[#0B2545] via-[#00A676] to-[#00A6A6] rounded-xl shadow-lg p-8 text-white">
                  <h3 className="text-xl font-bold mb-4">Acciones Rápidas</h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <a href="/admin/properties/create" className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-left transition-colors">
                      <FiPlus className="text-2xl mb-2" />
                      <div className="font-semibold">Crear Listado</div>
                    </a>
                    <button onClick={() => setActiveTab('leads')} className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-left transition-colors">
                      <FiUsers className="text-2xl mb-2" />
                      <div className="font-semibold">Ver Leads</div>
                    </button>
                    <a href="/agent/assistant" className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-left transition-colors">
                      <FiMessageSquare className="text-2xl mb-2" />
                      <div className="font-semibold">Asistente IA</div>
                    </a>
                    <button onClick={() => setActiveTab('calendar')} className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-left transition-colors">
                      <FiCalendar className="text-2xl mb-2" />
                      <div className="font-semibold">Mi Agenda</div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Últimos Leads</h3>
                    {leads.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No hay leads recientes</p>
                    ) : (
                      <div className="space-y-3">
                        {leads.slice(0, 3).map((lead) => (
                          <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <div>
                              <div className="font-semibold text-gray-800">{lead.name}</div>
                              <div className="text-sm text-gray-600">{lead.property}</div>
                            </div>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                lead.status === 'new'
                                  ? 'bg-blue-100 text-blue-800'
                                  : lead.status === 'contacted'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {lead.status === 'new' ? 'Nuevo' : lead.status === 'contacted' ? 'Contactado' : 'Calificado'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Tareas Urgentes</h3>
                    {tasks.filter((t) => !t.completed && t.priority === 'high').length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No hay tareas urgentes</p>
                    ) : (
                      <div className="space-y-3">
                        {tasks
                          .filter((t) => !t.completed && t.priority === 'high')
                          .slice(0, 3)
                          .map((task) => (
                            <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                              <input type="checkbox" className="w-5 h-5" aria-label={`Mark task "${task.title}" as complete`} />
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800">{task.title}</div>
                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                  <FiClock className="text-red-500" />
                                  {task.dueDate}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Mis Listados</h2>
                  <a
                    href="/admin/properties/create"
                    className="px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] inline-flex items-center gap-2"
                  >
                    <FiPlus /> Crear Listado
                  </a>
                </div>

                {listings.length === 0 ? (
                  <div className="bg-white rounded-xl shadow p-12 text-center">
                    <FiHome className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No tienes listados aún</p>
                    <a href="/admin/properties/create" className="inline-flex items-center gap-2 px-6 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]">
                      <FiPlus /> Crear tu primer listado
                    </a>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                      <div key={listing.id} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
                        <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 relative">
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <FiHome className="text-5xl text-gray-300" />
                            </div>
                          )}
                          <span
                            className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${
                              listing.status === 'active'
                                ? 'bg-green-600 text-white'
                                : listing.status === 'sold'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-600 text-white'
                            }`}
                          >
                            {listing.status === 'active' ? 'Activo' : listing.status === 'sold' ? 'Vendido' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-800 mb-1 line-clamp-2">{listing.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{listing.location}</p>
                          <div className="text-sm text-gray-600 mb-2">
                            {listing.bedrooms} hab • {listing.bathrooms} baños
                          </div>
                          <div className="font-bold text-[#0B2545] mb-3">
                            {(() => {
                              const price = (listing as any).price ?? (listing as any).price_usd
                              const num = typeof price === 'string' ? Number(price) : price
                              return num ? `RD$ ${num.toLocaleString('es-DO')}` : 'Precio a consultar'
                            })()}
                          </div>
                          <div className="flex gap-2">
                            <a href={`/listing/${listing.id}`} className="flex-1 text-center px-3 py-2 bg-[#00A676] text-white rounded-lg text-sm font-semibold hover:bg-[#008F64]">
                              <FiEye className="inline mr-1" /> Ver
                            </a>
                            <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50" aria-label="Edit listing">
                              <FiEdit />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Leads Tab */}
            {activeTab === 'leads' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Mis Leads</h2>
                  <button className="px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] inline-flex items-center gap-2">
                    <FiPlus /> Agregar Lead
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-700">Nombre</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Contacto</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Propiedad</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Estado</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {leads.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">
                            No tienes leads aún
                          </td>
                        </tr>
                      ) : (
                        leads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-gray-50">
                            <td className="p-4 font-semibold text-gray-800">{lead.name}</td>
                            <td className="p-4">
                              <div className="text-sm text-gray-600">{lead.email}</div>
                              <div className="text-sm text-gray-600">{lead.phone}</div>
                            </td>
                            <td className="p-4 text-gray-600">{lead.property}</td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded text-sm font-semibold ${
                                  lead.status === 'new'
                                    ? 'bg-blue-100 text-blue-800'
                                    : lead.status === 'contacted'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : lead.status === 'qualified'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {lead.status === 'new'
                                  ? 'Nuevo'
                                  : lead.status === 'contacted'
                                  ? 'Contactado'
                                  : lead.status === 'qualified'
                                  ? 'Calificado'
                                  : 'Perdido'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" aria-label="Call client">
                                  <FiPhone />
                                </button>
                                <button className="p-2 text-green-600 hover:bg-green-50 rounded" aria-label="Email client">
                                  <FiMail />
                                </button>
                                <button className="p-2 text-purple-600 hover:bg-purple-50 rounded" aria-label="Message client">
                                  <FiMessageSquare />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Mis Tareas</h2>
                  <button onClick={() => setTaskModal(true)} className="px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] inline-flex items-center gap-2">
                    <FiPlus /> Nueva Tarea
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {(['high', 'medium', 'low'] as const).map((priority) => (
                    <div key={priority} className="bg-white rounded-xl shadow">
                      <div
                        className={`p-4 border-b font-semibold ${
                          priority === 'high' ? 'text-red-600' : priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}
                      >
                        {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja'} Prioridad
                      </div>
                      <div className="p-4 space-y-3">
                        {tasks
                          .filter((t) => t.priority === priority && !t.completed)
                          .map((task) => (
                            <div key={task.id} className="p-3 border rounded-lg hover:bg-gray-50">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  className="mt-1 w-5 h-5 shrink-0"
                                  checked={task.completed}
                                  onChange={() => toggleTaskComplete(task)}
                                  aria-label={`Mark task "${task.title}" as complete`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-800">{task.title}</div>
                                  <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                    <FiClock />
                                    {task.dueDate}
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded shrink-0"
                                  aria-label="Eliminar tarea"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </div>
                          ))}
                        {tasks.filter((t) => t.priority === priority && !t.completed).length === 0 && (
                          <p className="text-center text-gray-500 py-4">Sin tareas</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Mi Agenda</h2>

                <div className="bg-white rounded-xl shadow p-6">
                  <div className="text-center py-12 text-gray-500">
                    <FiCalendar className="text-6xl mx-auto mb-4 text-gray-300" />
                    <p className="mb-4">Vista de calendario próximamente</p>
                    <p className="text-sm">Gestiona tus citas, visitas y eventos</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      {taskModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={createTask} className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#0B2545]">Nueva Tarea</h3>
            <input
              required
              value={newTask.title}
              onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
              placeholder="Título de la tarea"
              aria-label="Título de la tarea"
              title="Título de la tarea"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
            />
            <input
              required
              type="date"
              value={newTask.dueDate}
              onChange={e => setNewTask(t => ({ ...t, dueDate: e.target.value }))}
              aria-label="Fecha de vencimiento"
              title="Fecha de vencimiento"
              placeholder="Selecciona la fecha"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
            />
            <select
              value={newTask.priority}
              onChange={e => setNewTask(t => ({ ...t, priority: e.target.value as any }))}
              aria-label="Prioridad de la tarea"
              title="Prioridad de la tarea"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
            >
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setTaskModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
              <button
                type="submit"
                disabled={taskSaving}
                className="flex-1 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] disabled:opacity-50"
              >{taskSaving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

