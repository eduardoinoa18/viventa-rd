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
  const [area, setArea] = useState('')
  const [language, setLanguage] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'name'>('rating')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [onlyOnline, setOnlyOnline] = useState(false)

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadAgents() {
    try {
      setLoading(true)
      // Fetch all active AND approved agents from Firestore
      const agentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'agent'),
        where('status', '==', 'active'),
        where('approved', '==', true)
      )
      const snapshot = await getDocs(agentsQuery)
      const agentsList = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        // Normalize fields for AgentCard
        photo: doc.data().profileImage || doc.data().avatar || '/agent-placeholder.jpg',
        area: doc.data().areas || doc.data().markets || doc.data().city || 'República Dominicana',
        rating: doc.data().rating || 4.5,
      }))
      setAgents(agentsList)
    } catch (error: any) {
      console.error('Error loading agents:', error)
      // If compound index doesn't exist, fall back to filtering client-side
      if (error.message?.includes('index')) {
        console.warn('Missing composite index, filtering client-side')
        try {
          const basicQuery = query(
            collection(db, 'users'),
            where('role', '==', 'agent')
          )
          const snapshot = await getDocs(basicQuery)
          const agentsList = snapshot.docs
            .filter((doc: any) => {
              const data = doc.data()
              return data.status === 'active' && data.approved === true
            })
            .map((doc: any) => ({
              id: doc.id,
              ...doc.data(),
              photo: doc.data().profileImage || doc.data().avatar || '/agent-placeholder.jpg',
              area: doc.data().areas || doc.data().markets || doc.data().city || 'República Dominicana',
              rating: doc.data().rating || 4.5,
            }))
          setAgents(agentsList)
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const areas = useMemo(() => {
    const set = new Set<string>()
    agents.forEach(a => {
      const val = (a.area || '').toString().trim()
      if (val) set.add(val)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
  }, [agents])

  const languages = useMemo(() => {
    const set = new Set<string>()
    agents.forEach(a => {
      const langs = (a.languages || 'Español').toString().split(',').map((s: string) => s.trim()).filter(Boolean)
      langs.forEach((l: string) => set.add(l))
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
  }, [agents])

  const filteredSorted = useMemo(() => {
    const term = q.toLowerCase()
    let list = agents.filter(a =>
      (!term || a.name?.toLowerCase?.().includes(term) || (a.area || '').toLowerCase().includes(term) || (a.email || '').toLowerCase().includes(term)) &&
      (a.rating || 0) >= minRating &&
      (!area || (a.area || '').toString() === area) &&
      (!language || (a.languages || '').toString().split(',').map((s: string) => s.trim()).includes(language)) &&
      (!onlyOnline || a.online === true)
    )

    if (sortBy === 'rating') {
      list = list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else {
      list = list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
    }
    return list
  }, [agents, q, minRating, area, language, sortBy, onlyOnline])

  const total = filteredSorted.length
  const totalOnline = useMemo(() => filteredSorted.filter(a => a.online).length, [filteredSorted])
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageClamped = Math.min(page, totalPages)
  const paginated = useMemo(() => {
    const start = (pageClamped - 1) * pageSize
    return filteredSorted.slice(start, start + pageSize)
  }, [filteredSorted, pageClamped, pageSize])

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

        <div className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
          <div className="relative w-full md:col-span-4">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="Buscar por nombre, zona o email"
              className="w-full pl-10 pr-3 py-2 border rounded focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700 inline-flex items-center gap-2">
              <FiStar className="text-yellow-500" /> Rating mín
            </label>
            <select value={minRating} onChange={e=>{ setMinRating(Number(e.target.value)); setPage(1) }} className="w-full px-3 py-2 border rounded" aria-label="Filtrar por calificación mínima">
              <option value={0}>Todos</option>
              <option value={4.0}>4.0+</option>
              <option value={4.5}>4.5+</option>
              <option value={4.8}>4.8+</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="text-sm text-gray-700">Zona</label>
            <select value={area} onChange={e=>{ setArea(e.target.value); setPage(1) }} className="w-full px-3 py-2 border rounded" aria-label="Filtrar por zona">
              <option value="">Todas</option>
              {areas.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="text-sm text-gray-700">Idioma</label>
            <select value={language} onChange={e=>{ setLanguage(e.target.value); setPage(1) }} className="w-full px-3 py-2 border rounded" aria-label="Filtrar por idioma">
              <option value="">Todos</option>
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <label className="text-sm text-gray-700">Ordenar</label>
            <select value={sortBy} onChange={e=>{ setSortBy(e.target.value as any); setPage(1) }} className="w-full px-3 py-2 border rounded" aria-label="Ordenar resultados">
              <option value="rating">Mejor rating</option>
              <option value="name">Nombre (A-Z)</option>
            </select>
          </div>
          <div className="md:col-span-12 flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={onlyOnline} onChange={(e)=>{ setOnlyOnline(e.target.checked); setPage(1) }} />
              Sólo en línea
            </label>
            <div className="text-sm text-gray-600">
              Mostrando {Math.min(pageSize, total - (pageClamped - 1) * pageSize)} de {total} agentes{onlyOnline ? ' en línea' : ''} • En línea ahora: {totalOnline}
            </div>
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
              {paginated.map(a => <AgentCard key={a.id} agent={a} />)}
            </div>

            {total === 0 && (
              <div className="mt-8 bg-white border rounded p-8 text-center text-gray-600">
                {agents.length === 0 ? 
                  'No hay agentes registrados todavía.' : 
                  'No encontramos agentes con esos filtros.'}
              </div>
            )}

            {total > 0 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Página {pageClamped} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pageClamped <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-2 border rounded disabled:opacity-50"
                  >Anterior</button>
                  <select
                    value={pageClamped}
                    onChange={e => setPage(Number(e.target.value))}
                    className="px-3 py-2 border rounded"
                    aria-label="Seleccionar página"
                  >
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </select>
                  <button
                    disabled={pageClamped >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-2 border rounded disabled:opacity-50"
                  >Siguiente</button>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                    className="px-3 py-2 border rounded"
                    aria-label="Resultados por página"
                  >
                    {[8,12,16,24].map(sz => (
                      <option key={sz} value={sz}>{sz}/página</option>
                    ))}
                  </select>
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
