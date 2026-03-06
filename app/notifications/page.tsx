'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import NotificationCenter from '@/components/NotificationCenter'

type SessionData = {
  uid: string
  role: string
  name?: string
}

export default function NotificationsPage() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!active) return
        if (!res.ok || !json?.ok || !json?.session) {
          setSession(null)
          return
        }
        setSession(json.session)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Centro de notificaciones</h1>
                <p className="text-sm text-gray-600 mt-1">Mantente al día con actividad, alertas y seguimiento comercial.</p>
              </div>
              <Link href="/dashboard" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">
                Volver al dashboard
              </Link>
            </div>
          </section>

          {loading ? (
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm text-gray-600">
              Cargando notificaciones...
            </section>
          ) : session?.uid ? (
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 sm:p-3">
              <div className="flex justify-end px-2 pt-2">
                <NotificationCenter userId={session.uid} />
              </div>
              <p className="text-xs text-gray-500 px-3 pb-3">Tip: abre la campana para filtrar por no leídas y marcarlas rápidamente.</p>
            </section>
          ) : (
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm text-gray-700">
              Debes iniciar sesión para acceder a tus notificaciones.{' '}
              <Link href="/login?redirect=/notifications" className="text-[#00A676] font-medium">
                Iniciar sesión
              </Link>
              .
            </section>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
