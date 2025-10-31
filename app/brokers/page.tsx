"use client"
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import BrokerCard from '../../components/BrokerCard'
import { useMemo, useState, useEffect } from 'react'
import { FiSearch, FiStar, FiUsers } from 'react-icons/fi'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [minTeamSize, setMinTeamSize] = useState(0)

  useEffect(() => {
    loadBrokers()
  }, [])

  async function loadBrokers() {
    try {
      setLoading(true)
      // Fetch all active brokers from Firestore
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'broker'),
        where('status', '==', 'active')
      )
      const snapshot = await getDocs(q)
      const brokersList = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        // Normalize fields for BrokerCard
        photo: doc.data().companyLogo || doc.data().profileImage || '/brokerage-placeholder.jpg',
        area: doc.data().areas || doc.data().markets || doc.data().city || 'República Dominicana',
        rating: doc.data().rating || 4.7,
        teamSize: doc.data().teamSize || doc.data().agents || 0,
      }))
      setBrokers(brokersList)
    } catch (error) {
      console.error('Error loading brokers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return brokers.filter(b =>
      (!term || 
        (b.name || '').toLowerCase().includes(term) || 
        (b.company || '').toLowerCase().includes(term) ||
        (b.area || '').toLowerCase().includes(term) || 
        (b.email || '').toLowerCase().includes(term)) &&
      (b.rating || 0) >= minRating &&
      (b.teamSize || 0) >= minTeamSize
    )
  }, [brokers, q, minRating, minTeamSize])

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0B2545]">Brokerages Inmobiliarios</h1>
            <p className="text-gray-600">
              Descubre {brokers.length} brokerages certificados líderes en República Dominicana
            </p>
          </div>
          <a 
            href="/apply" 
            className="self-start md:self-auto px-4 py-2 bg-[#3BAFDA] text-white rounded font-semibold hover:bg-[#2A9FC7] transition inline-flex items-center gap-2"
          >
            <FiUsers /> ¿Tienes un brokerage? Únete
          </a>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={e=>setQ(e.target.value)}
                placeholder="Buscar por nombre de brokerage, zona o email"
                className="w-full pl-10 pr-3 py-2 border rounded focus:ring-2 focus:ring-[#3BAFDA] focus:border-transparent"
              />
            </div>

            {/* Rating Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700 inline-flex items-center gap-2 whitespace-nowrap">
                <FiStar className="text-yellow-500" /> Rating mín:
              </label>
              <select 
                value={minRating} 
                onChange={e=>setMinRating(Number(e.target.value))} 
                className="px-3 py-2 border rounded focus:ring-2 focus:ring-[#3BAFDA]"
              >
                <option value={0}>Todos</option>
                <option value={4.0}>4.0+</option>
                <option value={4.5}>4.5+</option>
                <option value={4.8}>4.8+</option>
              </select>
            </div>

            {/* Team Size Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700 inline-flex items-center gap-2 whitespace-nowrap">
                <FiUsers className="text-[#3BAFDA]" /> Equipo mín:
              </label>
              <select 
                value={minTeamSize} 
                onChange={e=>setMinTeamSize(Number(e.target.value))} 
                className="px-3 py-2 border rounded focus:ring-2 focus:ring-[#3BAFDA]"
              >
                <option value={0}>Todos</option>
                <option value={5}>5+ agentes</option>
                <option value={10}>10+ agentes</option>
                <option value={20}>20+ agentes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {!loading && filtered.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            Mostrando <strong>{filtered.length}</strong> de <strong>{brokers.length}</strong> brokerages
          </div>
        )}

        {/* Brokers Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3BAFDA] mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando brokerages...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(b => <BrokerCard key={b.id} broker={b} />)}
            </div>

            {filtered.length === 0 && (
              <div className="mt-8 bg-white border rounded p-8 text-center text-gray-600">
                {brokers.length === 0 ? 
                  'No hay brokerages registrados todavía.' : 
                  'No encontramos brokerages con esos filtros.'}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
