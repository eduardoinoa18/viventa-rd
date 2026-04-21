"use client"
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import BottomNav from '../../components/BottomNav'
import BrokerCard from '../../components/BrokerCard'
import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import {
  FiSearch, FiUsers, FiAward, FiTrendingUp, FiMapPin,
  FiShield, FiPhone, FiArrowRight, FiCheckCircle, FiZap, FiHome, FiStar,
} from 'react-icons/fi'

const TRUST_STATS = [
  { value: '80+', label: 'Brokerages Certificados' },
  { value: '2K+', label: 'Agentes en la Red' },
  { value: '$4B+', label: 'en Transacciones' },
  { value: '99%', label: 'Clientes Satisfechos' },
]

const CITIES = [
  'Santo Domingo', 'Punta Cana', 'Santiago', 'Cap Cana',
  'Las Terrenas', 'La Romana', 'Puerto Plata', 'Samaná',
]

const WHY_BROKERS = [
  {
    title: 'Red Verificada',
    desc: 'Cada brokerage pasa por verificación de licencias, historial y reputación antes de aparecer en VIVENTA.',
  },
  {
    title: 'Acceso a Inventario Premium',
    desc: 'Brokerages en VIVENTA tienen acceso exclusivo a proyectos y propiedades off-market en toda la República Dominicana.',
  },
  {
    title: 'Gestión Profesional',
    desc: 'Equipos con experiencia en inversión extranjera, financiamiento local y procesos legales dominicanos.',
  },
]

