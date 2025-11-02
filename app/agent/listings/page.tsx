'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { getSession } from '@/lib/authSession'
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiMapPin,
  FiBriefcase,
  FiDollarSign,
  FiHome,
  FiCheckCircle,
  FiXCircle,
  FiClock
} from 'react-icons/fi'
import toast from 'react-hot-toast'

interface Listing {
  id: string
  title: string
  price: number
  currency: string
  location: {
    city: string
    neighborhood: string
  }
  bedrooms: number
  bathrooms: number
  area: number
  images: string[]
  status: 'active' | 'pending' | 'sold' | 'inactive'
  propertyType: string
  listingType: 'sale' | 'rent'
  createdAt: any
  updatedAt: any
}

export default function AgentListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'sold'>('all')
  const router = useRouter()

  useEffect(() => {
    loadListings()
  }, [])

  async function loadListings() {
    setLoading(true)
    try {
      const session = await getSession()
      if (!session || session.role !== 'agent') {
        router.push('/agent/login')
        return
      }

      const listingsRef = collection(db, 'properties')
      const q = query(
        listingsRef,
        where('agentId', '==', session.uid),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      const results: Listing[] = []
      snapshot.forEach((doc: any) => {
        results.push({ id: doc.id, ...doc.data() } as Listing)
      })

      setListings(results)
    } catch (error) {
      console.error('Error loading listings:', error)
      toast.error('Error al cargar tus propiedades')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(listingId: string) {
    if (!confirm('¿Estás seguro de eliminar esta propiedad? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'properties', listingId))
      setListings(listings.filter((l) => l.id !== listingId))
      toast.success('Propiedad eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting listing:', error)
      toast.error('Error al eliminar la propiedad')
    }
  }

  async function handleStatusChange(listingId: string, newStatus: string) {
    try {
      const current = listings.find((l) => l.id === listingId)
      if (current && current.status === 'pending' && newStatus === 'active') {
        toast('Tu propiedad se activará cuando el equipo la apruebe (24–48h).', { icon: '⏳' })
        return
      }
      await updateDoc(doc(db, 'properties', listingId), {
        status: newStatus,
        updatedAt: new Date()
      })

      setListings(
        listings.map((l) => (l.id === listingId ? { ...l, status: newStatus as any } : l))
      )

      toast.success(`Estado actualizado a ${newStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  const filteredListings = filterStatus === 'all' 
    ? listings 
    : listings.filter((l) => l.status === filterStatus)

  const stats = {
    total: listings.length,
    active: listings.filter((l) => l.status === 'active').length,
    pending: listings.filter((l) => l.status === 'pending').length,
    sold: listings.filter((l) => l.status === 'sold').length
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'active':
        return <FiCheckCircle className="text-green-500" />
      case 'pending':
        return <FiClock className="text-yellow-500" />
      case 'sold':
        return <FiCheckCircle className="text-blue-500" />
      default:
        return <FiXCircle className="text-gray-400" />
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'active':
        return 'Activa'
      case 'pending':
        return 'Pendiente'
      case 'sold':
        return 'Vendida'
      case 'inactive':
        return 'Inactiva'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#0B2545] mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00A676] to-[#00A6A6] rounded-xl flex items-center justify-center">
                <FiBriefcase className="text-white text-2xl" />
              </div>
              Mis Propiedades
            </h1>
            <p className="text-gray-600">Gestiona tus listados y oportunidades</p>
          </div>
          <button
            onClick={() => router.push('/agent/listings/create')}
            className="px-6 py-3 bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <FiPlus className="text-xl" />
            Nueva Propiedad
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-[#00A676]">
            <div className="text-3xl font-bold text-[#0B2545]">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total Propiedades</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600 mt-1">Activas</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600 mt-1">Pendientes</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-blue-600">{stats.sold}</div>
            <div className="text-sm text-gray-600 mt-1">Vendidas</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6 p-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-[#00A676] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todas ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'active'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Activas ({stats.active})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Pendientes ({stats.pending})
          </button>
          <button
            onClick={() => setFilterStatus('sold')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'sold'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Vendidas ({stats.sold})
          </button>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-200">
                  {listing.images && listing.images[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiHome className="text-6xl text-gray-400" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1 text-sm font-medium">
                    {getStatusIcon(listing.status)}
                    {getStatusLabel(listing.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-[#0B2545] mb-2 line-clamp-1">
                    {listing.title}
                  </h3>

                  <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
                    <FiMapPin className="text-[#00A676]" />
                    <span className="line-clamp-1">
                      {listing.location?.neighborhood}, {listing.location?.city}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <FiDollarSign className="text-[#00A676]" />
                    <span className="text-2xl font-bold text-[#0B2545]">
                      {listing.currency === 'USD' ? '$' : 'RD$'}
                      {listing.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b">
                    <span>🛏️ {listing.bedrooms} hab</span>
                    <span>🚿 {listing.bathrooms} baños</span>
                    <span>📐 {listing.area}m²</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/listing/${listing.id}`)}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FiEye />
                      Ver
                    </button>
                    <button
                      onClick={() => router.push(`/agent/listings/edit/${listing.id}`)}
                      className="flex-1 px-4 py-2 bg-[#00A676] hover:bg-[#008c5c] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FiEdit />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
                    >
                      <FiTrash2 />
                    </button>
                  </div>

                  {/* Status Change Dropdown */}
                  <div className="mt-3">
                    <select
                      value={listing.status}
                      onChange={(e) => handleStatusChange(listing.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="inactive">Inactiva</option>
                      <option value="sold">Vendida</option>
                      <option value="active" disabled={listing.status === 'pending'}>Activa (requiere aprobación)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiHome className="text-4xl text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {filterStatus === 'all'
                ? 'No tienes propiedades aún'
                : `No hay propiedades ${getStatusLabel(filterStatus).toLowerCase()}`}
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza a agregar tus propiedades para que los clientes puedan encontrarlas
            </p>
            <button
              onClick={() => router.push('/agent/listings/create')}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <FiPlus className="text-xl" />
              Agregar tu primera propiedad
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
