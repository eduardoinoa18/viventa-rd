// app/(dashboard)/master/listings/create/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { type Property } from '@/lib/firestoreService'
import { uploadMultipleImages, validateImageFiles, generatePropertyImagePath } from '@/lib/storageService'
import { getSession } from '@/lib/authSession'
import { auth } from '@/lib/firebaseClient'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { FiImage, FiMapPin, FiDollarSign, FiHome, FiFileText, FiEye, FiLock } from 'react-icons/fi'
// Removed direct Firestore counters usage; server API now generates listingId

export default function CreatePropertyPage() {
  const router = useRouter()
  const isE2E = typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_E2E === '1') && new URLSearchParams(window.location.search).get('e2e') === '1'
  // Wizard state
  const [step, setStep] = useState<1|2|3|4|5|6>(1)
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
  const [saving, setSaving] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progressByIndex, setProgressByIndex] = useState<number[]>([])
  const [adminUid, setAdminUid] = useState<string>('')
  const [currency, setCurrency] = useState<'USD' | 'DOP'>('USD')
  const exchangeRate = 58.5
  const [features, setFeatures] = useState<string[]>([])

  const amenitiesCategories = {
    interior: {
      label: 'Interior',
      items: [
        { id: 'ac', label: 'Aire Acondicionado' },
        { id: 'furnished', label: 'Amueblado' },
        { id: 'kitchen-equipped', label: 'Cocina Equipada' },
        { id: 'walk-in-closet', label: 'Walk-in Closet' },
        { id: 'laundry-room', label: 'Cuarto de Lavado' },
        { id: 'maid-quarters', label: 'Cuarto de Servicio' },
        { id: 'office', label: 'Oficina/Estudio' },
        { id: 'fireplace', label: 'Chimenea' },
        { id: 'high-ceilings', label: 'Techos Altos' },
        { id: 'hardwood-floors', label: 'Pisos de Madera' }
      ]
    },
    exterior: {
      label: 'Exterior',
      items: [
        { id: 'pool', label: 'Piscina' },
        { id: 'garden', label: 'Jardín' },
        { id: 'terrace', label: 'Terraza' },
        { id: 'balcony', label: 'Balcón' },
        { id: 'bbq-area', label: 'Área BBQ' },
        { id: 'outdoor-kitchen', label: 'Cocina Exterior' },
        { id: 'gazebo', label: 'Gazebo' },
        { id: 'jacuzzi', label: 'Jacuzzi' },
        { id: 'deck', label: 'Deck' },
        { id: 'patio', label: 'Patio' }
      ]
    },
    building: {
      label: 'Edificio/Comunidad',
      items: [
        { id: 'elevator', label: 'Ascensor' },
        { id: 'gym', label: 'Gimnasio' },
        { id: 'security-24-7', label: 'Seguridad 24/7' },
        { id: 'concierge', label: 'Conserje' },
        { id: 'playground', label: 'Parque Infantil' },
        { id: 'social-area', label: 'Área Social' },
        { id: 'party-room', label: 'Salón de Fiestas' },
        { id: 'coworking', label: 'Coworking' },
        { id: 'pet-friendly', label: 'Pet-Friendly' },
        { id: 'spa', label: 'Spa' },
        { id: 'tennis-court', label: 'Cancha de Tenis' },
        { id: 'basketball-court', label: 'Cancha de Baloncesto' }
      ]
    },
    parking: {
      label: 'Parqueo',
      items: [
        { id: 'covered-parking', label: 'Parqueo Techado' },
        { id: 'garage', label: 'Garaje' },
        { id: 'visitor-parking', label: 'Parqueo Visitantes' },
        { id: 'electric-charger', label: 'Cargador Eléctrico' }
      ]
    },
    views: {
      label: 'Vistas',
      items: [
        { id: 'ocean-view', label: 'Vista al Mar' },
        { id: 'mountain-view', label: 'Vista a Montañas' },
        { id: 'city-view', label: 'Vista a Ciudad' },
        { id: 'golf-view', label: 'Vista a Campo Golf' },
        { id: 'garden-view', label: 'Vista a Jardín' },
        { id: 'pool-view', label: 'Vista a Piscina' }
      ]
    },
    technology: {
      label: 'Tecnología',
      items: [
        { id: 'smart-home', label: 'Smart Home' },
        { id: 'fiber-optic', label: 'Fibra Óptica' },
        { id: 'solar-panels', label: 'Paneles Solares' },
        { id: 'backup-generator', label: 'Planta Eléctrica' },
        { id: 'water-cistern', label: 'Cisterna' },
        { id: 'security-cameras', label: 'Cámaras de Seguridad' },
        { id: 'alarm-system', label: 'Sistema de Alarma' }
      ]
    }
  } as const

  function toggleFeature(id: string) {
    setFeatures((prev) => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  // listingId generation handled by server API

  // Ensure Firebase Auth is present (anonymous is fine) for Storage writes
  useEffect(() => {
    if (isE2E) return
    const unsub = onAuthStateChanged(auth as any, async (_user: any) => {
      if (!_user) {
        try { await signInAnonymously(auth as any) } catch (e) { console.warn('Anonymous sign-in failed', e) }
      }
    })
    const s = getSession()
    if (s?.uid) setAdminUid(s.uid)
    return () => { try { unsub() } catch {} }
  }, [])

  function onFileSelect(files: FileList | null) {
    const arr = Array.from(files || [])
    if (arr.length === 0) return
    const total = (form.images?.length || 0) + arr.length
    if (total > 10) {
      toast.error('Máximo 10 imágenes por propiedad')
      return
    }
    const v = validateImageFiles(arr)
    if (!v.valid) {
      v.errors.forEach((e) => toast.error(e))
      return
    }
    setSelectedFiles(arr)
    setProgressByIndex(new Array(arr.length).fill(0))
    toast.success(`${arr.length} archivo(s) listo(s) para subir`)
  }

  async function uploadSelected() {
    if (isE2E) {
      // Simulate successful upload in E2E mode
      setUploading(true)
      setTimeout(() => {
        setProgressByIndex([100])
        setForm((prev) => ({ ...prev, images: [...(prev.images || []), 'https://placehold.co/800x600?text=E2E+Image'] }))
        setSelectedFiles([])
        toast.success('Imágenes subidas (modo E2E)')
        setUploading(false)
      }, 300)
      return
    }

    if (!selectedFiles.length) {
      toast.error('Selecciona una o más imágenes')
      return
    }
    if (!adminUid) {
      toast.error('No se encontró sesión del administrador. Vuelve a iniciar sesión.')
      return
    }
    try {
      setUploading(true)
      const folder = generatePropertyImagePath(adminUid)
      const urls = await uploadMultipleImages(selectedFiles, folder, (index, p) => {
        setProgressByIndex((prev) => {
          const next = [...prev]
          next[index] = p
          return next
        })
      })
      setForm((prev) => ({ ...prev, images: [...(prev.images || []), ...urls] }))
      setSelectedFiles([])
      setProgressByIndex([])
      toast.success('Imágenes subidas correctamente')
    } catch (e: any) {
      console.error('Upload failed', e)
      toast.error(e?.message || 'No se pudieron subir las imágenes')
    } finally {
      setUploading(false)
    }
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
    if (!form.title?.trim()) { toast.error('El título es requerido'); setStep(1 as any); return }
    if (!form.price || form.price <= 0) { toast.error('El precio debe ser mayor a 0'); setStep(1 as any); return }
    if (!form.location?.trim()) { toast.error('La ubicación es requerida'); setStep(2 as any); return }
    if (!form.publicRemarks?.trim() || form.publicRemarks.length < 50) { toast.error('Las notas públicas deben tener al menos 50 caracteres'); setStep(3 as any); return }
    // Imágenes opcionales; si no hay, se mostrará placeholder en la UI

    if (isE2E) {
      setSaving(true)
      setTimeout(() => {
        toast.success('¡Propiedad creada exitosamente! (E2E)')
        router.push('/master/listings')
      }, 300)
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
        currency,
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
        agentEmail: form.agentId ? undefined : getSession()?.email, // attempt to include email if available
        status: form.status,
        featured: Boolean(form.featured),
        features,
      }
      // Determine endpoint based on role (admins vs professionals)
      const session = getSession()
      const role = session?.role
      const isAdmin = role === 'master_admin'
      const endpoint = isAdmin ? '/api/admin/properties' : '/api/properties'
      const body = isAdmin
        ? JSON.stringify({ ...payload })
        : JSON.stringify({ action: 'create', ...payload })

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (!res.ok) {
        if (res.status === 403) {
          toast.error('No autorizado. Vuelve a iniciar sesión con tu cuenta correcta.')
        } else {
          const err = await res.json().catch(() => ({}))
          toast.error(err?.error || 'No se pudo crear la propiedad')
        }
        setSaving(false)
        return
      }
      const json = await res.json().catch(() => ({}))
      const listingId = json?.listingId || json?.data?.listingId
      const publishedNow = form.status === 'active'
      const message = publishedNow 
        ? `✅ ¡Propiedad publicada! Ahora es visible en búsquedas${listingId ? ` (ID: ${listingId})` : ''}` 
        : `✅ Propiedad guardada como ${form.status === 'draft' ? 'borrador' : 'pendiente'}${listingId ? ` (ID: ${listingId})` : ''}`
      toast.success(message, { duration: 5000 })
      
      // Reset form
      setForm({
        title: '', description: '', publicRemarks: '', professionalRemarks: '',
        price: 0, location: '', city: '', neighborhood: '',
        bedrooms: 1, bathrooms: 1, area: 0,
        propertyType: 'apartment', listingType: 'sale', images: [],
        agentId: '', agentName: '', status: 'pending', featured: false,
      })
      
      // Redirect to properties list after 1 second
      setTimeout(() => router.push('/master/listings'), 1000)
    } catch (e: any) {
      console.error('Failed to create listing:', e)
      toast.error(e?.message || 'Error al crear la propiedad')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#0B2545]" data-testid="create-heading">Crear Propiedad</h1>
              <p className="text-gray-600 mt-1">Completa el asistente en 6 pasos</p>
            </div>

            {/* Progress */}
            <div className="mb-6 bg-white rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Paso {step} de 6</span>
                <span className="text-sm font-medium text-gray-600">
                  {Math.round((step/6)*100)}%
                </span>
              </div>
              <div className="h-3">
                <progress
                  value={Math.round((step/6)*100)}
                  max={100}
                  className="w-full h-3 overflow-hidden rounded-full bg-gray-200 [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-[#00A676] [&::-webkit-progress-value]:to-[#00A6A6] [&::-moz-progress-bar]:bg-gradient-to-r"
                  aria-label="Progreso de creación de propiedad"
                />
              </div>
              <div className="mt-2 grid grid-cols-3 md:grid-cols-6 text-[11px] text-gray-600 gap-2">
                <div className={`${step>=1?'text-[#0B2545] font-semibold':''}`}>Básico</div>
                <div className={`${step>=2?'text-[#0B2545] font-semibold':''}`}>Ubicación</div>
                <div className={`${step>=3?'text-[#0B2545] font-semibold':''}`}>Descripciones</div>
                <div className={`${step>=4?'text-[#0B2545] font-semibold':''}`}>Amenidades</div>
                <div className={`${step>=5?'text-[#0B2545] font-semibold':''}`}>Imágenes</div>
                <div className={`${step>=6?'text-[#0B2545] font-semibold':''}`}>Publicar</div>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-6">
              {/* Basic Information */}
              {step === 1 && (
              <div className="bg-white rounded-lg shadow p-6 animate-fade-in">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4 flex items-center gap-2">
                  <FiHome className="text-[#00A676]" />
                  Información Básica
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title-input">Título de la Propiedad *</label>
                    <input
                      id="title-input"
                      data-testid="create-title"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      placeholder="Ej: Hermoso Apartamento en Piantini"
                      value={form.title || ''}
                      onChange={e=>setForm({...form, title: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1" htmlFor="price-input">
                      <FiDollarSign className="text-gray-400" />
                      Precio ({currency === 'USD' ? 'USD $' : 'DOP RD$'}) *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        id="price-input"
                        data-testid="create-price"
                        className="col-span-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                        type="number"
                        placeholder={currency === 'USD' ? '250000' : '14500000'}
                        value={form.price || ''}
                        onChange={e=>setForm({...form, price: Number(e.target.value)})}
                        required
                      />
                      <select
                        aria-label="Moneda"
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as 'USD' | 'DOP')}
                      >
                        <option value="USD">🇺🇸 USD</option>
                        <option value="DOP">🇩🇴 DOP</option>
                      </select>
                    </div>
                    {form.price ? (
                      <p className="text-xs text-gray-500 mt-1">
                        {currency === 'USD' ? (
                          <>≈ RD$ {(Number(form.price) * exchangeRate).toLocaleString('es-DO')} <span className="text-gray-400">(Tasa: {exchangeRate})</span></>
                        ) : (
                          <>≈ $ {(Number(form.price) / exchangeRate).toLocaleString('en-US', { maximumFractionDigits: 0 })} <span className="text-gray-400">(Tasa: {exchangeRate})</span></>
                        )}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="area-input">Área (m²) *</label>
                    <input
                      id="area-input"
                      data-testid="create-area"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      type="number"
                      placeholder="120"
                      value={form.area || ''}
                      onChange={e=>setForm({...form, area: Number(e.target.value)})}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="bedrooms-input">Habitaciones *</label>
                    <input
                      id="bedrooms-input"
                      data-testid="create-bedrooms"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      type="number"
                      min="0"
                      value={form.bedrooms || ''}
                      onChange={e=>setForm({...form, bedrooms: Number(e.target.value)})}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="bathrooms-input">Baños *</label>
                    <input
                      id="bathrooms-input"
                      data-testid="create-bathrooms"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="propertyType">Tipo de Propiedad *</label>
                    <select
                      id="propertyType"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      value={form.propertyType || ''}
                      onChange={e=>setForm({...form, propertyType: e.target.value as any})}
                      required
                      aria-label="Tipo de propiedad"
                    >
                      <option value="apartment">Apartamento</option>
                      <option value="house">Casa</option>
                      <option value="condo">Condominio</option>
                      <option value="land">Terreno</option>
                      <option value="commercial">Comercial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="listingType">Tipo de Operación *</label>
                    <select
                      id="listingType"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      value={form.listingType || ''}
                      onChange={e=>setForm({...form, listingType: e.target.value as any})}
                      required
                      aria-label="Tipo de operación"
                    >
                      <option value="sale">Venta</option>
                      <option value="rent">Alquiler</option>
                    </select>
                  </div>
                </div>
              </div>
              )}

              {/* Location */}
              {step === 2 && (
              <div className="bg-white rounded-lg shadow p-6 animate-fade-in">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4 flex items-center gap-2">
                  <FiMapPin className="text-[#00A676]" />
                  Ubicación
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación Completa *</label>
                    <input
                      data-testid="create-location"
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
              )}

              {/* Descriptions */}
              {step === 3 && (
              <div className="bg-white rounded-lg shadow p-6 animate-fade-in">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4 flex items-center gap-2">
                  <FiFileText className="text-[#00A676]" />
                  Descripciones
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <FiEye className="text-[#00A676]" />
                      Notas Públicas * (Visible para compradores - mínimo 50 caracteres)
                    </label>
                    <textarea
                      data-testid="create-public-remarks"
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
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
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
              )}

              {/* Amenidades */}
              {step === 4 && (
              <div className="bg-white rounded-lg shadow p-6 animate-fade-in">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4">Amenidades</h2>
                <p className="text-sm text-gray-600 mb-4">Selecciona todas las que apliquen. Se mostrarán en el listado.</p>
                <div className="space-y-6">
                  {Object.entries(amenitiesCategories).map(([key, cat]) => (
                    <div key={key} className="border-2 border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">{cat.label}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {cat.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleFeature(item.id)}
                            className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                              features.includes(item.id)
                                ? 'bg-gradient-to-r from-[#00A676] to-[#00A6A6] border-[#00A676] text-white shadow-md'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-[#00A676]'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {features.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                    {features.length} amenidades seleccionadas
                  </div>
                )}
              </div>
              )}

              {/* Images */}
              {step === 5 && (
              <div className="bg-white rounded-lg shadow p-6 animate-fade-in">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4 flex items-center gap-2">
                  <FiImage className="text-[#00A676]" />
                  Imágenes (Opcional, Máximo 10)
                </h2>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        id="propertyImages"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        onChange={(e) => onFileSelect(e.target.files)}
                        aria-label="Seleccionar imágenes de la propiedad"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={uploadSelected}
                        disabled={
                          uploading ||
                          selectedFiles.length === 0 ||
                          (form.images?.length || 0) >= 10 ||
                          ((form.images?.length || 0) + selectedFiles.length) > 10
                        }
                        className="px-6 py-3 bg-[#00A676] text-white rounded-lg font-medium hover:bg-[#008F64] disabled:opacity-50"
                        data-testid="create-upload"
                      >
                        {uploading ? 'Subiendo…' : 'Subir imágenes'}
                      </button>
                    </div>
                    {selectedFiles.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {selectedFiles.map((f, i) => (
                          <div key={i} className="border rounded-lg p-2">
                            <div className="text-xs font-medium truncate" title={f.name}>{f.name}</div>
                            <div className="h-2 bg-gray-200 rounded mt-2 overflow-hidden">
                              <progress
                                value={Math.round(progressByIndex[i] || 0)}
                                max={100}
                                aria-label={`Progreso de carga ${i + 1}`}
                                className="h-2 w-full"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">Formatos: JPG/PNG/WebP • Máx 5MB c/u • Hasta 10 imágenes
                      {Boolean(form.images?.length) && (
                        <span> • Actualmente: {form.images?.length || 0}/10</span>
                      )}
                    </div>
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
              )}

              {/* Agent Info & Status */}
              {step === 6 && (
              <div className="bg-white rounded-lg shadow p-6 animate-fade-in">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4">Configuración</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título de la Propiedad <span className="text-red-500">*</span></label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">Estado de la Publicación</label>
                    <select
                      id="status"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      value={form.status || 'pending'}
                      onChange={e=>setForm({...form, status: e.target.value as any})}
                      aria-label="Estado de la publicación"
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
              )}

              {/* Navigation / Submit */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(((step-1) as 1|2|3|4|5|6))}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Anterior
                    </button>
                  )}
                </div>
                <div className="flex gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => router.push('/master/listings')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  {step < 6 ? (
                    <button
                      type="button"
                      onClick={() => {
                        // Lightweight per-step validation
                        if (step === 1) {
                          if (!form.title?.trim()) return toast.error('El título es requerido')
                          if (!form.price || form.price <= 0) return toast.error('El precio debe ser mayor a 0')
                        }
                        if (step === 2) {
                          if (!form.location?.trim()) return toast.error('La ubicación es requerida')
                        }
                        if (step === 3) {
                          if (!form.publicRemarks?.trim() || (form.publicRemarks||'').length < 50) return toast.error('Añade al menos 50 caracteres en Notas Públicas')
                        }
                        // Paso 5 (Imágenes) ahora es opcional; sin validación de mínimo
                        setStep(((step+1) as 1|2|3|4|5|6))
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="px-8 py-3 bg-[#00A676] text-white rounded-lg hover:bg-[#008F64] disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-[#00A676]/30 transition-all"
                    >
                      Siguiente
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-8 py-3 bg-[#00A676] text-white rounded-lg hover:bg-[#008F64] disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-[#00A676]/30 transition-all"
                      data-testid="create-submit"
                    >
                      {saving ? 'Guardando...' : '✓ Crear Propiedad'}
                    </button>
                  )}
                </div>
              </div>
            </form>
      </div>
    </div>
  )
}