const TEAM_SIZE_OPTIONS = [
  { label: 'Todos', value: 0 },
  { label: '5+ agentes', value: 5 },
  { label: '10+ agentes', value: 10 },
  { label: '20+ agentes', value: 20 },
]

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [area, setArea] = useState('')
  const [minTeamSize, setMinTeamSize] = useState(0)
  const [sortBy, setSortBy] = useState<'rating' | 'team' | 'name'>('rating')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 9

  useEffect(() => { loadBrokers() }, [])

  async function loadBrokers() {
    try {
      setLoading(true)
      const res = await fetch('/api/brokers?limit=500', { cache: 'no-store' })
      const json = await res.json().catch(() => ({ ok: false, data: [] }))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed')
      setBrokers((json.data || []).map((b: any) => ({
        ...b,
        companyLogo: b.companyLogo || b.photo || '/placeholder.png',
        area: b.area || b.city || 'República Dominicana',
        rating: b.rating || 4.7,
        teamSize: b.teamSize || b.agents || 0,
      })))
    } catch { setBrokers([]) } finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    const list = brokers.filter(b =>
      (!term || (b.company || b.name || '').toLowerCase().includes(term) || (b.area || '').toLowerCase().includes(term)) &&
      (b.teamSize || 0) >= minTeamSize &&
      (!area || (b.area || '').toString() === area)
    )
    if (sortBy === 'rating') return list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    if (sortBy === 'team') return list.sort((a, b) => (b.teamSize || 0) - (a.teamSize || 0))
    return list.sort((a, b) => (a.company || a.name || '').localeCompare(b.company || b.name || '', 'es'))
  }, [brokers, q, area, minTeamSize, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageClamped = Math.min(page, totalPages)
  const paginated = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE)

  function reset(fn: () => void) { fn(); setPage(1) }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B2545] via-[#1a3a6e] to-[#0B2545] py-20 md:py-28">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#3BAFDA]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#3BAFDA]/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
            <FiAward className="text-[#3BAFDA]" />
            Brokerages certificados en toda la RD
          </div>
          <h1 className="mb-5 text-4xl font-extrabold leading-tight text-white md:text-6xl">
            Los mejores <span className="text-[#3BAFDA]">brokerages</span>
            <br />para tu próxima inversión
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/75 md:text-xl">
            Encuentra empresas inmobiliarias con equipos de élite, inventario exclusivo y décadas de experiencia en el mercado dominicano.
          </p>
          <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={e => reset(() => setQ(e.target.value))}
                placeholder="Nombre del brokerage o zona..."
                className="w-full rounded-xl border-0 bg-white py-3.5 pl-11 pr-4 text-gray-800 shadow-xl placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3BAFDA]"
              />
            </div>
            <select
              value={area}
              onChange={e => reset(() => setArea(e.target.value))}
              className="rounded-xl border-0 bg-white px-4 py-3.5 text-gray-700 shadow-xl focus:outline-none focus:ring-2 focus:ring-[#3BAFDA]"
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

      {/* WHY VIVENTA BROKERS */}
      <section className="border-b border-gray-100 bg-[#F8FAFA] py-14">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#0B2545] md:text-3xl">
            ¿Por qué brokerages VIVENTA?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {WHY_BROKERS.map((item, i) => (
              <div key={item.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#3BAFDA]/10">
                  {i === 0 ? <FiShield className="text-[#3BAFDA] text-2xl" /> : i === 1 ? <FiHome className="text-[#3BAFDA] text-2xl" /> : <FiTrendingUp className="text-[#3BAFDA] text-2xl" />}
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
              <label className="shrink-0 text-xs font-semibold text-gray-500 uppercase tracking-wide">Equipo mínimo</label>
              <select value={minTeamSize} onChange={e => reset(() => setMinTeamSize(Number(e.target.value)))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#3BAFDA] focus:outline-none" aria-label="Filtrar por tamaño de equipo">
                {TEAM_SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="shrink-0 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ordenar</label>
              <select value={sortBy} onChange={e => reset(() => setSortBy(e.target.value as any))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#3BAFDA] focus:outline-none" aria-label="Ordenar por">
                <option value="rating">Mejor valorados</option>
                <option value="team">Mayor equipo</option>
                <option value="name">Nombre (A–Z)</option>
              </select>
            </div>
            {!loading && (
              <span className="ml-auto text-sm text-gray-600"><strong className="text-[#0B2545]">{filtered.length}</strong> brokerages encontrados</span>
            )}
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            <button onClick={() => reset(() => setArea(''))} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${!area ? 'border-[#3BAFDA] bg-[#3BAFDA] text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-[#3BAFDA] hover:text-[#3BAFDA]'}`}>Todos</button>
            {CITIES.map(c => (
              <button key={c} onClick={() => reset(() => setArea(area === c ? '' : c))} className={`flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${area === c ? 'border-[#3BAFDA] bg-[#3BAFDA] text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-[#3BAFDA] hover:text-[#3BAFDA]'}`}>
                <FiMapPin className="text-xs" />{c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse rounded-2xl bg-gray-100 h-80" />)}
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center">
              <FiSearch className="mb-3 text-4xl text-gray-300" />
              <p className="text-lg font-semibold text-gray-500">No encontramos brokerages con esos filtros</p>
              <p className="mt-1 text-sm text-gray-400">Prueba a cambiar la ciudad o limpiar los filtros</p>
              <button onClick={() => { setQ(''); setArea(''); setMinTeamSize(0); setPage(1) }} className="mt-4 rounded-lg bg-[#3BAFDA] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2A9FC7]">Limpiar filtros</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginated.map(b => <BrokerCard key={b.id} broker={b} />)}
              </div>
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button disabled={pageClamped <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 hover:border-[#3BAFDA] hover:text-[#3BAFDA]">← Anterior</button>
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    const pn = i + 1
                    return <button key={pn} onClick={() => setPage(pn)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${pageClamped === pn ? 'bg-[#3BAFDA] text-white shadow-md' : 'border border-gray-200 bg-white text-gray-700 hover:border-[#3BAFDA] hover:text-[#3BAFDA]'}`}>{pn}</button>
                  })}
                  <button disabled={pageClamped >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 hover:border-[#3BAFDA] hover:text-[#3BAFDA]">Siguiente →</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* INVESTOR CTA */}
      <section className="bg-gradient-to-r from-[#0B2545] to-[#134074] py-14">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-3 text-3xl font-extrabold text-white">¿Tienes un brokerage?</h2>
          <p className="mb-7 text-white/85 md:text-lg">Potencia tu empresa con la plataforma tecnológica más avanzada del mercado inmobiliario dominicano. Accede a más compradores, inversionistas y herramientas de gestión.</p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/apply" className="inline-flex items-center gap-2 rounded-xl bg-[#3BAFDA] px-7 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#2A9FC7] hover:shadow-xl transition-all">Registrar mi Brokerage <FiArrowRight /></Link>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all"><FiPhone /> Contactar ventas</Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/75">
            {['Leads cualificados', 'CRM para equipos', 'Reportes de mercado', 'Soporte 7 días'].map(b => (
              <span key={b} className="flex items-center gap-1.5"><FiCheckCircle className="text-[#3BAFDA]" /> {b}</span>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  )
}
