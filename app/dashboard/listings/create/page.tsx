'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type CreateForm = {
  title: string
  description: string
  price: string
  currency: 'USD' | 'DOP'
  city: string
  neighborhood: string
  location: string
  propertyType: string
  listingType: 'sale' | 'rent'
  bedrooms: string
  bathrooms: string
  area: string
}

export default function CreateProfessionalListingPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CreateForm>({
    title: '',
    description: '',
    price: '',
    currency: 'USD',
    city: '',
    neighborhood: '',
    location: '',
    propertyType: 'apartment',
    listingType: 'sale',
    bedrooms: '1',
    bathrooms: '1',
    area: '',
  })

  function update<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.title || !form.description || !form.price || !form.city || !form.neighborhood) {
      setError('Completa título, descripción, precio, ciudad y sector.')
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          title: form.title,
          description: form.description,
          price: Number(form.price),
          currency: form.currency,
          city: form.city,
          neighborhood: form.neighborhood,
          location: form.location || `${form.neighborhood}, ${form.city}`,
          propertyType: form.propertyType,
          listingType: form.listingType,
          status: 'active',
          bedrooms: Number(form.bedrooms || 0),
          bathrooms: Number(form.bathrooms || 0),
          area: Number(form.area || 0),
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'No se pudo crear el listado')
      }

      router.push(`/listing/${json.id}`)
    } catch (submitError: any) {
      setError(submitError?.message || 'No se pudo crear el listado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Crear listado</h1>
              <p className="text-sm text-gray-600 mt-1">Publica una propiedad en tu cartera profesional.</p>
            </div>
            <Link href="/dashboard/listings" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Ver mis listados</Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Título</label>
                <input value={form.title} onChange={(e) => update('title', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Descripción</label>
                <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Precio</label>
                <input value={form.price} onChange={(e) => update('price', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Moneda</label>
                <select value={form.currency} onChange={(e) => update('currency', e.target.value as 'USD' | 'DOP')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="USD">USD</option>
                  <option value="DOP">DOP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Ciudad</label>
                <input value={form.city} onChange={(e) => update('city', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Sector</label>
                <input value={form.neighborhood} onChange={(e) => update('neighborhood', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Ubicación textual</label>
                <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Ej: Naco, Santo Domingo" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Tipo de propiedad</label>
                <input value={form.propertyType} onChange={(e) => update('propertyType', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Operación</label>
                <select value={form.listingType} onChange={(e) => update('listingType', e.target.value as 'sale' | 'rent')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="sale">Venta</option>
                  <option value="rent">Alquiler</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Habitaciones</label>
                <input value={form.bedrooms} onChange={(e) => update('bedrooms', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Baños</label>
                <input value={form.bathrooms} onChange={(e) => update('bathrooms', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Área (m²)</label>
                <input value={form.area} onChange={(e) => update('area', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex items-center gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-medium disabled:opacity-50">
                {saving ? 'Guardando...' : 'Publicar listado'}
              </button>
              <Link href="/dashboard/listings" className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Cancelar</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
