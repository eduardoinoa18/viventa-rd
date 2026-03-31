'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

type SessionData = {
  uid?: string
  role?: string
  name?: string
}

function formatMoney(amount: number, currency = 'USD') {
  if (!amount || Number.isNaN(Number(amount))) return 'No disponible'
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

function formatDate(value: unknown) {
  if (!value) return 'N/D'
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return 'N/D'
  return parsed.toLocaleString('es-DO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDaysOnMarket(value: unknown) {
  if (!value) return 0
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return 0
  return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / (24 * 60 * 60 * 1000)))
}

export default function ListingSheetPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [session, setSession] = useState<SessionData | null>(null)
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')

        const [sessionRes, listingRes] = await Promise.all([
          fetch('/api/auth/session', { cache: 'no-store' }),
          fetch(`/api/properties/${id}`, { cache: 'no-store' }),
        ])

        const sessionJson = await sessionRes.json().catch(() => ({}))
        const listingJson = await listingRes.json().catch(() => ({}))

        if (!active) return

        setSession(sessionRes.ok && sessionJson?.ok ? sessionJson.session : null)

        if (!listingRes.ok || !listingJson?.ok || !listingJson?.data) {
          setListing(null)
          setError(String(listingJson?.error || 'No se pudo cargar la ficha'))
          return
        }

        setListing(listingJson.data)
      } catch {
        if (!active) return
        setListing(null)
        setError('No se pudo cargar la ficha MLS')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [id])

  const allowed = useMemo(
    () => ['agent', 'broker', 'constructora', 'master_admin', 'admin'].includes(String(session?.role || '').toLowerCase()),
    [session?.role]
  )
  const daysOnMarket = getDaysOnMarket(listing?.createdAt)
  const pricePerM2 = Number(listing?.area || 0) > 0 ? Number(listing?.price || 0) / Number(listing.area) : 0
  const featureList = Array.isArray(listing?.features) ? listing.features : []

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">Cargando ficha MLS...</div>
        <Footer />
      </>
    )
  }

  if (!allowed) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 px-4 py-16">
          <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00A676]">Acceso restringido</p>
            <h1 className="mt-3 text-2xl font-bold text-[#0B2545]">La ficha MLS es solo para profesionales verificados</h1>
            <p className="mt-3 text-sm text-gray-600">Inicia sesion con una cuenta profesional para ver contacto privado, comision, instrucciones de showing y notas operativas.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={`/login?next=${encodeURIComponent(`/listing/${id}/sheet`)}`} className="rounded-lg bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white">Iniciar sesion</Link>
              <button onClick={() => router.push(`/listing/${id}`)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-[#0B2545]">Volver al listado</button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!listing) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 px-4 py-16">
          <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-[#0B2545]">Ficha no disponible</h1>
            <p className="mt-3 text-sm text-gray-600">{error || 'No encontramos esta ficha MLS.'}</p>
            <button onClick={() => router.push(`/listing/${id}`)} className="mt-6 rounded-lg bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white">Volver al listado</button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <section className="rounded-2xl border border-[#0B2545]/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00A676]">MLS sheet</p>
                <h1 className="mt-2 text-2xl font-bold text-[#0B2545] sm:text-3xl">{listing.title || 'Ficha MLS'}</h1>
                <p className="mt-2 text-sm text-gray-600">
                  {[listing.city, listing.sector || listing.neighborhood, listing.location].filter(Boolean).join(' · ') || 'Ubicacion no especificada'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/listing/${id}`} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#0B2545]">Ver pagina publica</Link>
                <Link href={`/dashboard/listings/${id}/edit`} className="rounded-lg bg-[#0B2545] px-3 py-2 text-sm font-semibold text-white">Editar listado</Link>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <article className="rounded-xl border border-[#0B2545]/10 bg-[#F6FBFF] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Precio lista</p>
                <p className="mt-2 text-2xl font-bold text-[#0B2545]">{formatMoney(Number(listing.price || 0), listing.currency || 'USD')}</p>
              </article>
              <article className="rounded-xl border border-[#00A676]/20 bg-[#F0FBF6] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Precio / m2</p>
                <p className="mt-2 text-2xl font-bold text-[#0B2545]">{pricePerM2 > 0 ? `${formatMoney(pricePerM2, listing.currency || 'USD')}/m2` : 'N/D'}</p>
              </article>
              <article className="rounded-xl border border-[#FF6B35]/20 bg-[#FFF6F1] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Dias en mercado</p>
                <p className="mt-2 text-2xl font-bold text-[#0B2545]">{daysOnMarket}</p>
              </article>
              <article className="rounded-xl border border-[#CFE8FF] bg-[#F5FAFF] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Co-broke</p>
                <p className="mt-2 text-2xl font-bold text-[#0B2545]">{listing.commissionOffered ? `${listing.commissionOffered}%` : 'N/D'}</p>
              </article>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[1.25fr,0.95fr]">
            <section className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-[#0B2545]">Datos esenciales</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 text-sm text-gray-700">
                  <div><span className="font-semibold text-[#0B2545]">MLS ID:</span> {listing.listingId || listing.id}</div>
                  <div><span className="font-semibold text-[#0B2545]">Estado:</span> {listing.status || 'N/D'}</div>
                  <div><span className="font-semibold text-[#0B2545]">Operacion:</span> {listing.listingType || 'N/D'}</div>
                  <div><span className="font-semibold text-[#0B2545]">Tipo:</span> {listing.propertyType || 'N/D'}</div>
                  <div><span className="font-semibold text-[#0B2545]">Habitaciones:</span> {listing.bedrooms ?? 'N/D'}</div>
                  <div><span className="font-semibold text-[#0B2545]">Banos:</span> {listing.bathrooms ?? 'N/D'}</div>
                  <div><span className="font-semibold text-[#0B2545]">Area:</span> {listing.area ? `${listing.area} m2` : 'N/D'}</div>
                  <div><span className="font-semibold text-[#0B2545]">Mantenimiento:</span> {listing.maintenanceFee ? formatMoney(Number(listing.maintenanceFee), listing.maintenanceFeeCurrency || listing.currency || 'USD') : 'N/D'}</div>
                  <div><span className="font-semibold text-[#0B2545]">Deslinde:</span> {listing.deslindadoStatus || 'N/D'}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-[#0B2545]">Descripcion y remarks</h2>
                <div className="mt-4 space-y-4 text-sm text-gray-700">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Descripcion publica</p>
                    <p className="mt-1 whitespace-pre-line leading-6">{listing.description || listing.publicRemarks || 'Sin descripcion.'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notas internas</p>
                    <p className="mt-1 whitespace-pre-line leading-6">{listing.internalNotes || listing.professionalRemarks || 'Sin notas internas.'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Showing instructions</p>
                    <p className="mt-1 whitespace-pre-line leading-6">{listing.showingInstructions || 'No especificadas.'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-[#0B2545]">Amenidades y ventajas</h2>
                {featureList.length ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {featureList.map((feature: string) => (
                      <div key={feature} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">{feature}</div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">No se registraron amenidades en esta ficha.</p>
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-[#0B2545]">Contactos y representacion</h2>
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <div><span className="font-semibold text-[#0B2545]">Agente responsable:</span> {listing.responsibleAgent || listing.agentName || 'N/D'}</div>
                  <div><span className="font-semibold text-[#0B2545]">Broker:</span> {listing.responsibleBroker || listing.brokerName || 'N/D'}</div>
                  <div><span className="font-semibold text-[#0B2545]">Contacto privado:</span> {listing.privateContactName || 'N/D'}</div>
                  <div><span className="font-semibold text-[#0B2545]">Telefono:</span> {listing.privateContactPhone || 'N/D'}</div>
                  <div><span className="font-semibold text-[#0B2545]">Email:</span> {listing.privateContactEmail || listing.agentEmail || 'N/D'}</div>
                  <div><span className="font-semibold text-[#0B2545]">Representacion:</span> {listing.representation || 'N/D'}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-[#0B2545]">Tiempos y control</h2>
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <div><span className="font-semibold text-[#0B2545]">Creado:</span> {formatDate(listing.createdAt)}</div>
                  <div><span className="font-semibold text-[#0B2545]">Actualizado:</span> {formatDate(listing.updatedAt)}</div>
                  <div><span className="font-semibold text-[#0B2545]">Publicado:</span> {formatDate(listing.approvedAt || listing.submittedAt)}</div>
                  <div><span className="font-semibold text-[#0B2545]">Ciudad:</span> {listing.city || 'N/D'}</div>
                  <div><span className="font-semibold text-[#0B2545]">Sector:</span> {listing.sector || listing.neighborhood || 'N/D'}</div>
                  <div><span className="font-semibold text-[#0B2545]">MLS only:</span> {listing.mlsOnly ? 'Si' : 'No'}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#0B2545]/10 bg-[#F6FBFF] p-5 shadow-sm">
                <h2 className="text-lg font-bold text-[#0B2545]">Siguiente accion</h2>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  Usa esta ficha para preparar showing, validar comision, confirmar contacto y revisar notas antes de compartir la propiedad con comprador o colega.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Link href={`/listing/${id}`} className="rounded-lg bg-[#0B2545] px-4 py-2 text-center text-sm font-semibold text-white">Abrir vista publica</Link>
                  <Link href="/dashboard/listings" className="rounded-lg border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-[#0B2545]">Volver al workspace</Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}