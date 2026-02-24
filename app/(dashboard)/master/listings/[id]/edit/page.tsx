// app/(dashboard)/master/listings/[id]/edit/page.tsx
'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiImage, FiMapPin, FiDollarSign, FiHome, FiFileText, FiEye, FiLock, FiArrowLeft, FiAlertCircle } from 'react-icons/fi'
import { uploadMultipleImages, validateImageFiles } from '@/lib/storageService'
import Link from 'next/link'

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params?.id as string

  const [form, setForm] = useState<any>(null)
  const [originalForm, setOriginalForm] = useState<any>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progressByIndex, setProgressByIndex] = useState<number[]>([])
  const [currency, setCurrency] = useState<'USD' | 'DOP'>('USD')
  const exchangeRate = 58.5
  const [features, setFeatures] = useState<string[]>([])
  const autosaveTimerRef = useRef<any>(null)

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

  useEffect(() => {
    if (!propertyId) return
    loadProperty()
  }, [propertyId])

  async function loadProperty() {
    setLoading(true)
    try {
      const res = await fetch(`/api/properties/${propertyId}`)
      if (res.ok) {
        const json = await res.json()
        if (json.ok && json.data) {
          setForm(json.data)
          setOriginalForm(JSON.parse(JSON.stringify(json.data)))
          setCurrency(json.data.currency || 'USD')
          setFeatures(json.data.features || [])
          setIsDirty(false)
        } else {
          toast.error('No se encontró la propiedad')
          router.push('/master/listings')
        }
      } else {
        toast.error('No se pudo cargar la propiedad')
        router.push('/master/listings')
      }
    } catch (e) {
      console.error('Failed to load property', e)
      toast.error('Error al cargar la propiedad')
      router.push('/master/listings')
    } finally {
      setLoading(false)
    }
  }

  // Track dirty state
  useEffect(() => {
    if (!form || !originalForm) return
    const current = JSON.stringify({ ...form, features })
    const original = JSON.stringify({ ...originalForm, features: originalForm.features || [] })
    setIsDirty(current !== original)
  }, [form, features, originalForm])

  // Autosave draft every 30s if dirty
  useEffect(() => {
    if (!isDirty || saving) return
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      saveDraft()
    }, 30000)
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  }, [isDirty, form, features, saving])

  // Keyboard shortcut Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (!saving && form) {
          submit(new Event('submit') as any)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saving, form])

  // Warn on navigate with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  async function saveDraft() {
    if (!form || saving) return
    try {
      setSaving(true)
      const payload: any = {
        id: propertyId,
        title: form.title?.trim() || 'Sin título',
        description: form.description?.trim() || form.publicRemarks?.trim() || '',
        publicRemarks: form.publicRemarks?.trim() || '',
        professionalRemarks: form.professionalRemarks?.trim() || '',
        price: Number(form.price || 0),
        currency,
        location: form.location?.trim() || '',
        city: form.city?.trim() || '',
        neighborhood: form.neighborhood?.trim() || '',
        bedrooms: Number(form.bedrooms || 0),
        bathrooms: Number(form.bathrooms || 0),
        area: Number(form.area || 0),
        propertyType: form.propertyType || 'apartment',
        listingType: form.listingType || 'sale',
        images: form.images || [],
        agentId: form.agentId?.trim() || '',
        agentName: form.agentName?.trim() || '',
        status: 'draft',
        featured: Boolean(form.featured),
        features,
      }
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', ...payload }),
      })
      if (res.ok) {
        setLastSaved(new Date())
        setOriginalForm(JSON.parse(JSON.stringify({ ...form, features })))
        setIsDirty(false)
      }
    } catch (e) {
      console.error('Autosave failed:', e)
    } finally {
      setSaving(false)
    }
  }

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
    if (!selectedFiles.length) {
      toast.error('Selecciona una o más imágenes')
      return
    }
    try {
      setUploading(true)
      // Server-side API handles UID from session cookie - no need to pass it from client
      const folder = `listing_images/temp_${Date.now()}`
      const urls = await uploadMultipleImages(selectedFiles, folder, (index, p) => {
        setProgressByIndex((prev) => {
          const next = [...prev]
          next[index] = p
          return next
        })
      })
      setForm((prev: any) => ({ ...prev, images: [...(prev.images || []), ...urls] }))
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
    
    if (!form.title?.trim()) { toast.error('El título es requerido'); return }
    if (!form.price || form.price <= 0) { toast.error('El precio debe ser mayor a 0'); return }
    if (!form.location?.trim()) { toast.error('La ubicación es requerida'); return }
    if (!form.publicRemarks?.trim() || form.publicRemarks.length < 50) { toast.error('Las notas públicas deben tener al menos 50 caracteres'); return }

    setSaving(true)
    try {
      const payload: any = {
        id: propertyId,
        title: form.title.trim(),
        description: form.description?.trim() || form.publicRemarks?.trim() || '',
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
        images: form.images || [],
        agentId: form.agentId?.trim() || '',
        agentName: form.agentName?.trim() || '',
        status: form.status,
        featured: Boolean(form.featured),
        features,
      }
      
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', ...payload }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'No se pudo actualizar la propiedad')
      }
      toast.success('¡Propiedad actualizada exitosamente!')
      setLastSaved(new Date())
      setOriginalForm(JSON.parse(JSON.stringify({ ...form, features })))
      setIsDirty(false)
      router.push('/master/listings')
    } catch (e: any) {
      console.error('Failed to update listing:', e)
      toast.error(e?.message || 'Error al actualizar la propiedad')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00A676] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Cargando propiedad...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Link href="/master/listings" className="text-gray-600 hover:text-[#00A676]">
                    <FiArrowLeft size={24} />
                  </Link>
                  <h1 className="text-3xl font-bold text-[#0B2545]">Editar Propiedad</h1>
                  {isDirty && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full">
                      <FiAlertCircle size={14} />
                      Cambios sin guardar
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>ID: {form.listingId || propertyId}</span>
                  {lastSaved && (
                    <span className="text-green-600">
                      • Guardado {new Date(lastSaved).toLocaleTimeString('es-DO')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tabbed form for better UX */}
            <div className="sticky top-0 z-40 -mx-6 px-6 py-3 bg-gradient-to-r from-white to-gray-50 border-b flex flex-wrap items-center gap-3 shadow-sm">
              {['Basico','Ubicacion','Descripciones','Amenidades','Media','Config'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => document.getElementById(`section-${tab.toLowerCase()}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:border-[#00A676] hover:text-[#00A676] font-medium bg-white transition-all"
                >
                  {tab}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-3">
                {isDirty && !saving && (
                  <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                    <FiAlertCircle size={12} />
                    Sin guardar
                  </span>
                )}
                {saving && <span className="text-sm text-gray-500 animate-pulse">Guardando...</span>}
                {!saving && lastSaved && !isDirty && (
                  <span className="text-xs text-green-600">
                    ✓ Guardado
                  </span>
                )}
                {!saving && !isDirty && (
                  <span className="text-xs text-gray-400">Autosave 30s • Ctrl+S</span>
                )}
                <button
                  type="button"
                  onClick={(e) => submit(e as any)}
                  disabled={saving}
                  className="px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] disabled:opacity-50 transition-all shadow-md"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
            <form onSubmit={submit} className="space-y-10">
              {/* Basic Information */}
              <div id="section-basico" className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4 flex items-center gap-2">
                  <FiHome className="text-[#00A676]" />
                  Información Básica
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-title">Título *</label>
                    <input
                      id="edit-title"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676]"
                      placeholder="Ej: Hermoso Apartamento en Piantini"
                      value={form.title || ''}
                      onChange={e=>setForm({...form, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1" htmlFor="edit-price">
                      <FiDollarSign className="text-gray-400" />
                      Precio ({currency === 'USD' ? 'USD $' : 'DOP RD$'}) *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        id="edit-price"
                        className="col-span-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676]"
                        type="number"
                        placeholder="250000"
                        value={form.price || ''}
                        onChange={e=>setForm({...form, price: Number(e.target.value)})}
                        required
                      />
                      <select
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676]"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as 'USD' | 'DOP')}
                        aria-label="Moneda"
                      >
                        <option value="USD">🇺🇸 USD</option>
                        <option value="DOP">🇩🇴 DOP</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-area">Área (m²) *</label>
                    <input
                      id="edit-area"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676]"
                      type="number"
                      placeholder="120"
                      value={form.area || ''}
                      onChange={e=>setForm({...form, area: Number(e.target.value)})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-bedrooms">Habitaciones *</label>
                    <input
                      id="edit-bedrooms"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676]"
                      type="number"
                      min="0"
                      placeholder="3"
                      value={form.bedrooms || ''}
                      onChange={e=>setForm({...form, bedrooms: Number(e.target.value)})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-bathrooms">Baños *</label>
                    <input
                      id="edit-bathrooms"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676]"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="2"
                      value={form.bathrooms || ''}
                      onChange={e=>setForm({...form, bathrooms: Number(e.target.value)})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Propiedad *</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676]"
                      value={form.propertyType || ''}
                      onChange={e=>setForm({...form, propertyType: e.target.value})}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Operación *</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676]"
                      value={form.listingType || ''}
                      onChange={e=>setForm({...form, listingType: e.target.value})}
                      required
                      aria-label="Tipo de operación"
                    >
                      <option value="sale">Venta</option>
                      <option value="rent">Alquiler</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div id="section-ubicacion" className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4 flex items-center gap-2">
                  <FiMapPin className="text-[#00A676]" />
                  Ubicación
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-location">Ubicación Completa *</label>
                    <input
                      id="edit-location"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676]"
                      placeholder="Calle Principal #123, Piantini"
                      value={form.location || ''}
                      onChange={e=>setForm({...form, location: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-city">Ciudad</label>
                    <input
                      id="edit-city"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676]"
                      placeholder="Santo Domingo"
                      value={form.city || ''}
                      onChange={e=>setForm({...form, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-neighborhood">Sector/Barrio</label>
                    <input
                      id="edit-neighborhood"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676]"
                      placeholder="Piantini"
                      value={form.neighborhood || ''}
                      onChange={e=>setForm({...form, neighborhood: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div id="section-descripciones" className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4 flex items-center gap-2">
                  <FiFileText className="text-[#00A676]" />
                  Descripciones
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1" htmlFor="edit-publicRemarks">
                      <FiEye className="text-[#00A676]" />
                      Notas Públicas * (mínimo 50 caracteres)
                    </label>
                    <textarea
                      id="edit-publicRemarks"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676]"
                      rows={6}
                      placeholder="Describe la propiedad, ubicación, características destacadas..."
                      value={form.publicRemarks || ''}
                      onChange={e=>setForm({...form, publicRemarks: e.target.value})}
                      required
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {(form.publicRemarks || '').length} caracteres
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1" htmlFor="edit-professionalRemarks">
                      <FiLock className="text-orange-500" />
                      Notas Profesionales (Privado)
                    </label>
                    <textarea
                      id="edit-professionalRemarks"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-orange-50"
                      rows={4}
                      placeholder="Notas internas solo visibles para profesionales..."
                      value={form.professionalRemarks || ''}
                      onChange={e=>setForm({...form, professionalRemarks: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div id="section-amenidades" className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4">Amenidades</h2>
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
              </div>

              {/* Images */}
              <div id="section-media" className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4 flex items-center gap-2">
                  <FiImage className="text-[#00A676]" />
                  Imágenes (Máximo 10)
                </h2>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        onChange={(e) => onFileSelect(e.target.files)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                        aria-label="Seleccionar imágenes"
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
                      >
                        {uploading ? 'Subiendo…' : 'Subir'}
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
                                className="h-2 w-full"
                                aria-label={`Progreso de carga ${i + 1}`}
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
                      {form.images.map((url: string, i: number) => (
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

              {/* Configuration */}
              <div id="section-config" className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#0B2545] mb-4">Configuración</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-agentId">ID del Agente</label>
                    <input
                      id="edit-agentId"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676]"
                      placeholder="abc123"
                      value={form.agentId || ''}
                      onChange={e=>setForm({...form, agentId: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-agentName">Nombre del Agente</label>
                    <input
                      id="edit-agentName"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676]"
                      placeholder="Juan Pérez"
                      value={form.agentName || ''}
                      onChange={e=>setForm({...form, agentName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676]"
                      value={form.status || 'pending'}
                      onChange={e=>setForm({...form, status: e.target.value})}
                      aria-label="Estado de la publicación"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="active">Activo</option>
                      <option value="draft">Borrador</option>
                      <option value="sold">Vendido/Alquilado</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-7">
                    <input
                      type="checkbox"
                      checked={form.featured || false}
                      onChange={e=>setForm({...form, featured: e.target.checked})}
                      className="w-5 h-5 text-[#00A676] border-gray-300 rounded focus:ring-[#00A676]"
                      id="featured"
                    />
                    <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                      ⭐ Destacar propiedad
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-4">
                <Link
                  href="/master/listings"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-[#00A676] text-white rounded-lg hover:bg-[#008F64] disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-[#00A676]/30 transition-all"
                >
                  {saving ? 'Guardando...' : '✓ Guardar Cambios'}
                </button>
              </div>
            </form>
      </div>
    </div>
  )
}
