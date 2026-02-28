'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import PropertyCard from '@/components/PropertyCard'
import {
  buildSearchUrl,
  getSavedPropertyIds,
  getSavedSearches,
  removeSavedSearch,
  type SavedSearchCriteria,
} from '@/lib/buyerPreferences'

type SessionData = {
  uid: string
  role: string
  name?: string
}

export default function BuyerDashboardPage() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([])
  const [savedSearches, setSavedSearches] = useState<SavedSearchCriteria[]>([])
  const [savedProperties, setSavedProperties] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.ok) {
          setSession(null)
          return
        }

        setSession(json.session || null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    if (!session) return
    const nextIds = getSavedPropertyIds()
    const nextSearches = getSavedSearches()
    setSavedPropertyIds(nextIds)
    setSavedSearches(nextSearches)
  }, [session])

  useEffect(() => {
    if (!savedPropertyIds.length) {
      setSavedProperties([])
      return
    }

    let active = true
    const loadProperties = async () => {
      const responses = await Promise.all(
        savedPropertyIds.map(async (id) => {
          const res = await fetch(`/api/properties/${encodeURIComponent(id)}`, { cache: 'no-store' })
          const json = await res.json().catch(() => ({}))
          if (!res.ok || !json?.ok || !json?.data) return null
          return json.data
        })
      )

      if (!active) return
      setSavedProperties(responses.filter(Boolean))
    }

    loadProperties()
    return () => {
      active = false
    }
  }, [savedPropertyIds])

  const displayName = session?.name || 'Comprador'
  const isBuyerRole = session?.role === 'buyer' || session?.role === 'user'

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-gray-600">Cargando tu panel...</div>
        </main>
        <Footer />
        <BottomNav />
      </>
    )
  }

  if (!session) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-md w-full text-center">
            <h1 className="text-xl font-semibold text-[#0B2545]">Inicia sesión para ver tu panel</h1>
            <p className="text-gray-600 text-sm mt-2">Guarda propiedades y tus criterios de búsqueda en un solo lugar.</p>
            <Link href="/login?redirect=/dashboard" className="mt-4 inline-flex px-4 py-2 rounded-lg bg-[#00A676] text-white font-medium">
              Ir a iniciar sesión
            </Link>
          </div>
        </main>
        <Footer />
        <BottomNav />
      </>
    )
  }

  if (!isBuyerRole) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-md w-full text-center">
            <h1 className="text-xl font-semibold text-[#0B2545]">Este panel es para compradores</h1>
            <p className="text-gray-600 text-sm mt-2">Tu cuenta profesional usa el panel maestro.</p>
            <Link href="/master" className="mt-4 inline-flex px-4 py-2 rounded-lg bg-[#0B2545] text-white font-medium">
              Ir al panel maestro
            </Link>
          </div>
        </main>
        <Footer />
        <BottomNav />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Hola, {displayName}</h1>
            <p className="text-sm text-gray-600 mt-1">Tu panel para guardar propiedades y seguir tus búsquedas.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                <div className="text-xs text-gray-500">Propiedades guardadas</div>
                <div className="text-lg font-bold text-[#0B2545]">{savedPropertyIds.length}</div>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                <div className="text-xs text-gray-500">Búsquedas guardadas</div>
                <div className="text-lg font-bold text-[#0B2545]">{savedSearches.length}</div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-lg font-semibold text-[#0B2545]">Búsquedas guardadas</h2>
              <Link href="/search" className="text-sm text-[#00A676] font-medium">Nueva búsqueda</Link>
            </div>
            {savedSearches.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no tienes búsquedas guardadas. Desde buscar propiedades puedes guardar tus criterios.</p>
            ) : (
              <div className="space-y-2">
                {savedSearches.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#0B2545] truncate">{item.name}</div>
                      <div className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={buildSearchUrl(item)} className="text-xs px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50">
                        Abrir
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSavedSearches(removeSavedSearch(item.id))}
                        className="text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-lg font-semibold text-[#0B2545]">Propiedades guardadas</h2>
              <Link href="/search" className="text-sm text-[#00A676] font-medium">Explorar más</Link>
            </div>
            {savedProperties.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm text-gray-500">
                Guarda propiedades desde las tarjetas en búsqueda para verlas aquí.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {savedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
