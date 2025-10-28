'use client''use client'

import { useEffect, useState } from 'react'import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'import { auth, db, storage } from '../../lib/firebaseClient'

import { getSession } from '@/lib/authSession'import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

import Header from '@/components/Header'import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'

import Footer from '@/components/Footer'import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

import { FiHome, FiUsers, FiCalendar, FiCheckSquare, FiTrendingUp, FiMessageSquare, FiPhone, FiMail, FiPlus, FiEye, FiHeart, FiStar, FiEdit, FiTrash2, FiClock, FiDollarSign } from 'react-icons/fi'

import { db } from '@/lib/firebaseClient'export default function AgentDashboard(){

import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'  const [user,setUser]=useState<any>(null)

  const [title,setTitle]=useState(''); const [price,setPrice]=useState(''); const [img,setImg]=useState<File|null>(null)

type Listing = {  const [listings,setListings]=useState<any[]>([])

  id: string

  title: string  useEffect(()=> auth.onAuthStateChanged((u: any)=> setUser(u)),[])

  price: number

  location: string  async function login(){ const provider=new GoogleAuthProvider(); await signInWithPopup(auth,provider) }

  status: string  async function addListing(){

  bedrooms: number    if(!user) return alert('Login required')

  bathrooms: number    let url=''

  images: string[]    if(img){

}      const fileRef = ref(storage, `listing_images/${Date.now()}_${img.name}`)

      const snap = await uploadBytesResumable(fileRef, img)

type Lead = {      url = await getDownloadURL(snap.ref)

  id: string    }

  name: string    await addDoc(collection(db,'listings'), { title, price_usd: parseFloat(price), images: url? [url]: [], createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), status:'active' })

  email: string    setTitle(''); setPrice(''); setImg(null); loadMyListings()

  phone?: string  }

  property?: string  async function loadMyListings(){

  status: 'new' | 'contacted' | 'qualified' | 'lost'    if(!user) return

  createdAt: any    const q = query(collection(db,'listings'), where('createdBy','==', user.uid))

}    const snap = await getDocs(q)

  setListings(snap.docs.map((d: any)=> ({id:d.id, ...d.data()})))

type Task = {  }

  id: string

  title: string  return (

  dueDate: string    <div>

  priority: 'high' | 'medium' | 'low'      <h1 className="text-2xl font-bold">Agent Dashboard</h1>

  completed: boolean      {!user ? (

}        <div className="mt-4">

          <button onClick={login} className="px-4 py-2 bg-[#00A6A6] text-white rounded">Sign in with Google</button>

export default function AgentDashboard() {        </div>

  const [activeTab, setActiveTab] = useState('overview')      ) : (

  const [user, setUser] = useState<any>(null)        <div className="mt-4 grid md:grid-cols-2 gap-6">

  const [listings, setListings] = useState<Listing[]>([])          <div className="p-4 bg-white rounded shadow">

  const [leads, setLeads] = useState<Lead[]>([])            <h3 className="font-semibold">New listing</h3>

  const [tasks, setTasks] = useState<Task[]>([])            <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} className="mt-2 w-full px-3 py-2 border rounded"/>

  const [stats, setStats] = useState({            <input placeholder="Price USD" value={price} onChange={e=>setPrice(e.target.value)} className="mt-2 w-full px-3 py-2 border rounded"/>

    totalListings: 0,            <input type="file" className="mt-2" onChange={e=> setImg(e.target.files? e.target.files[0] : null)} />

    activeListings: 0,            <button onClick={addListing} className="mt-3 px-3 py-2 bg-[#FF6B35] text-white rounded">Create</button>

    soldThisMonth: 0,          </div>

    totalViews: 0,          <div>

    newLeads: 0,            <h3 className="font-semibold">My listings</h3>

    pendingTasks: 0            <div className="mt-3 space-y-3">

  })              <button onClick={loadMyListings} className="px-3 py-2 border rounded">Load</button>

  const [loading, setLoading] = useState(true)              {listings.map(l=>(

  const router = useRouter()                <div key={l.id} className="p-3 bg-white rounded shadow">

                  <div className="font-medium">{l.title}</div>

  useEffect(() => {                  <div className="text-sm text-gray-600">USD {l.price_usd}</div>

    const s = getSession()                </div>

    if (!s || s.role !== 'agent') {              ))}

      router.replace('/login')            </div>

      return          </div>

    }        </div>

    setUser(s)      )}

    loadDashboard(s.uid)    </div>

  }, [])  )

}

  async function loadDashboard(agentId: string) {
    setLoading(true)
    try {
      // Load agent's listings
      const listingsQuery = query(
        collection(db, 'listings'),
        where('agentId', '==', agentId)
      )
      const listingsSnap = await getDocs(listingsQuery)
      const listingsList = listingsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Listing[]

      // Calculate stats
      const activeListings = listingsList.filter(l => l.status === 'active').length
      const soldThisMonth = listingsList.filter(l => {
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
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'María González',
          email: 'maria@example.com',
          phone: '809-555-0102',
          property: 'Villa en Casa de Campo',
          status: 'contacted',
          createdAt: new Date()
        }
      ]

      // Mock tasks
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Llamar a cliente Carlos Pérez',
          dueDate: '2025-10-29',
          priority: 'high',
          completed: false
        },
        {
          id: '2',
          title: 'Preparar documentos para cierre',
          dueDate: '2025-10-30',
          priority: 'high',
          completed: false
        },
        {
          id: '3',
          title: 'Actualizar fotos de listado',
          dueDate: '2025-11-01',
          priority: 'medium',
          completed: false
        }
      ]

      setListings(listingsList)
      setLeads(mockLeads)
      setTasks(mockTasks)
      setStats({
        totalListings: listingsList.length,
        activeListings,
        soldThisMonth,
        totalViews: Math.floor(Math.random() * 500) + 200,
        newLeads: mockLeads.filter(l => l.status === 'new').length,
        pendingTasks: mockTasks.filter(t => !t.completed).length
      })
    } catch (e) {
      console.error('Failed to load agent dashboard', e)
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
          <h1 className="text-3xl font-bold text-gray-800">Mi Dashboard</h1>
          <p className="text-gray-600">Bienvenido, {user.name || 'Agente'}</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex gap-2 p-2 border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'overview' ? 'bg-[#0B2545] text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FiTrendingUp className="inline mr-2" />
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'listings' ? 'bg-[#0B2545] text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FiHome className="inline mr-2" />
              Mis Listados
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'leads' ? 'bg-[#0B2545] text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FiUsers className="inline mr-2" />
              Leads
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'tasks' ? 'bg-[#0B2545] text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FiCheckSquare className="inline mr-2" />
              Tareas
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'calendar' ? 'bg-[#0B2545] text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FiCalendar className="inline mr-2" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FiHome className="text-2xl text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{stats.totalListings}</div>
                        <div className="text-sm text-gray-600">Total Listados</div>
                      </div>
                    </div>
                    <div className="text-xs text-green-600 font-semibold mt-2">
                      {stats.activeListings} activos
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FiEye className="text-2xl text-purple-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{stats.totalViews}</div>
                        <div className="text-sm text-gray-600">Vistas (mes)</div>
                      </div>
                    </div>
                    <div className="text-xs text-green-600 font-semibold mt-2">
                      +{Math.floor(Math.random() * 20)}% vs. mes anterior
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FiUsers className="text-2xl text-green-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{stats.newLeads}</div>
                        <div className="text-sm text-gray-600">Nuevos Leads</div>
                      </div>
                    </div>
                    <div className="text-xs text-blue-600 font-semibold mt-2">
                      {leads.length} total
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FiCheckSquare className="text-2xl text-orange-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{stats.pendingTasks}</div>
                        <div className="text-sm text-gray-600">Tareas Pendientes</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FiDollarSign className="text-2xl text-yellow-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{stats.soldThisMonth}</div>
                        <div className="text-sm text-gray-600">Vendidos (mes)</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FiStar className="text-2xl text-pink-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">4.8</div>
                        <div className="text-sm text-gray-600">Rating Promedio</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-[#0B2545] to-[#00A676] rounded-xl shadow p-6 text-white">
                  <h3 className="text-xl font-bold mb-4">Acciones Rápidas</h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <a
                      href="/admin/properties/create"
                      className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-left transition-colors"
                    >
                      <FiPlus className="text-2xl mb-2" />
                      <div className="font-semibold">Crear Listado</div>
                    </a>
                    <button
                      onClick={() => setActiveTab('leads')}
                      className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-left transition-colors"
                    >
                      <FiUsers className="text-2xl mb-2" />
                      <div className="font-semibold">Ver Leads</div>
                    </button>
                    <a
                      href="/agent/assistant"
                      className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-left transition-colors"
                    >
                      <FiMessageSquare className="text-2xl mb-2" />
                      <div className="font-semibold">Asistente IA</div>
                    </a>
                    <button
                      onClick={() => setActiveTab('calendar')}
                      className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-left transition-colors"
                    >
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
                        {leads.slice(0, 3).map(lead => (
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
                    {tasks.filter(t => !t.completed && t.priority === 'high').length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No hay tareas urgentes</p>
                    ) : (
                      <div className="space-y-3">
                        {tasks
                          .filter(t => !t.completed && t.priority === 'high')
                          .slice(0, 3)
                          .map(task => (
                            <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                              <input type="checkbox" className="w-5 h-5" />
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
                    <a
                      href="/admin/properties/create"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]"
                    >
                      <FiPlus /> Crear tu primer listado
                    </a>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map(listing => (
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
                            RD$ {Number(listing.price).toLocaleString('es-DO')}
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={`/listing/${listing.id}`}
                              className="flex-1 text-center px-3 py-2 bg-[#00A676] text-white rounded-lg text-sm font-semibold hover:bg-[#008F64]"
                            >
                              <FiEye className="inline mr-1" /> Ver
                            </a>
                            <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
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
                        leads.map(lead => (
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
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                  <FiPhone />
                                </button>
                                <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                                  <FiMail />
                                </button>
                                <button className="p-2 text-purple-600 hover:bg-purple-50 rounded">
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
                  <button className="px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] inline-flex items-center gap-2">
                    <FiPlus /> Nueva Tarea
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {['high', 'medium', 'low'].map(priority => (
                    <div key={priority} className="bg-white rounded-xl shadow">
                      <div
                        className={`p-4 border-b font-semibold ${
                          priority === 'high'
                            ? 'text-red-600'
                            : priority === 'medium'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja'} Prioridad
                      </div>
                      <div className="p-4 space-y-3">
                        {tasks
                          .filter(t => t.priority === priority && !t.completed)
                          .map(task => (
                            <div key={task.id} className="p-3 border rounded-lg hover:bg-gray-50">
                              <div className="flex items-start gap-3">
                                <input type="checkbox" className="mt-1 w-5 h-5" />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-800">{task.title}</div>
                                  <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                    <FiClock />
                                    {task.dueDate}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        {tasks.filter(t => t.priority === priority && !t.completed).length === 0 && (
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
      <Footer />
    </div>
  )
}
