"use client"
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import AgentCard from '../../components/AgentCard'
import { useMemo, useState } from 'react'
import { FiSearch, FiStar } from 'react-icons/fi'

const agents = [
  { id: 'a1', photo: '/agent1.jpg', name: 'María López', area: 'Santo Domingo', rating: 4.9, phone:'+1 809-555-0111', email:'maria@example.com' },
  { id: 'a2', photo: '/agent2.jpg', name: 'Carlos Pérez', area: 'Punta Cana', rating: 5.0, phone:'+1 809-555-0112', email:'carlos@example.com' },
  { id: 'a3', photo: '/agent3.jpg', name: 'Ana García', area: 'Santiago', rating: 4.8 },
  { id: 'a4', photo: '/agent4.jpg', name: 'Luis Rodríguez', area: 'La Romana', rating: 4.7 },
]

export default function AgentsPage() {
  const [q, setQ] = useState('')
  const [minRating, setMinRating] = useState(0)
  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return agents.filter(a =>
      (!term || a.name.toLowerCase().includes(term) || a.area.toLowerCase().includes(term)) &&
      (a.rating || 0) >= minRating
    )
  }, [q, minRating])

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0B2545]">Agentes Inmobiliarios</h1>
            <p className="text-gray-600">Conecta con profesionales expertos en cada región del Caribe</p>
          </div>
          <a href="/apply" className="self-start md:self-auto px-4 py-2 bg-[#00A6A6] text-white rounded font-semibold">¿Eres agente? Únete</a>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="Buscar por nombre o zona (ej. Punta Cana)"
              className="w-full pl-10 pr-3 py-2 border rounded focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 inline-flex items-center gap-2"><FiStar className="text-yellow-500" /> Rating mín:</label>
            <select value={minRating} onChange={e=>setMinRating(Number(e.target.value))} className="px-3 py-2 border rounded">
              <option value={0}>Todos</option>
              <option value={4.0}>4.0+</option>
              <option value={4.5}>4.5+</option>
              <option value={4.8}>4.8+</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filtered.map(a => <AgentCard key={a.id} agent={a} />)}
        </div>

        {filtered.length === 0 && (
          <div className="mt-8 bg-white border rounded p-8 text-center text-gray-600">
            No encontramos agentes con esos filtros.
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
