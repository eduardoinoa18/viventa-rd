'use client'

import { useEffect, useMemo, useState } from 'react'
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
  permissions?: {
    canCreate?: boolean
    canUseMls?: boolean
    canModerate?: boolean
  }
}

function toMillis(value: unknown): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object' && value !== null && 'toDate' in (value as any)) {
    const date = (value as any).toDate()
    return date instanceof Date ? date.getTime() : 0
  }
  const parsed = new Date(String(value))
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0
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
  const [workspaceMode, setWorkspaceMode] = useState<'my' | 'mls'>('my')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'sold' | 'inactive'>('all')
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

        const params = new URLSearchParams({ mode: workspaceMode, limit: '200' })
        if (statusFilter !== 'all') params.set('status', statusFilter)

        const listingsRes = await fetch(`/api/listings/workspace?${params.toString()}`, { cache: 'no-store' })
        const listingsJson = (await listingsRes.json().catch(() => ({}))) as WorkspaceResponse & { error?: string }
        if (!listingsRes.ok || !listingsJson?.ok) {
          throw new Error(listingsJson?.error || 'No se pudieron cargar listados')
        }

        setPermissions(listingsJson.permissions || null)
        setListings(Array.isArray(listingsJson.listings) ? listingsJson.listings : [])
      } catch (loadError: any) {
        setError(loadError?.message || 'No se pudieron cargar listados')
        setListings([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [workspaceMode, statusFilter])

  const sortedListings = useMemo(
    () => [...listings].sort((a, b) => toMillis((b as any).updatedAt || b.createdAt) - toMillis((a as any).updatedAt || a.createdAt)),
    [listings]
  )

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
              onClick={() => setWorkspaceMode('my')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                workspaceMode === 'my' ? 'bg-[#0B2545] text-white border-[#0B2545]' : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              Mis listados
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceMode('mls')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                workspaceMode === 'mls' ? 'bg-[#0B2545] text-white border-[#0B2545]' : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              MLS interno
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(['all', 'active', 'pending', 'sold', 'inactive'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
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
        </section>

        {error ? (
          <section className="bg-white rounded-xl border border-red-200 shadow-sm p-4 text-sm text-red-700">{error}</section>
        ) : null}

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
          {shareStatus ? (
            <p className="mb-3 text-xs text-[#0B2545] bg-[#E8F4FF] border border-[#CFE8FF] rounded-lg px-3 py-2">{shareStatus}</p>
          ) : null}

          {!sortedListings.length ? (
            <div className="text-sm text-gray-500">
              {workspaceMode === 'mls' ? 'No hay resultados MLS para este filtro.' : 'No tienes listados para este filtro.'}{' '}
              {workspaceMode === 'my' ? (
                <Link href="/dashboard/listings/create" className="text-[#00A676] font-medium">Crea tu primer listado</Link>
              ) : null}
              .
            </div>
          ) : (
            <div className="space-y-2">
              {sortedListings.map((listing) => (
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
        </section>
      </div>
    </main>
  )
}
