"use client"
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import AgentCard from '../../components/AgentCard'
import { useMemo, useState, useEffect } from 'react'
import { FiSearch, FiStar } from 'react-icons/fi'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [minRating, setMinRating] = useState(0)

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadAgents() {
    try {
      setLoading(true)
      // Fetch all active agents from Firestore
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'agent'),
        where('status', '==', 'active')
      )
      const snapshot = await getDocs(q)
      const agentsList = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        // Normalize fields for AgentCard
        photo: doc.data().profileImage || doc.data().avatar || '/agent-placeholder.jpg',
        area: doc.data().areas || doc.data().markets || doc.data().city || 'República Dominicana',
        rating: doc.data().rating || 4.5,
      }))
      setAgents(agentsList)
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return agents.filter(a =>
      (!term || a.name.toLowerCase().includes(term) || (a.area || '').toLowerCase().includes(term) || (a.email || '').toLowerCase().includes(term)) &&
      (a.rating || 0) >= minRating
    )
  }, [agents, q, minRating])

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0B2545]">Agentes Inmobiliarios</h1>
            <p className="text-gray-600">
              Conecta con {agents.length} profesionales expertos certificados en República Dominicana
            </p>
          </div>
          <a href="/apply" className="self-start md:self-auto px-4 py-2 bg-[#00A6A6] text-white rounded font-semibold hover:bg-[#008c8c] transition">
            ¿Eres agente? Únete
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="Buscar por nombre, zona o email"
              className="w-full pl-10 pr-3 py-2 border rounded focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 inline-flex items-center gap-2">
              <FiStar className="text-yellow-500" /> Rating mín:
            </label>
            <select value={minRating} onChange={e=>setMinRating(Number(e.target.value))} className="px-3 py-2 border rounded">
              <option value={0}>Todos</option>
              <option value={4.0}>4.0+</option>
              <option value={4.5}>4.5+</option>
              <option value={4.8}>4.8+</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A676] mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando agentes...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {filtered.map(a => <AgentCard key={a.id} agent={a} />)}
            </div>

            {filtered.length === 0 && (
              <div className="mt-8 bg-white border rounded p-8 text-center text-gray-600">
                {agents.length === 0 ? 
                  'No hay agentes registrados todavía.' : 
                  'No encontramos agentes con esos filtros.'}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
