'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { getSession } from '@/lib/authSession'
import { FiArrowLeft, FiSave } from 'react-icons/fi'

interface FormState {
  title: string
  description: string
  price: string
  currency: 'USD' | 'DOP'
  city: string
  neighborhood: string
  address: string
  bedrooms: string
  bathrooms: string
  area: string
  listingType: 'sale' | 'rent'
  propertyType: string
  status: 'active' | 'pending' | 'inactive' | 'sold'
  featured: boolean
}

const defaultForm: FormState = {
  title: '',
  description: '',
  price: '',
  currency: 'USD',
  city: '',
  neighborhood: '',
  address: '',
  bedrooms: '0',
  bathrooms: '0',
  area: '0',
  listingType: 'sale',
  propertyType: 'apartment',
  status: 'active',
  featured: false,
}

type LocationState = {
  city?: string
  neighborhood?: string
  address?: string
  latitude?: number | null
  longitude?: number | null
}

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params?.id as string | undefined

  const [form, setForm] = useState<FormState>(defaultForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingLocation, setExistingLocation] = useState<LocationState>({})
  const [existingImages, setExistingImages] = useState<string[]>([])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId])

  async function load() {
    if (!listingId) return
    const session = getSession()
    if (!session || session.role !== 'agent') {
      router.push('/agent/login')
      return
    }

    try {
      const res = await fetch(`/api/properties/${listingId}`)
      const data = await res.json()
      if (!data.ok) {
        toast.error(data.error || 'No se pudo cargar la propiedad')
        router.push('/agent/listings')
        return
      }

      const listing = data.data
      setForm({
        title: listing.title || '',
        description: listing.description || '',
        price: typeof listing.price === 'number' ? String(listing.price) : listing.price || '',
        currency: listing.currency === 'DOP' ? 'DOP' : 'USD',
        city: listing.city || listing.location?.city || '',
        neighborhood: listing.neighborhood || listing.location?.neighborhood || '',
        address: listing.address || listing.location?.address || '',
        bedrooms: listing.bedrooms != null ? String(listing.bedrooms) : '0',
        bathrooms: listing.bathrooms != null ? String(listing.bathrooms) : '0',
        area: listing.area != null ? String(listing.area) : '0',
        listingType: listing.listingType === 'rent' ? 'rent' : 'sale',
        propertyType: listing.propertyType || 'apartment',
        status: listing.status || 'active',
        featured: !!listing.featured,
      })
      setExistingLocation(listing.location || {})
      setExistingImages(listing.images || [])
    } catch (err) {
      console.error('Failed to load listing', err)
      toast.error('Error al cargar la propiedad')
      router.push('/agent/listings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!listingId) return
    const session = getSession()
    if (!session || session.role !== 'agent') {
      toast.error('Debes iniciar sesión como agente')
      router.push('/agent/login')
      return
    }

    setSaving(true)
    try {
      const payload = {
        action: 'update',
        id: listingId,
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        currency: form.currency,
        city: form.city.trim(),
        neighborhood: form.neighborhood.trim(),
        address: form.address.trim(),
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        area: Number(form.area) || 0,
        listingType: form.listingType,
        propertyType: form.propertyType,
        status: form.status,
        featured: form.featured,
        location: {
          ...existingLocation,
          city: form.city.trim(),
          neighborhood: form.neighborhood.trim(),
          address: form.address.trim(),
        },
        images: existingImages,
        mainImage: existingImages[0] || null,
        agentId: session.uid,
        agentName: session.name || session.displayName || session.email,
        agentEmail: session.email,
      }

      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (!result.success) {
        throw new Error(result.error || 'No se pudo actualizar la propiedad')
      }
      toast.success('Propiedad actualizada')
      router.push('/agent/listings')
    } catch (err: any) {
      console.error('Update listing error', err)
      toast.error(err.message || 'Error al actualizar la propiedad')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A6A6] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando propiedad...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-[#00A676] mb-6"
        >
          <FiArrowLeft /> Volver
        </button>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#0B2545]">Editar Propiedad</h1>
              <p className="text-gray-600">Actualiza la información clave para que aparezca en búsqueda.</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-60"
            >
              <FiSave /> {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">Título *</label>
                <input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">Precio *</label>
                <div className="flex gap-2">
                  <select
                    id="currency"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value as FormState['currency'] })}
                    aria-label="Moneda"
                    className="px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="DOP">DOP</option>
                  </select>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                required
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">Ciudad *</label>
                <input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="neighborhood" className="block text-sm font-semibold text-gray-700 mb-2">Sector/Barrio *</label>
                <input
                  id="neighborhood"
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">Dirección</label>
                <input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-semibold text-gray-700 mb-2">Habitaciones</label>
                <input
                  id="bedrooms"
                  type="number"
                  min="0"
                  value={form.bedrooms}
                  onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="bathrooms" className="block text-sm font-semibold text-gray-700 mb-2">Baños</label>
                <input
                  id="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.bathrooms}
                  onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="area" className="block text-sm font-semibold text-gray-700 mb-2">Área (m²)</label>
                <input
                  id="area"
                  type="number"
                  min="0"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="propertyType" className="block text-sm font-semibold text-gray-700 mb-2">Tipo de propiedad</label>
                <select
                  id="propertyType"
                  value={form.propertyType}
                  onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                >
                  <option value="apartment">Apartamento</option>
                  <option value="house">Casa</option>
                  <option value="condo">Condominio</option>
                  <option value="villa">Villa</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="land">Terreno</option>
                  <option value="commercial">Comercial</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="listingType" className="block text-sm font-semibold text-gray-700 mb-2">Tipo de transacción</label>
                <select
                  id="listingType"
                  value={form.listingType}
                  onChange={(e) => setForm({ ...form, listingType: e.target.value as FormState['listingType'] })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                >
                  <option value="sale">Venta</option>
                  <option value="rent">Alquiler</option>
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as FormState['status'] })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                >
                  <option value="active">Activa</option>
                  <option value="pending">Pendiente</option>
                  <option value="inactive">Inactiva</option>
                  <option value="sold">Vendida</option>
                </select>
              </div>
              <label htmlFor="featured" className="flex items-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 font-medium text-gray-700 cursor-pointer">
                <input
                  id="featured"
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="h-4 w-4 text-[#00A676] focus:ring-[#00A676]"
                />
                Marcar como destacada
              </label>
            </div>

            {existingImages.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Imágenes actuales</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {existingImages.map((src) => (
                    <div key={src} className="aspect-video rounded-lg overflow-hidden border">
                      <img src={src} alt="Imagen de la propiedad" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008c5c] transition-colors disabled:opacity-60"
              >
                <FiSave /> {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
