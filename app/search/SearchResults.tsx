'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import PropertyCard from '@/components/PropertyCard'
import AdvancedFilters from '@/components/AdvancedFilters'
import type { Listing } from '@/types/listing'
import { FiMapPin, FiSearch, FiBell, FiSliders, FiGrid, FiList, FiX, FiArrowRight, FiCheckCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'
import { useSavedSearches } from '@/hooks/useSavedSearches'

const MARKET_ZONES = [
  { label: 'Santo Domingo', city: 'Santo Domingo' },
  { label: 'Punta Cana', city: 'Punta Cana' },
  { label: 'Santiago', city: 'Santiago' },
  { label: 'Cap Cana', city: 'Cap Cana' },
  { label: 'Las Terrenas', city: 'Las Terrenas' },
  { label: 'La Romana', city: 'La Romana' },
  { label: 'Puerto Plata', city: 'Puerto Plata' },
]

const PROPERTY_TYPES = [
  { label: 'Todos', value: '' },
  { label: 'Apartamento', value: 'apartment' },
  { label: 'Casa', value: 'house' },
  { label: 'Villa', value: 'villa' },
  { label: 'Solar', value: 'land' },
  { label: 'Local Comercial', value: 'commercial' },
  { label: 'Penthouse', value: 'penthouse' },
]

const LISTING_TYPES = [
  { label: 'Venta', value: 'sale' },
  { label: 'Alquiler', value: 'rent' },
]

interface SearchResultsProps {
  initialListings: Listing[]
  initialTotal: number
}

export default function SearchResults({ initialListings, initialTotal }: SearchResultsProps) {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [localFilters, setLocalFilters] = useState<any>({})
  const [savingSearch, setSavingSearch] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest')
  const [alertEmail, setAlertEmail] = useState('')
  const [alertSaving, setAlertSaving] = useState(false)
  const { createSearch } = useSavedSearches()

  useEffect(() => {
    const q = searchParams.get('q') || ''
    const type = searchParams.get('type') || undefined
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const bedrooms = searchParams.get('bedrooms')
    const bathrooms = searchParams.get('bathrooms')
    const listingType = searchParams.get('listingType') || undefined
    const propertyType = searchParams.get('type') || undefined

    setSearchQuery(q)
    setLocalFilters({
      propertyType: type,
      listingType,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
    })
  }, [searchParams])

  const filteredListings = useMemo(() => {
    let filtered = initialListings

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        l =>
          (l.title?.toLowerCase() || '').includes(query) ||
          (l.description?.toLowerCase() || '').includes(query) ||
          (l.city?.toLowerCase() || '').includes(query) ||
          (l.sector?.toLowerCase() || '').includes(query)
      )
    }

    if (localFilters.propertyType) {
      filtered = filtered.filter(l => l.propertyType === localFilters.propertyType)
    }
    if (localFilters.listingType) {
      filtered = filtered.filter(l => (l as any).listingType === localFilters.listingType || (l as any).type === localFilters.listingType)
    }
    if (localFilters.minPrice) {
      filtered = filtered.filter(l => (l.price || 0) >= localFilters.minPrice)
    }
    if (localFilters.maxPrice) {
      filtered = filtered.filter(l => (l.price || 0) <= localFilters.maxPrice)
    }
    if (localFilters.bedrooms) {
      filtered = filtered.filter(l => (l.bedrooms || 0) >= localFilters.bedrooms)
    }
    if (localFilters.bathrooms) {
      filtered = filtered.filter(l => (l.bathrooms || 0) >= localFilters.bathrooms)
    }

    if (sortBy === 'price_asc') return [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0))
    if (sortBy === 'price_desc') return [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0))
    return filtered
  }, [initialListings, searchQuery, localFilters, sortBy])

  function handleAdvancedFilters(appliedFilters: any) {
    setLocalFilters({
      propertyType: appliedFilters.propertyType || undefined,
      listingType: appliedFilters.listingType || undefined,
      minPrice: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined,
      maxPrice: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined,
      bedrooms: appliedFilters.bedrooms ? Number(appliedFilters.bedrooms) : undefined,
      bathrooms: appliedFilters.bathrooms ? Number(appliedFilters.bathrooms) : undefined,
    })
  }

  async function handleSaveSearch() {
    if (savingSearch) return
    setSavingSearch(true)
    try {
      const created = await createSearch({
        label: searchQuery?.trim() || 'Búsqueda personalizada',
        criteria: {
          query: searchQuery || undefined,
          city: searchParams.get('city') || undefined,
          sector: searchParams.get('sector') || undefined,
          listingType: (searchParams.get('listingType') as 'sale' | 'rent' | null) || undefined,
          propertyType: localFilters.propertyType || undefined,
          priceMin: localFilters.minPrice || undefined,
          priceMax: localFilters.maxPrice || undefined,
          bedroomsMin: localFilters.bedrooms || undefined,
          bathroomsMin: localFilters.bathrooms || undefined,
        },
        marketingOptIn: true,
        frequency: 'daily_digest',
      })
      if (!created) {
        toast.error('Inicia sesión para guardar búsquedas')
        return
      }
      toast.success('Búsqueda guardada en tu panel')
    } catch {
      toast.error('No se pudo guardar tu búsqueda')
    } finally {
      setSavingSearch(false)
    }
  }

  async function handleAlertSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!alertEmail || alertSaving) return
    setAlertSaving(true)
    // For now just show a success toast – hook into email capture endpoint later
    await new Promise(r => setTimeout(r, 600))
    toast.success(`¡Perfecto! Te avisaremos a ${alertEmail} cuando haya nuevas propiedades.`)
    setAlertEmail('')
    setAlertSaving(false)
  }

  const activeCity = searchParams.get('city')
  const activePropType = localFilters.propertyType || ''
  const activeListingType = localFilters.listingType || searchParams.get('listingType') || ''

  const activeFilterCount = [
    localFilters.propertyType,
    localFilters.listingType,
    localFilters.minPrice,
    localFilters.maxPrice,
    localFilters.bedrooms,
    localFilters.bathrooms,
  ].filter(Boolean).length

  return (
    <>
      {/* ── STICKY FILTER STRIP ──────────────────────────────────────── */}
      <div className="sticky top-0 z-20 mb-6 rounded-2xl bg-white shadow-md ring-1 ring-gray-200">
        {/* Top row */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ubicación, tipo o proyecto..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm focus:border-[#00A676] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00A676]/20"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} aria-label="Limpiar búsqueda" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FiX size={16} />
              </button>
            )}
          </div>

          {/* Listing type toggle */}
          <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            <button
              onClick={() => setLocalFilters((f: any) => ({ ...f, listingType: undefined }))}
              className={`px-4 py-2.5 text-sm font-medium transition-all ${!activeListingType ? 'bg-[#0B2545] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Todos
            </button>
            {LISTING_TYPES.map(lt => (
              <button
                key={lt.value}
                onClick={() => setLocalFilters((f: any) => ({ ...f, listingType: activeListingType === lt.value ? undefined : lt.value }))}
                className={`px-4 py-2.5 text-sm font-medium transition-all ${activeListingType === lt.value ? 'bg-[#00A676] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {lt.label}
              </button>
            ))}
          </div>

          {/* Filters button */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`relative flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${showFilters ? 'border-[#00A676] bg-[#00A676] text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-[#00A676] hover:text-[#00A676]'}`}
          >
            <FiSliders size={16} />
            Filtros
            {activeFilterCount > 0 && (
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${showFilters ? 'bg-white text-[#00A676]' : 'bg-[#00A676] text-white'}`}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* View toggle */}
          <div className="hidden items-center overflow-hidden rounded-xl border border-gray-200 sm:flex">
            <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-all ${viewMode === 'grid' ? 'bg-[#0B2545] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`} aria-label="Vista cuadrícula"><FiGrid size={16} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2.5 transition-all ${viewMode === 'list' ? 'bg-[#0B2545] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`} aria-label="Vista lista"><FiList size={16} /></button>
          </div>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="border-t border-gray-100 p-4">
            <AdvancedFilters onApply={handleAdvancedFilters} />
          </div>
        )}
      </div>

      {/* ── MARKET ZONE PILLS ────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href="/search"
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${!activeCity ? 'border-[#0B2545] bg-[#0B2545] text-white shadow' : 'border-gray-200 bg-white text-gray-600 hover:border-[#0B2545] hover:text-[#0B2545]'}`}
        >
          Toda la RD
        </Link>
        {MARKET_ZONES.map(zone => {
          const isActive = activeCity?.toLowerCase() === zone.city.toLowerCase()
          return (
            <Link
              key={zone.city}
              href={isActive ? '/search' : `/search?city=${encodeURIComponent(zone.city)}`}
              className={`flex items-center gap-1 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'border-[#00A676] bg-[#00A676] text-white shadow'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-[#00A676] hover:text-[#00A676]'
              }`}
            >
              <FiMapPin size={10} /> {zone.label}
            </Link>
          )
        })}
      </div>

      {/* Property type pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {PROPERTY_TYPES.map(pt => (
          <button
            key={pt.value}
            onClick={() => setLocalFilters((f: any) => ({ ...f, propertyType: pt.value || undefined }))}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
              activePropType === pt.value
                ? 'border-[#FF6B35] bg-[#FF6B35] text-white shadow'
                : 'border-gray-200 bg-white text-gray-600 hover:border-[#FF6B35] hover:text-[#FF6B35]'
            }`}
          >
            {pt.label}
          </button>
        ))}
      </div>

      {/* ── RESULTS META BAR ─────────────────────────────────────────── */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          <span className="font-bold text-[#0B2545] text-base">{filteredListings.length}</span>{' '}
          {filteredListings.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}
          {activeCity ? ` en ${activeCity}` : ''}
        </p>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00A676]"
            aria-label="Ordenar por"
          >
            <option value="newest">Más recientes</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>
          <button
            type="button"
            onClick={handleSaveSearch}
            disabled={savingSearch}
            className="hidden items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-[#00A676] hover:text-[#00A676] disabled:opacity-50 sm:flex"
          >
            <FiBell size={13} />
            {savingSearch ? 'Guardando...' : 'Guardar búsqueda'}
          </button>
        </div>
      </div>

      {/* ── RESULTS GRID ─────────────────────────────────────────────── */}
      {filteredListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <FiSearch className="text-4xl text-gray-300" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-700">No encontramos propiedades</h3>
          <p className="mb-6 max-w-sm text-sm text-gray-400">
            Intenta cambiar los filtros, ampliar el rango de precio o explorar otras ciudades.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => { setSearchQuery(''); setLocalFilters({}); setSortBy('newest') }}
              className="rounded-xl bg-[#0B2545] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#134074]"
            >
              Limpiar filtros
            </button>
            <Link href="/search" className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:border-[#00A676] hover:text-[#00A676]">
              Ver todo el inventario
            </Link>
          </div>

          {/* Alert signup on empty */}
          <div className="mt-8 w-full max-w-md rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <h4 className="mb-1 font-bold text-[#0B2545]">Recibe alertas de nuevas propiedades</h4>
            <p className="mb-3 text-xs text-gray-500">Te avisamos cuando llegue algo que coincida con tu búsqueda.</p>
            <form onSubmit={handleAlertSignup} className="flex gap-2">
              <input
                type="email"
                value={alertEmail}
                onChange={e => setAlertEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#00A676] focus:outline-none focus:ring-2 focus:ring-[#00A676]/20"
              />
              <button
                type="submit"
                disabled={alertSaving}
                className="rounded-xl bg-[#00A676] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#008F64] disabled:opacity-50"
              >
                {alertSaving ? '...' : 'Activar'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div className={viewMode === 'list' ? 'flex flex-col gap-4' : 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'}>
            {filteredListings.map(listing => (
              <PropertyCard key={listing.id} property={listing} />
            ))}
          </div>

          {/* Lead capture band */}
          {filteredListings.length >= 6 && (
            <div className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B2545] to-[#134074] p-8 text-center shadow-xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#00A676]/20 px-4 py-1.5 text-sm font-semibold text-[#00A676]">
                <FiBell size={14} /> Alertas de propiedades
              </div>
              <h3 className="mb-2 text-2xl font-extrabold text-white">
                ¿No encontraste lo ideal?
              </h3>
              <p className="mb-6 text-white/75">
                Dinos qué buscas y te avisamos cuando aparezca la propiedad perfecta en la RD.
              </p>
              <form onSubmit={handleAlertSignup} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={alertEmail}
                  onChange={e => setAlertEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="flex-1 rounded-xl border-0 bg-white px-5 py-3 text-sm text-gray-800 shadow-md placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A676]"
                />
                <button
                  type="submit"
                  disabled={alertSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00A676] px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#008F64] disabled:opacity-50"
                >
                  {alertSaving ? 'Activando...' : <><FiBell size={14} /> Activar alertas</>}
                </button>
              </form>
              <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-white/60">
                {['Sin spam', 'Cancela cuando quieras', 'Gratis'].map(t => (
                  <span key={t} className="flex items-center gap-1"><FiCheckCircle size={11} /> {t}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
