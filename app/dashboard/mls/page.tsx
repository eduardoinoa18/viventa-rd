'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  FiSearch, FiFilter, FiMapPin, FiBriefcase, FiDollarSign, FiHome, FiPhone,
  FiMail, FiEye, FiChevronLeft, FiChevronRight, FiInfo, FiLock, FiPercent,
} from 'react-icons/fi'

interface MLSListing {
  id: string
  listingId: string
  title: string
  city: string
  sector: string
  province: string
  propertyType: string
  listingType: string
  price: number
  currency: string
  bedrooms: number
  bathrooms: number
  area: number
  images: string[]
  coverImage: string
  features: string[]
  deslindadoStatus: string
  furnishedStatus: string
  mlsOnly: boolean
  cobrokeCommissionPercent: number
  commissionType: string
  showingInstructions: string
  internalNotes: string
  privateContactName: string
  privateContactPhone: string
  privateContactEmail: string
  brokerName: string
  agentId: string
  isVerified: boolean
  qualityScore: number
  updatedAt: string | null
}

const PROPERTY_TYPES = ['', 'apartment', 'house', 'condo', 'villa', 'penthouse', 'land', 'commercial']
const LISTING_TYPES  = ['', 'sale', 'rent']
const DR_CITIES      = ['', 'Santo Domingo', 'Punta Cana', 'Cap Cana', 'La Romana', 'Bávaro', 'Santiago', 'Puerto Plata', 'Samaná', 'Bayahíbe']

function fmtPrice(p: number, c: string) {
  return c === 'DOP'
    ? `RD$${p.toLocaleString('es-DO')}`
    : `$${p.toLocaleString('en-US')}`
}

function CommissionBadge({ pct, type }: { pct: number; type: string }) {
  if (!pct) return null
  const label = type === 'rental-split' ? `${pct}% split` : `${pct}% cobroke`
  return (
    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
      <FiPercent className="w-3 h-3" /> {label}
    </span>
  )
}

