'use client'
import { useState } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { FiCompass, FiFilter, FiTarget, FiHome, FiMapPin, FiDollarSign, FiUsers } from 'react-icons/fi'

type Suggestion = {
  id?: string
  title: string
  location: string
  price: number
  bedrooms: number
  bathrooms: number
  area: number
  propertyType: 'apartment' | 'house' | 'condo' | 'land' | 'commercial'
  listingType: 'sale' | 'rent'
  agentName?: string
  score?: number
}

export default function AgentAssistantPage() {
  const [prefs, setPrefs] = useState({
    budgetMin: '',
    budgetMax: '',
    location: '',
    bedrooms: ''
  })
  const [propertyType, setPropertyType] = useState<Suggestion['propertyType'] | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [leadScore, setLeadScore] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [tips, setTips] = useState<string[]>([])
  const [insights, setInsights] = useState<string[]>([])

  async function getSuggestions(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/agent/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            budgetMin: prefs.budgetMin ? Number(prefs.budgetMin) : undefined,
            budgetMax: prefs.budgetMax ? Number(prefs.budgetMax) : undefined,
            location: prefs.location || undefined,
            bedrooms: prefs.bedrooms ? Number(prefs.bedrooms) : undefined,
            propertyType: propertyType || undefined,
          }
        })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Error')
      setLeadScore(data.leadScore)
      setSuggestions(data.suggestions || [])
      setTips(data.outreachTips || [])
      setInsights(data.marketInsights || [])
    } catch (err: any) {
      setError(err.message || 'No se pudieron obtener sugerencias')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedClient allowed={['agent','broker','admin','master_admin']}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3"><FiCompass /> Asistente para Agentes</h1>
            <p className="text-gray-600">Obtén recomendaciones rápidas de propiedades según el perfil del cliente.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Left: Preferences */}
            <div className="md:col-span-1 bg-white rounded-xl shadow p-5">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><FiFilter /> Preferencias del Cliente</h2>
              <form onSubmit={getSuggestions} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Presupuesto mínimo</label>
                    <div className="flex items-center border rounded px-2">
                      <FiDollarSign className="text-gray-400" />
                      <input value={prefs.budgetMin} onChange={e=>setPrefs({...prefs, budgetMin: e.target.value.replace(/\D/g,'')})} className="w-full px-2 py-2 outline-none" placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Presupuesto máximo</label>
                    <div className="flex items-center border rounded px-2">
                      <FiDollarSign className="text-gray-400" />
                      <input value={prefs.budgetMax} onChange={e=>setPrefs({...prefs, budgetMax: e.target.value.replace(/\D/g,'')})} className="w-full px-2 py-2 outline-none" placeholder="250000" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Ubicación</label>
                  <div className="flex items-center border rounded px-2">
                    <FiMapPin className="text-gray-400" />
                    <input value={prefs.location} onChange={e=>setPrefs({...prefs, location: e.target.value})} className="w-full px-2 py-2 outline-none" placeholder="Santo Domingo, Punta Cana..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Habitaciones</label>
                    <div className="flex items-center border rounded px-2">
                      <FiUsers className="text-gray-400" />
                      <input value={prefs.bedrooms} onChange={e=>setPrefs({...prefs, bedrooms: e.target.value.replace(/\D/g,'')})} className="w-full px-2 py-2 outline-none" placeholder="2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Tipo de propiedad</label>
                    <select value={propertyType} onChange={e=>setPropertyType(e.target.value as any)} className="w-full border rounded px-2 py-2">
                      <option value="">Cualquiera</option>
                      <option value="apartment">Apartamento</option>
                      <option value="house">Casa</option>
                      <option value="condo">Condo</option>
                      <option value="land">Solar</option>
                      <option value="commercial">Comercial</option>
                    </select>
                  </div>
                </div>

                {error && <div className="text-red-600 text-sm">{error}</div>}

                <button type="submit" disabled={loading} className="w-full bg-[#00A6A6] text-white rounded-lg py-2.5 font-semibold hover:bg-[#008f8f] disabled:opacity-50">
                  {loading ? 'Analizando…' : 'Obtener sugerencias'}
                </button>
              </form>
            </div>

            {/* Right: Results */}
            <div className="md:col-span-2 space-y-6">
              {leadScore !== null && (
                <div className="bg-white rounded-xl shadow p-5">
                  <div className="flex items-center gap-3 mb-2 text-gray-800 font-semibold"><FiTarget /> Puntuación del Lead</div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-extrabold text-[#0B2545]">{leadScore}</div>
                    <div className="text-gray-600">probabilidad estimada de encaje</div>
                  </div>
                </div>
              )}

              {tips.length > 0 && (
                <div className="bg-white rounded-xl shadow p-5">
                  <h3 className="font-semibold text-gray-800 mb-3">Sugerencias de contacto</h3>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    {tips.map((t,i)=>(<li key={i}>{t}</li>))}
                  </ul>
                </div>
              )}

              {insights.length > 0 && (
                <div className="bg-white rounded-xl shadow p-5">
                  <h3 className="font-semibold text-gray-800 mb-3">Insights de mercado</h3>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    {insights.map((t,i)=>(<li key={i}>{t}</li>))}
                  </ul>
                </div>
              )}

              <div className="bg-white rounded-xl shadow">
                <div className="p-5 border-b">
                  <h3 className="font-semibold text-gray-800">Propiedades sugeridas</h3>
                  <p className="text-sm text-gray-600">Ordenadas por compatibilidad</p>
                </div>
                {suggestions.length === 0 ? (
                  <div className="p-6 text-gray-500">Sin resultados todavía. Completa las preferencias y solicita sugerencias.</div>
                ) : (
                  <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suggestions.map((p) => (
                      <div key={p.id || p.title} className="border rounded-lg p-4 hover:shadow transition">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-gray-800 line-clamp-2">{p.title}</div>
                          {typeof p.score === 'number' && (
                            <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 font-semibold">{p.score}</span>
                          )}
                        </div>
                        <div className="mt-2 text-sm text-gray-600 flex items-center gap-2"><FiMapPin /> {p.location}</div>
                        <div className="mt-1 text-sm text-gray-600 flex items-center gap-2"><FiHome /> {p.propertyType} • {p.bedrooms} hab • {p.bathrooms} baños</div>
                        <div className="mt-2 font-bold text-[#0B2545]">RD$ {Number(p.price || 0).toLocaleString('es-DO')}</div>
                        <div className="mt-3 flex gap-2">
                          {p.id ? (
                            <a href={`/listing/${p.id}`} className="text-sm px-3 py-1.5 rounded bg-[#00A6A6] text-white hover:bg-[#008f8f]">Ver</a>
                          ) : null}
                          <button className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50">Compartir</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedClient>
  )
}
