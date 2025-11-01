// app/admin/properties/create/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ProtectedClient from '../../../auth/ProtectedClient'
import AdminSidebar from '../../../../components/AdminSidebar'
import AdminTopbar from '../../../../components/AdminTopbar'
import { createProperty, type Property } from '../../../../lib/firestoreService'
import { FiImage, FiMapPin, FiDollarSign, FiHome, FiFileText, FiEye, FiLock } from 'react-icons/fi'

export default function CreatePropertyPage() {
  const router = useRouter()
  const [form, setForm] = useState<Partial<Property>>({
    title: '',
    description: '',
    publicRemarks: '',
    professionalRemarks: '',
    price: 0,
    location: '',
    city: '',
    neighborhood: '',
    bedrooms: 1,
    bathrooms: 1,
    area: 0,
    propertyType: 'apartment',
    listingType: 'sale',
    images: [],
    agentId: '',
    agentName: '',
    status: 'pending',
    featured: false,
  })
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)

  function addImage() {
    if (!imageUrl.trim()) {
      toast.error('Por favor ingresa una URL válida')
      return
    }
    setForm({ ...form, images: [...(form.images || []), imageUrl.trim()] })
    setImageUrl('')
    toast.success('Imagen agregada')
  }

  function removeImage(index: number) {
    const newImages = [...(form.images || [])]
    newImages.splice(index, 1)
    setForm({ ...form, images: newImages })
    toast.success('Imagen eliminada')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validation
    if (!form.title?.trim()) {
      toast.error('El título es requerido')
      return
    }
    if (!form.location?.trim()) {
      toast.error('La ubicación es requerida')
      return
    }
    if (!form.price || form.price <= 0) {
      toast.error('El precio debe ser mayor a 0')
      return
    }
    if (!form.publicRemarks?.trim() || form.publicRemarks.length < 50) {
      toast.error('Las notas públicas deben tener al menos 50 caracteres')
      return
    }
    if (!form.images || form.images.length === 0) {
      toast.error('Debes agregar al menos una imagen')
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description?.trim() || form.publicRemarks?.trim() || '', // Fallback for compatibility
        publicRemarks: form.publicRemarks?.trim() || '',
        professionalRemarks: form.professionalRemarks?.trim() || '',
        price: Number(form.price),
        location: form.location.trim(),
        city: form.city?.trim() || '',
        neighborhood: form.neighborhood?.trim() || '',
        bedrooms: Number(form.bedrooms || 0),
        bathrooms: Number(form.bathrooms || 0),
        area: Number(form.area || 0),
        propertyType: form.propertyType,
        listingType: form.listingType,
        images: form.images,
        agentId: form.agentId?.trim() || '',
        agentName: form.agentName?.trim() || '',
        status: form.status,
        featured: Boolean(form.featured),
      }
      
      await createProperty(payload)
      toast.success('¡Propiedad creada exitosamente!')
      
      // Reset form
      setForm({
        title: '', description: '', publicRemarks: '', professionalRemarks: '',
        price: 0, location: '', city: '', neighborhood: '',
        bedrooms: 1, bathrooms: 1, area: 0,
        propertyType: 'apartment', listingType: 'sale', images: [],
        agentId: '', agentName: '', status: 'pending', featured: false,
      })
      
      // Redirect to properties list after 1 second
      setTimeout(() => router.push('/admin/properties'), 1000)
    } catch (e: any) {
      console.error('Failed to create listing:', e)
      toast.error(e?.message || 'Error al crear la propiedad')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50 min-h-screen">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#0B2545]">Crear Propiedad</h1>
              <p className="text-gray-600 mt-1">Complete todos los campos para publicar una nueva propiedad</p>
            </div>

            <form onSubmit={submit} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4 flex items-center gap-2">
                  <FiHome className="text-[#00A676]" />
                  Información Básica
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título de la Propiedad *
                    </label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      placeholder="Ej: Hermoso Apartamento en Piantini"
                      value={form.title || ''}
                      onChange={e=>setForm({...form, title: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <FiDollarSign className="text-gray-400" />
                      Precio (USD) *
                    </label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      type="number"
                      placeholder="250000"
                      value={form.price || ''}
                      onChange={e=>setForm({...form, price: Number(e.target.value)})}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Área (m²) *
                    </label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      type="number"
                      placeholder="120"
                      value={form.area || ''}
                      onChange={e=>setForm({...form, area: Number(e.target.value)})}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Habitaciones *</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      type="number"
                      min="0"
                      value={form.bedrooms || ''}
                      onChange={e=>setForm({...form, bedrooms: Number(e.target.value)})}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Baños *</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      type="number"
                      min="0"
                      step="0.5"
                      value={form.bathrooms || ''}
                      onChange={e=>setForm({...form, bathrooms: Number(e.target.value)})}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Propiedad *</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      value={form.propertyType || ''}
                      onChange={e=>setForm({...form, propertyType: e.target.value as any})}
                      required
                    >
                      <option value="apartment">Apartamento</option>
                      <option value="house">Casa</option>
                      <option value="condo">Condominio</option>
                      <option value="land">Terreno</option>
                      <option value="commercial">Comercial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Operación *</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      value={form.listingType || ''}
                      onChange={e=>setForm({...form, listingType: e.target.value as any})}
                      required
                    >
                      <option value="sale">Venta</option>
                      <option value="rent">Alquiler</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4 flex items-center gap-2">
                  <FiMapPin className="text-[#00A676]" />
                  Ubicación
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación Completa *</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      placeholder="Av. Winston Churchill, Piantini"
                      value={form.location || ''}
                      onChange={e=>setForm({...form, location: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      placeholder="Santo Domingo"
                      value={form.city || ''}
                      onChange={e=>setForm({...form, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sector/Barrio</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      placeholder="Piantini"
                      value={form.neighborhood || ''}
                      onChange={e=>setForm({...form, neighborhood: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4 flex items-center gap-2">
                  <FiFileText className="text-[#00A676]" />
                  Descripciones
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <FiEye className="text-[#00A676]" />
                      Notas Públicas * (Visible para compradores - mínimo 50 caracteres)
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      rows={6}
                      placeholder="Describe las características principales de la propiedad, amenidades, acabados, ubicación estratégica, etc. Esta descripción será visible para todos los usuarios."
                      value={form.publicRemarks || ''}
                      onChange={e=>setForm({...form, publicRemarks: e.target.value})}
                      required
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {(form.publicRemarks || '').length} caracteres (mínimo 50)
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <FiLock className="text-orange-500" />
                      Notas Profesionales (Privado - solo para agentes/brokers)
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-orange-50"
                      rows={4}
                      placeholder="Notas internas: comisión, condiciones especiales, contacto del dueño, restricciones, historial de negociación, etc. Esta información NO será visible para el público."
                      value={form.professionalRemarks || ''}
                      onChange={e=>setForm({...form, professionalRemarks: e.target.value})}
                    />
                    <div className="text-xs text-orange-600 mt-1">
                      🔒 Esta información es confidencial y solo la verán agentes autorizados
                    </div>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4 flex items-center gap-2">
                  <FiImage className="text-[#00A676]" />
                  Imágenes * (Mínimo 1)
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={imageUrl}
                      onChange={e=>setImageUrl(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
                    />
                    <button
                      type="button"
                      onClick={addImage}
                      className="px-6 py-3 bg-[#00A676] text-white rounded-lg hover:bg-[#008F64] transition-colors font-medium"
                    >
                      Agregar
                    </button>
                  </div>
                  
                  {form.images && form.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {form.images.map((url, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={url}
                            alt={`Imagen ${i + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {i === 0 ? 'Principal' : `#${i + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Agent Info & Status */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4">Configuración</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID del Agente</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      placeholder="agent-12345"
                      value={form.agentId || ''}
                      onChange={e=>setForm({...form, agentId: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Agente</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      placeholder="Juan Pérez"
                      value={form.agentName || ''}
                      onChange={e=>setForm({...form, agentName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado de la Publicación</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      value={form.status || 'pending'}
                      onChange={e=>setForm({...form, status: e.target.value as any})}
                    >
                      <option value="pending">Pendiente de Aprobación</option>
                      <option value="active">Activo (Visible en plataforma)</option>
                      <option value="draft">Borrador</option>
                      <option value="sold">Vendido/Alquilado</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-7">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={form.featured || false}
                      onChange={e=>setForm({...form, featured: e.target.checked})}
                      className="w-5 h-5 text-[#00A676] border-gray-300 rounded focus:ring-[#00A676]"
                    />
                    <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                      ⭐ Destacar propiedad en página principal
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => router.push('/admin/properties')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-[#00A676] text-white rounded-lg hover:bg-[#008F64] disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-[#00A676]/30 transition-all"
                >
                  {saving ? 'Guardando...' : '✓ Crear Propiedad'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}