function Badge({ label, color = 'gray' }: { label: string; color?: string }) {
  const map: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[color] || map.gray}`}>
      {label}
    </span>
  )
}

export default function InternalMLSPage() {
  const [listings, setListings] = useState<MLSListing[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<MLSListing | null>(null)

  // filters
  const [q,           setQ]           = useState('')
  const [city,        setCity]        = useState('')
  const [propType,    setPropType]    = useState('')
  const [listType,    setListType]    = useState('')
  const [minPrice,    setMinPrice]    = useState('')
  const [maxPrice,    setMaxPrice]    = useState('')
  const [minBeds,     setMinBeds]     = useState('')
  const [minComm,     setMinComm]     = useState('')
  const [cobrokeOnly, setCobrokeOnly] = useState(false)
  const [page,        setPage]        = useState(1)
  const [total,       setTotal]       = useState(0)
  const [hasMore,     setHasMore]     = useState(false)
  const PAGE_SIZE = 20

  const buildUrl = useCallback((pg = 1) => {
    const params = new URLSearchParams({ page: String(pg), pageSize: String(PAGE_SIZE) })
    if (q)           params.set('q', q)
    if (city)        params.set('city', city)
    if (propType)    params.set('propertyType', propType)
    if (listType)    params.set('listingType', listType)
    if (minPrice)    params.set('minPrice', minPrice)
    if (maxPrice)    params.set('maxPrice', maxPrice)
    if (minBeds)     params.set('minBeds', minBeds)
    if (minComm)     params.set('minCommission', minComm)
    if (cobrokeOnly) params.set('cobroke', 'true')
    return `/api/listings/mls?${params.toString()}`
  }, [q, city, propType, listType, minPrice, maxPrice, minBeds, minComm, cobrokeOnly])

  const load = useCallback(async (pg = 1) => {
    setLoading(true)
    try {
      const res  = await fetch(buildUrl(pg))
      const json = await res.json()
      setListings(json.listings || [])
      setTotal(json.total || 0)
      setHasMore(json.hasMore || false)
      setPage(pg)
    } catch { /* noop */ }
    setLoading(false)
  }, [buildUrl])

  useEffect(() => { load(1) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    load(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FiLock className="text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">MLS Interno — Viventa</h1>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Acceso exclusivo para profesionales verificados · Información confidencial</p>
        </div>
        <Link
          href="/dashboard/listings"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Mis Listados
        </Link>
      </div>

      <div className="flex min-h-[calc(100vh-65px)]">
        {/* ─── Filters sidebar ──────────────────────────────────────────── */}
        <aside className="w-72 shrink-0 border-r border-gray-200 bg-white p-5 overflow-y-auto">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Búsqueda</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input
                  value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Título, sector, ciudad..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ciudad</label>
              <select title="Filtrar por ciudad" aria-label="Filtrar por ciudad" value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {DR_CITIES.map((c) => <option key={c} value={c}>{c || 'Todas las ciudades'}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tipo de Propiedad</label>
              <select title="Filtrar por tipo de propiedad" aria-label="Filtrar por tipo de propiedad" value={propType} onChange={(e) => setPropType(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t || 'Todos los tipos'}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Venta / Alquiler</label>
              <select title="Filtrar por modalidad" aria-label="Filtrar por modalidad" value={listType} onChange={(e) => setListType(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {LISTING_TYPES.map((t) => <option key={t} value={t}>{t ? (t === 'sale' ? 'Venta' : 'Alquiler') : 'Todos'}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Precio Min</label>
                <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" placeholder="0" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Precio Max</label>
                <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" placeholder="∞" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Hab. Min</label>
                <input title="Habitaciones mínimas" aria-label="Habitaciones mínimas" value={minBeds} onChange={(e) => setMinBeds(e.target.value)} type="number" min="0" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Comisión Min %</label>
                <input title="Comisión mínima" aria-label="Comisión mínima" value={minComm} onChange={(e) => setMinComm(e.target.value)} type="number" min="0" step="0.5" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={cobrokeOnly} onChange={(e) => setCobrokeOnly(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700 font-medium">Solo propiedades co-broke</span>
            </label>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <FiSearch className="w-4 h-4" /> Buscar MLS
            </button>
          </form>
        </aside>

        {/* ─── Results ──────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {/* stats bar */}
          <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {loading ? 'Cargando...' : `${total} propiedad${total !== 1 ? 'es' : ''} encontrada${total !== 1 ? 's' : ''}`}
            </p>
            {total > PAGE_SIZE && (
              <div className="flex items-center gap-2">
                <button title="Página anterior" aria-label="Página anterior" onClick={() => load(page - 1)} disabled={page <= 1} className="p-1.5 rounded border border-gray-200 disabled:opacity-40">
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">Pág. {page}</span>
                <button title="Página siguiente" aria-label="Página siguiente" onClick={() => load(page + 1)} disabled={!hasMore} className="p-1.5 rounded border border-gray-200 disabled:opacity-40">
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">Cargando MLS...</div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
              <FiFilter className="w-10 h-10 opacity-30" />
              <p className="font-medium">No se encontraron listados con esos filtros.</p>
            </div>
          ) : (
            <div className={`grid gap-0 ${selected ? 'xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'} p-0`}>
              {listings.map((l) => (
                <MLSCard key={l.id} listing={l} onClick={() => setSelected(selected?.id === l.id ? null : l)} isSelected={selected?.id === l.id} />
              ))}
            </div>
          )}
        </main>

        {/* ─── Detail panel ─────────────────────────────────────────────── */}
        {selected && (
          <aside className="w-96 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
            <MLSDetailPanel listing={selected} onClose={() => setSelected(null)} />
          </aside>
        )}
      </div>
    </div>
  )
}

function MLSCard({ listing: l, onClick, isSelected }: { listing: MLSListing; onClick: () => void; isSelected: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`border-b border-gray-100 p-4 cursor-pointer hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
    >
      <div className="flex gap-3">
        {/* Photo */}
        <div className="w-28 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
          {l.coverImage || l.images?.[0] ? (
            <img src={l.coverImage || l.images[0]} alt={l.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <FiHome className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{l.title}</h3>
            {l.mlsOnly && <FiLock className="text-blue-400 shrink-0 w-3.5 h-3.5 mt-0.5" />}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <FiMapPin className="w-3 h-3" />
            <span>{l.sector ? `${l.sector}, ` : ''}{l.city}</span>
          </div>
          <div className="mt-1.5 font-bold text-blue-700 text-sm">
            {fmtPrice(l.price, l.currency)}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {l.bedrooms > 0 && <Badge label={`${l.bedrooms} hab.`} color="gray" />}
            {l.bathrooms > 0 && <Badge label={`${l.bathrooms} baños`} color="gray" />}
            {l.area > 0 && <Badge label={`${l.area} m²`} color="gray" />}
            <CommissionBadge pct={l.cobrokeCommissionPercent} type={l.commissionType} />
          </div>
        </div>
      </div>
    </div>
  )
}

function MLSDetailPanel({ listing: l, onClose }: { listing: MLSListing; onClose: () => void }) {
  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-sm line-clamp-1">{l.title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-light leading-none">×</button>
      </div>

      {/* Photo */}
      {(l.coverImage || l.images?.[0]) && (
        <img src={l.coverImage || l.images[0]} alt={l.title} className="w-full h-48 object-cover" />
      )}

      <div className="p-4 space-y-5">
        {/* Price + commission */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-blue-700">{fmtPrice(l.price, l.currency)}</p>
            <p className="text-xs text-gray-500">{l.listingType === 'rent' ? 'Alquiler / mes' : 'Precio de venta'}</p>
          </div>
          <CommissionBadge pct={l.cobrokeCommissionPercent} type={l.commissionType} />
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 text-sm text-gray-700">
          <FiMapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
          <span>{[l.sector, l.city, l.province].filter(Boolean).join(', ')}</span>
        </div>

        {/* Property details grid */}
        <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-xl p-3">
          {[
            { label: 'Habitaciones', value: l.bedrooms || '—' },
            { label: 'Baños',        value: l.bathrooms || '—' },
            { label: 'Área',         value: l.area ? `${l.area} m²` : '—' },
            { label: 'Tipo',         value: l.propertyType || '—' },
            { label: 'Estado legal', value: l.deslindadoStatus === 'deslindado' ? 'Deslindado' : l.deslindadoStatus || '—' },
            { label: 'Amueblado',    value: l.furnishedStatus || '—' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-sm font-semibold text-gray-800 capitalize">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Non-public: Private contact */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs uppercase tracking-wide">
            <FiLock className="w-3.5 h-3.5" /> Contacto Privado del Listado
          </div>
          {l.privateContactName && (
            <div className="flex items-center gap-2 text-sm text-gray-800">
              <FiBriefcase className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{l.privateContactName}</span>
            </div>
          )}
          {l.privateContactPhone && (
            <a href={`tel:${l.privateContactPhone}`} className="flex items-center gap-2 text-sm text-blue-700 hover:underline">
              <FiPhone className="w-4 h-4" />  {l.privateContactPhone}
            </a>
          )}
          {l.privateContactEmail && (
            <a href={`mailto:${l.privateContactEmail}`} className="flex items-center gap-2 text-sm text-blue-700 hover:underline">
              <FiMail className="w-4 h-4" />  {l.privateContactEmail}
            </a>
          )}
        </div>

        {/* Non-public: Showing instructions */}
        {l.showingInstructions && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <FiInfo className="w-3.5 h-3.5" /> Instrucciones de Visita
            </p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{l.showingInstructions}</p>
          </div>
        )}

        {/* Non-public: Internal notes */}
        {l.internalNotes && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <FiLock className="w-3.5 h-3.5" /> Notas Internas (Confidencial)
            </p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{l.internalNotes}</p>
          </div>
        )}

        {/* Features */}
        {l.features?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Características</p>
            <div className="flex flex-wrap gap-1.5">
              {l.features.map((f) => (
                <span key={f} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">{f}</span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/listing/${l.id}`}
          target="_blank"
          className="flex items-center justify-center gap-2 w-full border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <FiEye className="w-4 h-4" /> Ver Ficha Pública
        </Link>
      </div>
    </div>
  )
}
