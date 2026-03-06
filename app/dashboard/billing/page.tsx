'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'

type SessionData = {
  uid: string
  role: string
  email?: string
  name?: string
}

type BillingPlan = 'agent' | 'broker'

export default function DashboardBillingPage() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')

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

  const isAllowedRole = useMemo(() => {
    const role = String(session?.role || '')
    return ['agent', 'broker', 'constructora', 'admin', 'master_admin'].includes(role)
  }, [session?.role])

  const planForRole: BillingPlan = session?.role === 'broker' || session?.role === 'constructora' || session?.role === 'admin' || session?.role === 'master_admin'
    ? 'broker'
    : 'agent'

  async function startCheckout(plan: BillingPlan) {
    try {
      setCheckoutLoading(true)
      setError('')

      const res = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          email: session?.email,
          metadata: {
            role: session?.role || 'unknown',
            source: 'dashboard_billing',
            uid: session?.uid || '',
          },
          successUrl: `${window.location.origin}/dashboard/billing?payment=success`,
          cancelUrl: `${window.location.origin}/dashboard/billing?payment=canceled`,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.url) {
        throw new Error(json?.error || 'No se pudo iniciar el checkout')
      }

      window.location.href = json.url
    } catch (checkoutError: any) {
      setError(checkoutError?.message || 'No se pudo iniciar el checkout')
    } finally {
      setCheckoutLoading(false)
    }
  }

  async function openCustomerPortal() {
    try {
      setPortalLoading(true)
      setError('')

      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard/billing`,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.url) {
        throw new Error(json?.error || 'No se pudo abrir el portal de facturación')
      }

      window.location.href = json.url
    } catch (portalError: any) {
      setError(portalError?.message || 'No se pudo abrir el portal de facturación')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Facturación y suscripción</h1>
                <p className="text-sm text-gray-600 mt-1">Gestiona tu plan, método de pago y promociones de listados.</p>
              </div>
              <Link href="/dashboard" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">
                Volver al dashboard
              </Link>
            </div>
          </section>

          {loading ? (
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm text-gray-600">Cargando facturación...</section>
          ) : !session ? (
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm text-gray-700">
              Debes iniciar sesión para gestionar tu facturación.{' '}
              <Link href="/login?redirect=/dashboard/billing" className="text-[#00A676] font-medium">Iniciar sesión</Link>.
            </section>
          ) : !isAllowedRole ? (
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm text-gray-700">
              Esta sección está disponible para profesionales y administradores.
            </section>
          ) : (
            <>
              <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-3">
                <h2 className="text-lg font-semibold text-[#0B2545]">Plan recomendado</h2>
                <p className="text-sm text-gray-600">
                  Tu rol actual es <span className="font-semibold text-[#0B2545]">{session.role}</span>. Plan sugerido: <span className="font-semibold text-[#0B2545]">{planForRole === 'broker' ? 'Broker' : 'Agent'}</span>.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={checkoutLoading}
                    onClick={() => startCheckout(planForRole)}
                    className="px-4 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-medium disabled:opacity-60"
                  >
                    {checkoutLoading ? 'Abriendo checkout...' : 'Suscribirme / Actualizar plan'}
                  </button>
                  <button
                    type="button"
                    disabled={portalLoading}
                    onClick={openCustomerPortal}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545] disabled:opacity-60"
                  >
                    {portalLoading ? 'Abriendo portal...' : 'Administrar método de pago'}
                  </button>
                </div>
              </section>

              <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
                <h2 className="text-lg font-semibold text-[#0B2545] mb-2">Promocionar listados (Ads)</h2>
                <p className="text-sm text-gray-600">
                  Próximamente podrás impulsar tus listados por audiencia, presupuesto y duración desde este panel con atribución comercial completa para Master Admin y profesionales.
                </p>
              </section>

              {error ? <section className="bg-white rounded-xl border border-red-200 shadow-sm p-4 text-sm text-red-700">{error}</section> : null}
            </>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
