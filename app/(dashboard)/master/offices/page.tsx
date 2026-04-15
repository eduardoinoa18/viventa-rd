'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type OfficeRow = {
  id: string
  name: string
  officeCode?: string
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
  }
}

export default function MasterOfficesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [offices, setOffices] = useState<OfficeRow[]>([])
  const [search, setSearch] = useState('')

  const [name, setName] = useState('')
  const [brokerageName, setBrokerageName] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [plan, setPlan] = useState<'basic' | 'pro' | 'enterprise'>('basic')

  async function loadOffices(nextSearch = '') {
    try {
      setLoading(true)
      setError('')
      const qs = new URLSearchParams({ limit: '120' })
      if (nextSearch.trim()) qs.set('search', nextSearch.trim())
      const res = await fetch(`/api/admin/offices?${qs.toString()}`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudieron cargar oficinas')
      setOffices(Array.isArray(json?.offices) ? json.offices : [])
    } catch (loadError: any) {
      setError(loadError?.message || 'No se pudieron cargar oficinas')
      setOffices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOffices('')
  }, [])

  async function createOffice() {
    if (!name.trim()) {
      setError('El nombre de la oficina es requerido.')
      return
    }

    try {
      setSaving(true)
      setError('')
      const res = await fetch('/api/admin/offices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          brokerageName,
          city,
          province,
          subscription: {
            plan,
            status: 'active',
            agentsLimit: plan === 'basic' ? 25 : plan === 'pro' ? 100 : 300,
            listingsLimit: plan === 'basic' ? 250 : plan === 'pro' ? 1200 : 5000,
            seatsUsed: 0,
          },
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo crear oficina')

      setName('')
      setBrokerageName('')
      setCity('')
      setProvince('')
      setPlan('basic')
      await loadOffices(search)
    } catch (createError: any) {
      setError(createError?.message || 'No se pudo crear oficina')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545]">Registro de Oficinas</h1>
          <p className="text-sm text-gray-600 mt-1">Motor de oficinas con suscripción independiente por oficina.</p>
        </div>
        <Link href="/master" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Volver al dashboard</Link>
      </div>

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-[#0B2545] mb-3">Crear oficina</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre oficina" title="Nombre oficina" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          <input value={brokerageName} onChange={(e) => setBrokerageName(e.target.value)} placeholder="Brokerage" title="Brokerage" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          <select value={plan} onChange={(e) => setPlan(e.target.value as 'basic' | 'pro' | 'enterprise')} title="Plan" className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ciudad" title="Ciudad" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          <input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Provincia" title="Provincia" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          <button type="button" onClick={createOffice} disabled={saving} className="px-3 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-medium disabled:opacity-50">
            {saving ? 'Creando...' : 'Crear oficina'}
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-[#0B2545]">Oficinas</h2>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar oficina..."
              title="Buscar oficina"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <button type="button" onClick={() => loadOffices(search)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Buscar</button>
          </div>
        </div>

        {loading ? <p className="text-sm text-gray-500">Cargando oficinas...</p> : null}
        {!loading && offices.length === 0 ? <p className="text-sm text-gray-500">No hay oficinas registradas.</p> : null}

        <div className="space-y-2">
          {offices.map((office) => (
            <Link key={office.id} href={`/master/offices/${office.id}`} className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#0B2545]">{office.name || 'Oficina'}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {office.brokerageName || 'Sin brokerage'} • {office.city || '—'}{office.province ? `, ${office.province}` : ''}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-600">
                  <div>{office.subscription?.plan || 'basic'} • {office.subscription?.status || 'active'}</div>
                  <div>Agents: {Number(office.subscription?.seatsUsed || 0)} / {Number(office.subscription?.agentsLimit || 0)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
