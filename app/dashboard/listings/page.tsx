'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type SessionData = {
  uid: string
  role: string
}

type Listing = {
  id: string
  listingId?: string
  title?: string
  city?: string
  neighborhood?: string
  status?: string
  price?: number
  currency?: 'USD' | 'DOP'
  createdAt?: unknown
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

function formatPrice(value?: number, currency: 'USD' | 'DOP' = 'USD') {
  if (!value || Number.isNaN(Number(value))) return 'Precio no disponible'
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value))
}

export default function ProfessionalListingsPage() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'sold' | 'inactive'>('all')

  useEffect(() => {
    const load = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' })
        const sessionJson = await sessionRes.json().catch(() => ({}))
        if (!sessionRes.ok || !sessionJson?.ok) {
          setSession(null)
          setError('Inicia sesión para gestionar tus listados.')
          return
        }

        const role = String(sessionJson?.session?.role || '')
        if (!['agent', 'broker', 'constructora'].includes(role)) {
          setSession(sessionJson.session)
          setError('Este espacio está disponible para cuentas profesionales.')
          return
        }

        setSession(sessionJson.session)

        const url = statusFilter === 'all'
          ? '/api/broker/listings/my'
          : `/api/broker/listings/my?status=${encodeURIComponent(statusFilter)}`

        const listingsRes = await fetch(url, { cache: 'no-store' })
        const listingsJson = await listingsRes.json().catch(() => ({}))
        if (!listingsRes.ok) {
          throw new Error(listingsJson?.error || 'No se pudieron cargar tus listados')
        }

        const rows = Array.isArray(listingsJson?.listings) ? listingsJson.listings : []
        setMyListings(rows)
      } catch (loadError: any) {
        setError(loadError?.message || 'No se pudieron cargar tus listados')
        setMyListings([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [statusFilter])

  const sortedListings = useMemo(
    () => [...myListings].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)),
    [myListings]
  )

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">Cargando listados...</div>
  }

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Mis listados</h1>
              <p className="text-sm text-gray-600 mt-1">Gestiona tus propiedades publicadas y en pipeline.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Volver al panel</Link>
              <Link href="/dashboard/listings/create" className="px-3 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-medium">Crear listado</Link>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
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

        {error && (
          <section className="bg-white rounded-xl border border-red-200 shadow-sm p-4 text-sm text-red-700">
            {error}
          </section>
        )}

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
          {!sortedListings.length ? (
            <div className="text-sm text-gray-500">
              No tienes listados para este filtro.{' '}
              <Link href="/dashboard/listings/create" className="text-[#00A676] font-medium">Crea tu primer listado</Link>.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listing/${listing.id}`}
                  className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-[#0B2545]">{listing.title || 'Listado sin título'}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {(listing.city || 'RD')}{listing.neighborhood ? `, ${listing.neighborhood}` : ''} • {listing.status || 'active'}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-[#0B2545]">{formatPrice(listing.price, listing.currency || 'USD')}</div>
                  </div>
                  {listing.listingId ? <div className="text-[11px] text-gray-500 mt-1">{listing.listingId}</div> : null}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
