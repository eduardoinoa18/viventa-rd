"use client"
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import BottomNav from '../../components/BottomNav'
import AgentCard from '../../components/AgentCard'
import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import {
  FiSearch, FiMapPin, FiUsers, FiAward, FiTrendingUp,
  FiShield, FiPhone, FiArrowRight, FiCheckCircle, FiZap, FiStar,
} from 'react-icons/fi'

const TRUST_STATS = [
  { value: '500+', label: 'Agentes Certificados', icon: 'award' },
  { value: '12K+', label: 'Familias Atendidas', icon: 'users' },
  { value: '98%', label: 'Satisfacción Cliente', icon: 'star' },
  { value: '15+', label: 'Años Exp. Promedio', icon: 'trending' },
]

const CITIES = [
  'Santo Domingo', 'Punta Cana', 'Santiago', 'Cap Cana',
  'Las Terrenas', 'La Romana', 'Puerto Plata', 'Samaná',
]

const WHY_VIVENTA = [
  {
    title: 'Agentes Verificados',
    desc: 'Todos nuestros agentes pasan por verificación rigurosa de identidad y trayectoria profesional.',
  },
  {
    title: 'Respuesta en Minutos',
    desc: 'Nuestros agentes se comprometen a responder en menos de 30 minutos durante horas hábiles.',
  },
  {
    title: 'Expertos Locales',
    desc: 'Conocimiento profundo de cada mercado: desde Santo Domingo hasta Punta Cana y más allá.',
  },
]

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [area, setArea] = useState('')
  const [language, setLanguage] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'name'>('rating')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12

  useEffect(() => { loadAgents() }, [])

  async function loadAgents() {
    try {
      setLoading(true)
      const res = await fetch('/api/agents?limit=500', { cache: 'no-store' })
      const json = await res.json().catch(() => ({ ok: false, data: [] }))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed')
      setAgents((json.data || []).map((a: any) => ({
        ...a,
        photo: a.profileImage || a.photo || '/agent-placeholder.jpg',
        area: a.area || a.city || 'República Dominicana',
        rating: a.rating || 4.5,
      })))
    } catch { setAgents([]) } finally { setLoading(false) }
  }

  const languages = useMemo(() => {
    const set = new Set<string>()
    agents.forEach(a => {
      String(a.languages || 'Español').split(',').map((s: string) => s.trim()).filter(Boolean).forEach((l: string) => set.add(l))
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
  }, [agents])

  const filteredSorted = useMemo(() => {
    const term = q.toLowerCase()
    const list = agents.filter(a =>
      (!term || (a.name || '').toLowerCase().includes(term) || (a.area || '').toLowerCase().includes(term)) &&
      (!area || (a.area || '').toString() === area) &&
      (!language || String(a.languages || '').split(',').map((s: string) => s.trim()).includes(language))
    )
    return sortBy === 'rating'
      ? list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      : list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
  }, [agents, q, area, language, sortBy])

  const totalOnline = useMemo(() => agents.filter(a => a.online).length, [agents])
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE))
  const pageClamped = Math.min(page, totalPages)
  const paginated = filteredSorted.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE)

  function reset(fn: () => void) { fn(); setPage(1) }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B2545] via-[#134074] to-[#0B2545] py-20 md:py-28">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#00A676]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#00A676]/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00A676] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00A676]" />
            </span>
            {totalOnline > 0 ? `${totalOnline} agentes disponibles ahora` : 'Agentes disponibles 7 días a la semana'}
          </div>
          <h1 className="mb-5 text-4xl font-extrabold leading-tight text-white md:text-6xl">
            Los mejores agentes{' '}
            <span className="text-[#00A676]">inmobiliarios</span>
            <br />de República Dominicana
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/75 md:text-xl">
            Conecta con profesionales certificados que conocen cada mercado, cada barrio y cada oportunidad de la RD.
          </p>
          <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={e => reset(() => setQ(e.target.value))}
                placeholder="Nombre del agente o zona..."
                className="w-full rounded-xl border-0 bg-white py-3.5 pl-11 pr-4 text-gray-800 shadow-xl placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A676]"
              />
            </div>
            <select
              value={area}
              onChange={e => reset(() => setArea(e.target.value))}
              className="rounded-xl border-0 bg-white px-4 py-3.5 text-gray-700 shadow-xl focus:outline-none focus:ring-2 focus:ring-[#00A676]"
              aria-label="Filtrar por ciudad"
            >
              <option value="">Todas las ciudades</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="relative mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 px-4 md:grid-cols-4">
          {TRUST_STATS.map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1 text-center">
              <span className="text-2xl font-extrabold text-white md:text-3xl">{s.value}</span>
              <span className="text-xs text-white/60">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* WHY VIVENTA */}
      <section className="border-b border-gray-100 bg-[#F8FAFA] py-14">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#0B2545] md:text-3xl">
            ¿Por qué confiar en agentes VIVENTA?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {WHY_VIVENTA.map((item, i) => (
              <div key={item.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#00A676]/10">
                  {i === 0 ? <FiShield className="text-[#00A676] text-2xl" /> : i === 1 ? <FiZap className="text-[#00A676] text-2xl" /> : <FiAward className="text-[#00A676] text-2xl" />}
                </div>
                <h3 className="mb-2 font-bold text-[#0B2545]">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FILTERS + GRID */}
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-2">
              <label className="shrink-0 text-xs font-semibold text-gray-500 uppercase tracking-wide">Idioma</label>
              <select value={language} onChange={e => reset(() => setLanguage(e.target.value))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A676] focus:outline-none" aria-label="Filtrar por idioma">
                <option value="">Todos</option>
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="shrink-0 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ordenar</label>
              <select value={sortBy} onChange={e => reset(() => setSortBy(e.target.value as any))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A676] focus:outline-none" aria-label="Ordenar por">
                <option value="rating">Mejor valorados</option>
                <option value="name">Nombre (A–Z)</option>
              </select>
            </div>
            {!loading && (
              <span className="ml-auto text-sm text-gray-600"><strong className="text-[#0B2545]">{filteredSorted.length}</strong> agentes encontrados</span>
            )}
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            <button onClick={() => reset(() => setArea(''))} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${!area ? 'border-[#00A676] bg-[#00A676] text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-[#00A676] hover:text-[#00A676]'}`}>Todos</button>
            {CITIES.map(c => (
              <button key={c} onClick={() => reset(() => setArea(area === c ? '' : c))} className={`flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${area === c ? 'border-[#00A676] bg-[#00A676] text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-[#00A676] hover:text-[#00A676]'}`}>
                <FiMapPin className="text-xs" />{c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="animate-pulse rounded-2xl bg-gray-100 h-80" />)}
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center">
              <FiSearch className="mb-3 text-4xl text-gray-300" />
              <p className="text-lg font-semibold text-gray-500">No encontramos agentes con esos filtros</p>
              <p className="mt-1 text-sm text-gray-400">Prueba a cambiar la ciudad o limpiar los filtros</p>
              <button onClick={() => { setQ(''); setArea(''); setLanguage(''); setPage(1) }} className="mt-4 rounded-lg bg-[#00A676] px-5 py-2 text-sm font-semibold text-white hover:bg-[#008F64]">Limpiar filtros</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {paginated.map(a => <AgentCard key={a.id} agent={a} />)}
              </div>
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button disabled={pageClamped <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 hover:border-[#00A676] hover:text-[#00A676]">← Anterior</button>
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    const pn = i + 1
                    return <button key={pn} onClick={() => setPage(pn)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${pageClamped === pn ? 'bg-[#00A676] text-white shadow-md' : 'border border-gray-200 bg-white text-gray-700 hover:border-[#00A676] hover:text-[#00A676]'}`}>{pn}</button>
                  })}
                  <button disabled={pageClamped >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 hover:border-[#00A676] hover:text-[#00A676]">Siguiente →</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#00A676] to-[#008F64] py-14">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-3 text-3xl font-extrabold text-white">¿Eres agente inmobiliario?</h2>
          <p className="mb-7 text-white/85 md:text-lg">Únete a la red de profesionales más confiable de República Dominicana. Accede a más leads, herramientas CRM y visibilidad en todo el país.</p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/apply" className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-[#00A676] shadow-lg hover:shadow-xl transition-all">Aplicar como Agente <FiArrowRight /></Link>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all"><FiPhone /> Hablar con nosotros</Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/75">
            {['Sin comisión por leads', 'CRM incluido', 'Soporte dedicado', 'Visibilidad nacional'].map(b => (
              <span key={b} className="flex items-center gap-1.5"><FiCheckCircle className="text-white/90" /> {b}</span>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  )
}
