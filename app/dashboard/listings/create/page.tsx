'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { uploadMultipleImages, validateImageFiles } from '@/lib/storageService'
import { mapOfficeQuotaError } from '@/lib/quotaUiMessages'

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
  parking: string
  maintenanceFee: string
  address: string
  lat: string
  lng: string
  coverImage: string
  promoVideoUrl: string
  imagesText: string
  status: 'active' | 'pending'
}

export default function CreateProfessionalListingPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
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
    parking: '0',
    maintenanceFee: '',
    address: '',
    lat: '',
    lng: '',
    coverImage: '',
    promoVideoUrl: '',
    imagesText: '',
    status: 'active',
  })

  function update<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function onFileSelect(files: FileList | null) {
    const incoming = Array.from(files || [])
    if (!incoming.length) return
    const total = uploadedImages.length + incoming.length
    if (total > 20) {
      setError('Máximo 20 imágenes por listado.')
      return
    }
    const validation = validateImageFiles(incoming)
    if (!validation.valid) {
      setError(validation.errors[0] || 'Archivos inválidos')
      return
    }
    setSelectedFiles(incoming)
    setError('')
  }

  async function uploadSelectedFiles() {
    if (!selectedFiles.length) {
      setError('Selecciona imágenes antes de subir.')
      return
    }

    try {
      setUploading(true)
      setError('')
      const folder = `listing_images/pro_${Date.now()}`
      const urls = await uploadMultipleImages(selectedFiles, folder)
      setUploadedImages((prev) => [...prev, ...urls])
      setSelectedFiles([])
      if (!form.coverImage && urls[0]) {
        setForm((prev) => ({ ...prev, coverImage: urls[0] }))
      }
    } catch (uploadError: any) {
      setError(uploadError?.message || 'No se pudieron subir las imágenes')
    } finally {
      setUploading(false)
    }
  }

  function removeUploadedImage(url: string) {
    setUploadedImages((prev) => prev.filter((item) => item !== url))
    if (form.coverImage === url) {
      setForm((prev) => ({ ...prev, coverImage: '' }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.title || !form.description || !form.price || !form.city || !form.neighborhood) {
      setError('Completa título, descripción, precio, ciudad y sector.')
      return
    }

    if ((form.lat && !form.lng) || (!form.lat && form.lng)) {
      setError('Si completas coordenadas, incluye latitud y longitud.')
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
          status: form.status,
          bedrooms: Number(form.bedrooms || 0),
          bathrooms: Number(form.bathrooms || 0),
          area: Number(form.area || 0),
          parking: Number(form.parking || 0),
          maintenanceFee: form.maintenanceFee ? Number(form.maintenanceFee) : undefined,
          maintenanceFeeCurrency: form.currency,
          address: form.address || form.location || undefined,
          lat: form.lat ? Number(form.lat) : undefined,
          lng: form.lng ? Number(form.lng) : undefined,
          coverImage: form.coverImage || undefined,
          promoVideoUrl: form.promoVideoUrl || undefined,
          images: [
            ...uploadedImages,
            ...form.imagesText
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
          ],
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) {
        throw new Error(
          mapOfficeQuotaError(json || {}, {
            context: 'listing',
            fallbackMessage: 'No se pudo crear el listado',
          })
        )
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
                <input title="Título del listado" placeholder="Ej: Apartamento moderno en Naco" value={form.title} onChange={(e) => update('title', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Descripción</label>
                <textarea title="Descripción del listado" placeholder="Describe detalles clave, amenidades y beneficios" value={form.description} onChange={(e) => update('description', e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Precio</label>
                <input title="Precio" placeholder="250000" value={form.price} onChange={(e) => update('price', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Moneda</label>
                <select title="Moneda" value={form.currency} onChange={(e) => update('currency', e.target.value as 'USD' | 'DOP')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="USD">USD</option>
                  <option value="DOP">DOP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Ciudad</label>
                <input title="Ciudad" placeholder="Santo Domingo" value={form.city} onChange={(e) => update('city', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Sector</label>
                <input title="Sector" placeholder="Naco" value={form.neighborhood} onChange={(e) => update('neighborhood', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Ubicación textual</label>
                <input title="Ubicación textual" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Ej: Naco, Santo Domingo" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Tipo de propiedad</label>
                <select title="Tipo de propiedad" value={form.propertyType} onChange={(e) => update('propertyType', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="apartment">Apartamento</option>
                  <option value="house">Casa</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="villa">Villa</option>
                  <option value="office">Oficina</option>
                  <option value="commercial">Comercial</option>
                  <option value="land">Solar/Terreno</option>
                  <option value="project">Proyecto</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Operación</label>
                <select title="Tipo de operación" value={form.listingType} onChange={(e) => update('listingType', e.target.value as 'sale' | 'rent')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="sale">Venta</option>
                  <option value="rent">Alquiler</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Habitaciones</label>
                <input title="Habitaciones" placeholder="3" value={form.bedrooms} onChange={(e) => update('bedrooms', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Baños</label>
                <input title="Baños" placeholder="2" value={form.bathrooms} onChange={(e) => update('bathrooms', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Área (m²)</label>
                <input title="Área en metros cuadrados" placeholder="120" value={form.area} onChange={(e) => update('area', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Parqueos</label>
                <input title="Cantidad de parqueos" placeholder="2" value={form.parking} onChange={(e) => update('parking', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Estado inicial</label>
                <select title="Estado inicial del listado" value={form.status} onChange={(e) => update('status', e.target.value as 'active' | 'pending')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="active">Activo</option>
                  <option value="pending">Pendiente</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Mantenimiento ({form.currency})</label>
                <input title="Costo de mantenimiento" placeholder="150" value={form.maintenanceFee} onChange={(e) => update('maintenanceFee', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Dirección</label>
                <input title="Dirección" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Dirección exacta (opcional)" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Latitud</label>
                <input title="Latitud" value={form.lat} onChange={(e) => update('lat', e.target.value)} inputMode="decimal" placeholder="18.4861" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Longitud</label>
                <input title="Longitud" value={form.lng} onChange={(e) => update('lng', e.target.value)} inputMode="decimal" placeholder="-69.9312" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">URL imagen principal</label>
                <input title="Imagen principal" value={form.coverImage} onChange={(e) => update('coverImage', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div className="sm:col-span-2 rounded-lg border border-gray-200 p-3 bg-gray-50">
                <label className="block text-xs text-gray-600 mb-2">Subir imágenes (recomendado)</label>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    title="Seleccionar imágenes"
                    onChange={(e) => onFileSelect(e.target.files)}
                    className="text-xs"
                  />
                  <button
                    type="button"
                    onClick={uploadSelectedFiles}
                    disabled={uploading}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545] disabled:opacity-50"
                  >
                    {uploading ? 'Subiendo...' : 'Subir seleccionadas'}
                  </button>
                </div>

                {uploadedImages.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    {uploadedImages.map((url) => (
                      <div key={url} className="flex items-center justify-between text-xs bg-white border border-gray-200 rounded px-2 py-1 gap-2">
                        <span className="truncate flex-1">{url}</span>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => update('coverImage', url)} className="text-[#0B2545] underline">Principal</button>
                          <button type="button" onClick={() => removeUploadedImage(url)} className="text-red-600 underline">Quitar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">URLs de imágenes (separadas por coma)</label>
                <textarea title="Galería de imágenes" value={form.imagesText} onChange={(e) => update('imagesText', e.target.value)} rows={3} placeholder="https://img1..., https://img2..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Video promocional (YouTube/Vimeo)</label>
                <input title="Video promocional" value={form.promoVideoUrl} onChange={(e) => update('promoVideoUrl', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
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
