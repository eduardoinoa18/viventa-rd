'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type OfficeDetails = {
  id: string
  name: string
  slug?: string
  officeCode?: string
  brokerageId?: string
  brokerageName?: string
  city?: string
  province?: string
  status?: string
  subscription?: {
    plan?: string
    status?: string
    agentsLimit?: number
    listingsLimit?: number
    seatsUsed?: number
    currentPeriodEnd?: string | null
  }
}

export default function MasterOfficeDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [office, setOffice] = useState<OfficeDetails | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`/api/admin/offices/${encodeURIComponent(params.id)}`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok || !json?.office) throw new Error(json?.error || 'No se pudo cargar oficina')
      setOffice(json.office)
    } catch (loadError: any) {
      setError(loadError?.message || 'No se pudo cargar oficina')
      setOffice(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [params.id])

  async function save() {
    if (!office) return
    try {
      setSaving(true)
      setStatus('')
      setError('')

      const res = await fetch(`/api/admin/offices/${encodeURIComponent(params.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(office),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo guardar oficina')
      setStatus('Oficina actualizada correctamente.')
      await load()
    } catch (saveError: any) {
      setError(saveError?.message || 'No se pudo guardar oficina')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545]">Office Details</h1>
          <p className="text-sm text-gray-600 mt-1">Configuración operativa y suscripción por oficina.</p>
        </div>
        <Link href="/master/offices" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Volver a oficinas</Link>
      </div>

      {loading ? <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm text-gray-500">Cargando oficina...</section> : null}
      {error ? <section className="bg-white rounded-xl border border-red-200 shadow-sm p-4 text-sm text-red-700">{error}</section> : null}

      {office ? (
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input value={office.name || ''} onChange={(e) => setOffice((prev) => (prev ? { ...prev, name: e.target.value } : prev))} title="Nombre de oficina" placeholder="Nombre de oficina" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input value={office.officeCode || ''} onChange={(e) => setOffice((prev) => (prev ? { ...prev, officeCode: e.target.value } : prev))} title="Código de oficina" placeholder="Código de oficina" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input value={office.brokerageName || ''} onChange={(e) => setOffice((prev) => (prev ? { ...prev, brokerageName: e.target.value } : prev))} title="Brokerage" placeholder="Brokerage" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <select value={office.status || 'active'} onChange={(e) => setOffice((prev) => (prev ? { ...prev, status: e.target.value } : prev))} title="Estado de oficina" className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="active">active</option>
              <option value="suspended">suspended</option>
              <option value="pending">pending</option>
            </select>
            <input value={office.city || ''} onChange={(e) => setOffice((prev) => (prev ? { ...prev, city: e.target.value } : prev))} title="Ciudad" placeholder="Ciudad" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input value={office.province || ''} onChange={(e) => setOffice((prev) => (prev ? { ...prev, province: e.target.value } : prev))} title="Provincia" placeholder="Provincia" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <h2 className="text-sm font-semibold text-[#0B2545] mb-2">Subscription</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={office.subscription?.plan || 'basic'}
                onChange={(e) => setOffice((prev) => prev ? { ...prev, subscription: { ...(prev.subscription || {}), plan: e.target.value } } : prev)}
                title="Plan"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="basic">basic</option>
                <option value="pro">pro</option>
                <option value="enterprise">enterprise</option>
              </select>
              <select
                value={office.subscription?.status || 'active'}
                onChange={(e) => setOffice((prev) => prev ? { ...prev, subscription: { ...(prev.subscription || {}), status: e.target.value } } : prev)}
                title="Estado de suscripción"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="active">active</option>
                <option value="past_due">past_due</option>
                <option value="paused">paused</option>
                <option value="canceled">canceled</option>
              </select>
              <input
                type="datetime-local"
                value={office.subscription?.currentPeriodEnd ? new Date(new Date(office.subscription.currentPeriodEnd).getTime() - new Date(office.subscription.currentPeriodEnd).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                onChange={(e) => setOffice((prev) => prev ? { ...prev, subscription: { ...(prev.subscription || {}), currentPeriodEnd: e.target.value ? new Date(e.target.value).toISOString() : null } } : prev)}
                title="Fin de periodo"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <input
                type="number"
                value={Number(office.subscription?.agentsLimit || 0)}
                onChange={(e) => setOffice((prev) => prev ? { ...prev, subscription: { ...(prev.subscription || {}), agentsLimit: Number(e.target.value || 0) } } : prev)}
                title="Límite de agentes"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <input
                type="number"
                value={Number(office.subscription?.listingsLimit || 0)}
                onChange={(e) => setOffice((prev) => prev ? { ...prev, subscription: { ...(prev.subscription || {}), listingsLimit: Number(e.target.value || 0) } } : prev)}
                title="Límite de listados"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <input
                type="number"
                value={Number(office.subscription?.seatsUsed || 0)}
                onChange={(e) => setOffice((prev) => prev ? { ...prev, subscription: { ...(prev.subscription || {}), seatsUsed: Number(e.target.value || 0) } } : prev)}
                title="Seats usados"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-medium disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
            {status ? <span className="text-sm text-gray-600">{status}</span> : null}
          </div>
        </section>
      ) : null}
    </div>
  )
}
