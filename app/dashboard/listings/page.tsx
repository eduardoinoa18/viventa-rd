'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type SessionData = {
  uid: string
  role: string
  name?: string
}

type Listing = {
  id: string
  listingId?: string
  title: string
  city?: string
  sector?: string
  neighborhood?: string
  status?: string
  price?: number
  currency?: string
  propertyType?: string
  listingType?: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  daysOnMarket?: number
  commissionOffered?: number
  showingInstructions?: string
  internalNotes?: string
  privateContactName?: string
  privateContactPhone?: string
  privateContactEmail?: string
  responsibleAgent?: string
  responsibleBroker?: string
  constructora?: string
  createdAt?: unknown
}

type WorkspaceResponse = {
  ok: boolean
  listings: Listing[]
  total?: number
  page?: number
  pageSize?: number
  hasMore?: boolean
  permissions?: {
    canCreate?: boolean
    canUseMls?: boolean
    canModerate?: boolean
  }
}

function formatPrice(value?: number, currency = 'USD') {
  if (!value || Number.isNaN(Number(value))) return 'Precio no disponible'
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value))
}

export default function ListingsWorkspacePage() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [permissions, setPermissions] = useState<WorkspaceResponse['permissions'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(24)
  const [hasMore, setHasMore] = useState(false)
  const [queryText, setQueryText] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [workspaceMode, setWorkspaceMode] = useState<'my' | 'mls'>('my')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'sold' | 'rented' | 'inactive'>('all')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('')
  const [listingTypeFilter, setListingTypeFilter] = useState('')
  const [bedroomsMin, setBedroomsMin] = useState('')
  const [bathroomsMin, setBathroomsMin] = useState('')
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'price'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [shareStatus, setShareStatus] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')

        const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' })
        const sessionJson = await sessionRes.json().catch(() => ({}))
        if (!sessionRes.ok || !sessionJson?.ok) {
          setSession(null)
          setError('Inicia sesión para gestionar tus listados.')
          return
        }

        const role = String(sessionJson?.session?.role || '')
        if (!['agent', 'broker', 'constructora', 'master_admin', 'admin'].includes(role)) {
          setSession(sessionJson.session)
          setError('Este espacio está disponible para cuentas profesionales o administración.')
          return
        }

        setSession(sessionJson.session)

        const params = new URLSearchParams({
          mode: workspaceMode,
          page: String(page),
          pageSize: String(pageSize),
        })
        if (statusFilter !== 'all') params.set('status', statusFilter)
        if (queryText.trim()) params.set('q', queryText.trim())
        if (cityFilter.trim()) params.set('city', cityFilter.trim())
        if (minPrice.trim()) params.set('minPrice', minPrice.trim())
        if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim())
        if (propertyTypeFilter.trim()) params.set('propertyType', propertyTypeFilter.trim())
        if (listingTypeFilter.trim()) params.set('listingType', listingTypeFilter.trim())
        if (bedroomsMin.trim()) params.set('bedroomsMin', bedroomsMin.trim())
        if (bathroomsMin.trim()) params.set('bathroomsMin', bathroomsMin.trim())
        params.set('sortBy', sortBy)
        params.set('sortOrder', sortOrder)

        const listingsRes = await fetch(`/api/listings/workspace?${params.toString()}`, { cache: 'no-store' })
        const listingsJson = (await listingsRes.json().catch(() => ({}))) as WorkspaceResponse & { error?: string }
        if (!listingsRes.ok || !listingsJson?.ok) {
          throw new Error(listingsJson?.error || 'No se pudieron cargar listados')
        }

        setPermissions(listingsJson.permissions || null)
        setListings(Array.isArray(listingsJson.listings) ? listingsJson.listings : [])
        setTotal(Number(listingsJson.total || 0))
        setHasMore(Boolean(listingsJson.hasMore))
      } catch (loadError: any) {
        setError(loadError?.message || 'No se pudieron cargar listados')
        setListings([])
        setTotal(0)
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [
    workspaceMode,
    statusFilter,
    page,
    pageSize,
    queryText,
    cityFilter,
    minPrice,
    maxPrice,
    propertyTypeFilter,
    listingTypeFilter,
    bedroomsMin,
    bathroomsMin,
    sortBy,
    sortOrder,
  ])

  async function shareListing(listingId: string) {
    if (!session) return
    const roleLabel =
      session.role === 'broker'
        ? 'Broker'
        : session.role === 'agent'
          ? 'Agente'
          : session.role === 'constructora'
            ? 'Constructora'
            : 'Profesional'

    const senderName = encodeURIComponent(session.name || 'Profesional Viventa')
    const senderRole = encodeURIComponent(roleLabel)
    const shareUrl = `${window.location.origin}/listing/${encodeURIComponent(listingId)}?sharedByName=${senderName}&sharedByRole=${senderRole}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareStatus('Enlace copiado con atribución del profesional.')
      window.setTimeout(() => setShareStatus(''), 2500)
    } catch {
      setShareStatus('No se pudo copiar el enlace. Puedes copiarlo manualmente desde la barra del navegador.')
    }
  }

  function applyQuickFilters() {
    setPage(1)
  }

  function clearQuickFilters() {
    setQueryText('')
    setCityFilter('')
    setMinPrice('')
    setMaxPrice('')
    setPropertyTypeFilter('')
    setListingTypeFilter('')
    setBedroomsMin('')
    setBathroomsMin('')
    setSortBy('updatedAt')
    setSortOrder('desc')
    setPage(1)
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">Cargando workspace...</div>
  }

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Workspace de Listados</h1>
              <p className="text-sm text-gray-600 mt-1">Unifica gestión propia y MLS interno con permisos por rol.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Volver al panel</Link>
              {permissions?.canModerate ? (
                <Link href="/master/listings" className="px-3 py-2 rounded-lg border border-[#0B2545] text-sm font-medium text-[#0B2545]">Panel Master</Link>
              ) : null}
              {permissions?.canCreate !== false ? (
                <Link href="/dashboard/listings/create" className="px-3 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-medium">Crear listado</Link>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setWorkspaceMode('my')
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                workspaceMode === 'my' ? 'bg-[#0B2545] text-white border-[#0B2545]' : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              Mis listados
            </button>
            <button
              type="button"
              onClick={() => {
                setWorkspaceMode('mls')
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                workspaceMode === 'mls' ? 'bg-[#0B2545] text-white border-[#0B2545]' : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              MLS interno
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(['all', 'active', 'pending', 'sold', 'rented', 'inactive'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status)
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  statusFilter === status
                    ? 'bg-[#0B2545] text-white border-[#0B2545]'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                {status === 'all' ? 'Todos' : status}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Buscar por título o proyecto"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm lg:col-span-2"
            />
            <input
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Ciudad"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <input
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Precio min"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Precio max"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
            <select
              value={propertyTypeFilter}
              onChange={(e) => setPropertyTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              title="Tipo de propiedad"
            >
              <option value="">Tipo propiedad</option>
              <option value="apartment">Apartamento</option>
              <option value="house">Casa</option>
              <option value="penthouse">Penthouse</option>
              <option value="villa">Villa</option>
              <option value="office">Oficina</option>
              <option value="commercial">Comercial</option>
              <option value="land">Solar/Terreno</option>
              <option value="project">Proyecto</option>
            </select>
            <select
              value={listingTypeFilter}
              onChange={(e) => setListingTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              title="Tipo de operación"
            >
              <option value="">Operación</option>
              <option value="sale">Venta</option>
              <option value="rent">Alquiler</option>
            </select>
            <input
              value={bedroomsMin}
              onChange={(e) => setBedroomsMin(e.target.value)}
              placeholder="Min hab"
              inputMode="numeric"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <input
              value={bathroomsMin}
              onChange={(e) => setBathroomsMin(e.target.value)}
              placeholder="Min baños"
              inputMode="numeric"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'updatedAt' | 'createdAt' | 'price')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              title="Ordenar por"
            >
              <option value="updatedAt">Ordenar: actividad reciente</option>
              <option value="createdAt">Ordenar: fecha de alta</option>
              <option value="price">Ordenar: precio</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              title="Dirección de orden"
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>

          <div className="mt-2 flex gap-2">
            <button onClick={applyQuickFilters} type="button" className="px-3 py-1.5 rounded-lg bg-[#0B2545] text-white text-xs font-medium">Aplicar filtros</button>
            <button onClick={clearQuickFilters} type="button" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700">Limpiar</button>
          </div>
        </section>

        {error ? (
          <section className="bg-white rounded-xl border border-red-200 shadow-sm p-4 text-sm text-red-700">{error}</section>
        ) : null}

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <div className="mb-3 text-xs text-gray-600">Mostrando {listings.length} de {total} resultados</div>
          {shareStatus ? (
            <p className="mb-3 text-xs text-[#0B2545] bg-[#E8F4FF] border border-[#CFE8FF] rounded-lg px-3 py-2">{shareStatus}</p>
          ) : null}

          {!listings.length ? (
            <div className="text-sm text-gray-500">
              {workspaceMode === 'mls' ? 'No hay resultados MLS para este filtro.' : 'No tienes listados para este filtro.'}{' '}
              {workspaceMode === 'my' ? (
                <Link href="/dashboard/listings/create" className="text-[#00A676] font-medium">Crea tu primer listado</Link>
              ) : null}
              .
            </div>
          ) : (
            <div className="space-y-2">
              {listings.map((listing) => (
                <div key={listing.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/listing/${listing.id}`} className="min-w-0 flex-1 hover:text-[#00A676] transition-colors">
                      <div className="text-sm font-semibold text-[#0B2545]">{listing.title || 'Listado sin título'}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {(listing.city || 'RD')}
                        {listing.sector ? `, ${listing.sector}` : listing.neighborhood ? `, ${listing.neighborhood}` : ''}
                        {' • '}{listing.status || 'active'}
                        {listing.propertyType ? ` • ${listing.propertyType}` : ''}
                        {listing.listingType ? ` • ${listing.listingType}` : ''}
                        {typeof listing.bedrooms === 'number' ? ` • ${listing.bedrooms} hab` : ''}
                        {typeof listing.bathrooms === 'number' ? ` • ${listing.bathrooms} baños` : ''}
                        {typeof listing.area === 'number' && listing.area > 0 ? ` • ${listing.area} m2` : ''}
                        {typeof listing.daysOnMarket === 'number' && listing.daysOnMarket > 0 ? ` • ${listing.daysOnMarket} DOM` : ''}
                      </div>
                    </Link>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[#0B2545]">{formatPrice(listing.price, listing.currency || 'USD')}</div>
                      <button
                        type="button"
                        onClick={() => shareListing(listing.id)}
                        className="mt-2 text-xs px-2 py-1 rounded-md border border-gray-200 text-[#0B2545] hover:bg-gray-50"
                      >
                        Compartir
                      </button>
                    </div>
                  </div>

                  {listing.listingId ? <div className="text-[11px] text-gray-500 mt-1">{listing.listingId}</div> : null}

                  {workspaceMode === 'mls' ? (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                      <div className="rounded-md bg-gray-50 border border-gray-100 px-2 py-2">
                        <div><span className="font-semibold text-gray-700">Comisión:</span> {listing.commissionOffered ? `${listing.commissionOffered}%` : 'N/D'}</div>
                        <div><span className="font-semibold text-gray-700">Agente:</span> {listing.responsibleAgent || 'N/D'}</div>
                        <div><span className="font-semibold text-gray-700">Broker:</span> {listing.responsibleBroker || 'N/D'}</div>
                        <div><span className="font-semibold text-gray-700">Constructora:</span> {listing.constructora || 'N/D'}</div>
                      </div>
                      <div className="rounded-md bg-gray-50 border border-gray-100 px-2 py-2">
                        <div><span className="font-semibold text-gray-700">Instrucciones:</span> {listing.showingInstructions || 'N/D'}</div>
                        <div><span className="font-semibold text-gray-700">Contacto:</span> {listing.privateContactName || 'N/D'} {listing.privateContactPhone ? `• ${listing.privateContactPhone}` : ''}</div>
                        <div><span className="font-semibold text-gray-700">Email:</span> {listing.privateContactEmail || 'N/D'}</div>
                        {listing.internalNotes ? <div><span className="font-semibold text-gray-700">Notas:</span> {listing.internalNotes}</div> : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {total > 0 ? (
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-xs text-gray-600">Página {page}</span>
              <button
                type="button"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!hasMore}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
