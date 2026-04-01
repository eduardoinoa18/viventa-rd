'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { uploadMultipleImages, validateImageFiles } from '@/lib/storageService'

type EditForm = {
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
  deslindadoStatus: 'deslindado' | 'en-proceso' | 'sin-deslinde' | 'desconocido'
  furnishedStatus: 'amueblado' | 'semi-amueblado' | 'sin-amueblar'
  hoaIncludedItems: string
  mlsOnly: boolean
  cobrokeCommissionPercent: string
  showingInstructions: string
  brokerNotes: string
  privateContactName: string
  privateContactPhone: string
  privateContactEmail: string
  address: string
  lat: string
  lng: string
  coverImage: string
  promoVideoUrl: string
  status: 'active' | 'pending' | 'inactive' | 'sold' | 'rented'
  maintenanceInfo: string
  inventoryMode: 'single' | 'project'
  totalUnits: string
  availableUnits: string
  terrainZoningType: string
  terrainMaxBuildHeight: string
  terrainBuildPotential: string
  terrainUtilities: string
}

const AMENITIES_CATEGORIES = [
  { key: 'interior', label: 'Interior', items: [{ id: 'ac', label: 'Aire Acondicionado' }, { id: 'furnished', label: 'Amueblado' }, { id: 'kitchen-equipped', label: 'Cocina Equipada' }, { id: 'walk-in-closet', label: 'Walk-in Closet' }, { id: 'laundry-room', label: 'Cuarto de Lavado' }, { id: 'maid-quarters', label: 'Cuarto de Servicio' }, { id: 'office', label: 'Oficina/Estudio' }, { id: 'fireplace', label: 'Chimenea' }, { id: 'high-ceilings', label: 'Techos Altos' }, { id: 'hardwood-floors', label: 'Pisos de Madera' }] },
  { key: 'exterior', label: 'Exterior', items: [{ id: 'pool', label: 'Piscina' }, { id: 'garden', label: 'Jardín' }, { id: 'terrace', label: 'Terraza' }, { id: 'balcony', label: 'Balcón' }, { id: 'bbq-area', label: 'Área BBQ' }, { id: 'outdoor-kitchen', label: 'Cocina Exterior' }, { id: 'gazebo', label: 'Gazebo' }, { id: 'jacuzzi', label: 'Jacuzzi' }, { id: 'deck', label: 'Deck' }, { id: 'patio', label: 'Patio' }] },
  { key: 'building', label: 'Edificio/Comunidad', items: [{ id: 'elevator', label: 'Ascensor' }, { id: 'gym', label: 'Gimnasio' }, { id: 'security-24-7', label: 'Seguridad 24/7' }, { id: 'concierge', label: 'Conserje' }, { id: 'playground', label: 'Parque Infantil' }, { id: 'social-area', label: 'Área Social' }, { id: 'party-room', label: 'Salón de Fiestas' }, { id: 'coworking', label: 'Coworking' }, { id: 'pet-friendly', label: 'Pet-Friendly' }, { id: 'spa', label: 'Spa' }, { id: 'tennis-court', label: 'Cancha de Tenis' }, { id: 'basketball-court', label: 'Cancha de Baloncesto' }] },
  { key: 'parking', label: 'Parqueo', items: [{ id: 'covered-parking', label: 'Parqueo Techado' }, { id: 'garage', label: 'Garaje' }, { id: 'visitor-parking', label: 'Parqueo Visitantes' }, { id: 'electric-charger', label: 'Cargador Eléctrico' }] },
  { key: 'views', label: 'Vistas', items: [{ id: 'ocean-view', label: 'Vista al Mar' }, { id: 'mountain-view', label: 'Vista a Montañas' }, { id: 'city-view', label: 'Vista a Ciudad' }, { id: 'golf-view', label: 'Vista a Campo Golf' }, { id: 'garden-view', label: 'Vista a Jardín' }, { id: 'pool-view', label: 'Vista a Piscina' }] },
  { key: 'technology', label: 'Tecnología', items: [{ id: 'smart-home', label: 'Smart Home' }, { id: 'fiber-optic', label: 'Fibra Óptica' }, { id: 'solar-panels', label: 'Paneles Solares' }, { id: 'backup-generator', label: 'Planta Eléctrica' }, { id: 'water-cistern', label: 'Cisterna' }, { id: 'security-cameras', label: 'Cámaras de Seguridad' }, { id: 'alarm-system', label: 'Sistema de Alarma' }] },
] as const

export default function EditProfessionalListingPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = String(params?.id || '')
  const [accessChecking, setAccessChecking] = useState(true)
  const [accessDenied, setAccessDenied] = useState('')

  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [error, setError] = useState('')
  const [features, setFeatures] = useState<string[]>([])
  const [listingDisplayId, setListingDisplayId] = useState('')

  useEffect(() => {
    let active = true
    const checkAccess = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!active) return

        if (!res.ok || !json?.ok || !json?.session) {
          setAccessDenied('Inicia sesión con una cuenta profesional para editar listados.')
          return
        }

        const role = String(json.session.role || '').toLowerCase()
        if (!['agent', 'broker', 'constructora', 'admin', 'master_admin'].includes(role)) {
          setAccessDenied('Esta sección está disponible solo para cuentas profesionales aprobadas.')
          return
        }

        setAccessDenied('')
      } catch {
        if (active) setAccessDenied('No se pudo validar tu sesión. Intenta nuevamente.')
      } finally {
        if (active) setAccessChecking(false)
      }
    }

    checkAccess()
    return () => {
      active = false
    }
  }, [])

  const [form, setForm] = useState<EditForm>({
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
    deslindadoStatus: 'desconocido',
    furnishedStatus: 'sin-amueblar',
    hoaIncludedItems: '',
    mlsOnly: false,
    cobrokeCommissionPercent: '',
    showingInstructions: '',
    brokerNotes: '',
    privateContactName: '',
    privateContactPhone: '',
    privateContactEmail: '',
    address: '',
    lat: '',
    lng: '',
    coverImage: '',
    promoVideoUrl: '',
    status: 'active',
    maintenanceInfo: '',
    inventoryMode: 'single',
    totalUnits: '',
    availableUnits: '',
    terrainZoningType: '',
    terrainMaxBuildHeight: '',
    terrainBuildPotential: '',
    terrainUtilities: '',
  })

  useEffect(() => {
    if (!listingId || accessChecking || accessDenied) return

    async function loadListing() {
      try {
        setLoadingData(true)
        const res = await fetch(`/api/properties/${listingId}`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))

        if (!res.ok || !json?.ok || !json?.data) {
          setLoadError(json?.error || 'No se pudo cargar el listado.')
          return
        }

        const d = json.data as Record<string, any>
        setListingDisplayId(d.listingId || listingId)
        setFeatures(Array.isArray(d.features) ? d.features : [])
        setUploadedImages(Array.isArray(d.images) ? d.images : [])

        const hoaRaw = Array.isArray(d.hoaIncludedItems) ? d.hoaIncludedItems.join(', ') : String(d.hoaIncludedItems || '')
        const terrainUtilities = Array.isArray(d.terrainDetails?.utilitiesAvailable)
          ? d.terrainDetails.utilitiesAvailable.join(', ')
          : String(d.terrainDetails?.utilitiesAvailable || '')

        setForm({
          title: String(d.title || ''),
          description: String(d.description || d.publicRemarks || ''),
          price: d.price ? String(d.price) : '',
          currency: d.currency === 'DOP' ? 'DOP' : 'USD',
          city: String(d.city || ''),
          neighborhood: String(d.neighborhood || d.sector || ''),
          location: String(d.location || ''),
          propertyType: String(d.propertyType || 'apartment'),
          listingType: d.listingType === 'rent' ? 'rent' : 'sale',
          bedrooms: d.bedrooms !== undefined ? String(d.bedrooms) : '1',
          bathrooms: d.bathrooms !== undefined ? String(d.bathrooms) : '1',
          area: d.area ? String(d.area) : '',
          parking: d.parking !== undefined ? String(d.parking) : '0',
          maintenanceFee: d.maintenanceFee ? String(d.maintenanceFee) : '',
          deslindadoStatus: (['deslindado', 'en-proceso', 'sin-deslinde', 'desconocido'].includes(d.deslindadoStatus) ? d.deslindadoStatus : 'desconocido') as EditForm['deslindadoStatus'],
          furnishedStatus: (['amueblado', 'semi-amueblado', 'sin-amueblar'].includes(d.furnishedStatus) ? d.furnishedStatus : 'sin-amueblar') as EditForm['furnishedStatus'],
          hoaIncludedItems: hoaRaw,
          mlsOnly: Boolean(d.mlsOnly),
          cobrokeCommissionPercent: d.cobrokeCommissionPercent ? String(d.cobrokeCommissionPercent) : '',
          showingInstructions: String(d.showingInstructions || ''),
          brokerNotes: String(d.brokerNotes || ''),
          privateContactName: String(d.privateContactName || ''),
          privateContactPhone: String(d.privateContactPhone || ''),
          privateContactEmail: String(d.privateContactEmail || ''),
          address: String(d.address || ''),
          lat: d.lat !== undefined && d.lat !== null ? String(d.lat) : '',
          lng: d.lng !== undefined && d.lng !== null ? String(d.lng) : '',
          coverImage: String(d.coverImage || ''),
          promoVideoUrl: String(d.promoVideoUrl || ''),
          status: (['active', 'pending', 'inactive', 'sold', 'rented'].includes(d.status) ? d.status : 'active') as EditForm['status'],
          maintenanceInfo: String(d.maintenanceInfo || ''),
          inventoryMode: d.inventoryMode === 'project' ? 'project' : 'single',
          totalUnits: d.totalUnits ? String(d.totalUnits) : '',
          availableUnits: d.availableUnits ? String(d.availableUnits) : '',
          terrainZoningType: String(d.terrainDetails?.zoningType || ''),
          terrainMaxBuildHeight: String(d.terrainDetails?.maxBuildHeight || ''),
          terrainBuildPotential: String(d.terrainDetails?.buildPotential || ''),
          terrainUtilities,
        })
      } catch (err: any) {
        setLoadError(err?.message || 'Error cargando listado.')
      } finally {
        setLoadingData(false)
      }
    }

    loadListing()
  }, [listingId, accessChecking, accessDenied])

  function update<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleFeature(id: string) {
    setFeatures((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  function onFileSelect(files: FileList | null) {
    const incoming = Array.from(files || [])
    if (!incoming.length) return
    if (uploadedImages.length + incoming.length > 20) {
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

  function removeImage(url: string) {
    setUploadedImages((prev) => prev.filter((item) => item !== url))
    if (form.coverImage === url) setForm((prev) => ({ ...prev, coverImage: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (accessChecking || accessDenied) {
      setError(accessDenied || 'Validando permisos de edición...')
      return
    }

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
          action: 'update',
          id: listingId,
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
          maintenanceInfo: form.maintenanceInfo || undefined,
          deslindadoStatus: form.deslindadoStatus,
          furnishedStatus: form.furnishedStatus,
          hoaIncludedItems: form.hoaIncludedItems.split(',').map((i) => i.trim()).filter(Boolean),
          mlsOnly: form.mlsOnly,
          cobrokeCommissionPercent: form.cobrokeCommissionPercent ? Number(form.cobrokeCommissionPercent) : undefined,
          showingInstructions: form.showingInstructions || undefined,
          brokerNotes: form.brokerNotes || undefined,
          privateContactName: form.privateContactName || undefined,
          privateContactPhone: form.privateContactPhone || undefined,
          privateContactEmail: form.privateContactEmail || undefined,
          address: form.address || form.location || undefined,
          lat: form.lat ? Number(form.lat) : undefined,
          lng: form.lng ? Number(form.lng) : undefined,
          coverImage: form.coverImage || undefined,
          promoVideoUrl: form.promoVideoUrl || undefined,
          images: uploadedImages,
          features,
          inventoryMode: form.inventoryMode,
          totalUnits: form.totalUnits ? Number(form.totalUnits) : undefined,
          availableUnits: form.availableUnits ? Number(form.availableUnits) : undefined,
          terrainDetails:
            form.terrainZoningType || form.terrainMaxBuildHeight || form.terrainBuildPotential || form.terrainUtilities
              ? {
                  zoningType: form.terrainZoningType || undefined,
                  maxBuildHeight: form.terrainMaxBuildHeight || undefined,
                  buildPotential: form.terrainBuildPotential || undefined,
                  utilitiesAvailable: form.terrainUtilities.split(',').map((i) => i.trim()).filter(Boolean),
                }
              : undefined,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) {
        if (res.status === 401 || res.status === 403) {
          setError(
            String(
              json?.error ||
                'Tu cuenta no tiene permisos para editar este listado. Si ya fue aprobada, cierra sesión y vuelve a iniciar.'
            )
          )
          return
        }
        setError(json?.error || 'No se pudo actualizar el listado.')
        return
      }

      router.push(`/listing/${listingId}`)
    } catch (submitError: any) {
      setError(submitError?.message || 'No se pudo actualizar el listado.')
    } finally {
      setSaving(false)
    }
  }

  if (accessChecking) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600 text-sm">
        Validando permisos de edición...
      </main>
    )
  }

  if (accessDenied) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-amber-700">{accessDenied}</p>
        <div className="flex items-center gap-3">
          <Link href="/login?next=/dashboard/listings" className="px-4 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-semibold">Iniciar sesión</Link>
          <Link href="/dashboard/listings" className="text-sm text-[#0B2545] underline">Volver al workspace</Link>
        </div>
      </main>
    )
  }

  if (loadingData) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600 text-sm">
        Cargando listado...
      </main>
    )
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-red-600">{loadError}</p>
        <Link href="/dashboard/listings" className="text-sm text-[#0B2545] underline">Volver al workspace</Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Editar listado</h1>
              {listingDisplayId && (
                <p className="text-xs text-gray-500 mt-0.5">{listingDisplayId}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Link href={`/listing/${listingId}`} className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Ver publicación</Link>
              <Link href="/dashboard/listings" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Mis listados</Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Título</label>
                <input title="Título del listado" value={form.title} onChange={(e) => update('title', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Descripción</label>
                <textarea title="Descripción" value={form.description} onChange={(e) => update('description', e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Precio</label>
                <input title="Precio" value={form.price} onChange={(e) => update('price', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
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
                <input title="Ciudad" value={form.city} onChange={(e) => update('city', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Sector</label>
                <input title="Sector" value={form.neighborhood} onChange={(e) => update('neighborhood', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Ubicación textual</label>
                <input title="Ubicación textual" value={form.location} onChange={(e) => update('location', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
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
                <input title="Habitaciones" value={form.bedrooms} onChange={(e) => update('bedrooms', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Baños</label>
                <input title="Baños" value={form.bathrooms} onChange={(e) => update('bathrooms', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Área (m²)</label>
                <input title="Área" value={form.area} onChange={(e) => update('area', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Parqueos</label>
                <input title="Parqueos" value={form.parking} onChange={(e) => update('parking', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Estado</label>
                <select title="Estado" value={form.status} onChange={(e) => update('status', e.target.value as EditForm['status'])} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="active">Activo</option>
                  <option value="pending">Pendiente</option>
                  <option value="inactive">Inactivo</option>
                  <option value="sold">Vendido</option>
                  <option value="rented">Alquilado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Mantenimiento ({form.currency})</label>
                <input title="Mantenimiento" value={form.maintenanceFee} onChange={(e) => update('maintenanceFee', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Estado deslinde</label>
                <select title="Deslinde" value={form.deslindadoStatus} onChange={(e) => update('deslindadoStatus', e.target.value as EditForm['deslindadoStatus'])} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="desconocido">Desconocido</option>
                  <option value="deslindado">Deslindado</option>
                  <option value="en-proceso">En proceso</option>
                  <option value="sin-deslinde">Sin deslinde</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Amueblado</label>
                <select title="Amueblado" value={form.furnishedStatus} onChange={(e) => update('furnishedStatus', e.target.value as EditForm['furnishedStatus'])} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="sin-amueblar">Sin amueblar</option>
                  <option value="semi-amueblado">Semi-amueblado</option>
                  <option value="amueblado">Amueblado</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">HOA incluye (separado por comas)</label>
                <input title="HOA" value={form.hoaIncludedItems} onChange={(e) => update('hoaIncludedItems', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              {/* MLS Professional Data */}
              <div className="sm:col-span-2 rounded-lg border border-gray-200 p-3 bg-gray-50">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-700 font-medium">Datos MLS profesionales</label>
                  <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                    <input type="checkbox" checked={form.mlsOnly} onChange={(e) => update('mlsOnly', e.target.checked)} />
                    Solo MLS (no público)
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Co-broke comisión (%)</label>
                    <input title="Co-broke" value={form.cobrokeCommissionPercent} onChange={(e) => update('cobrokeCommissionPercent', e.target.value)} inputMode="decimal" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Contacto privado (nombre)</label>
                    <input title="Nombre contacto" value={form.privateContactName} onChange={(e) => update('privateContactName', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Contacto privado (teléfono)</label>
                    <input title="Teléfono contacto" value={form.privateContactPhone} onChange={(e) => update('privateContactPhone', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Contacto privado (email)</label>
                    <input title="Email contacto" value={form.privateContactEmail} onChange={(e) => update('privateContactEmail', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Instrucciones de showing</label>
                    <textarea title="Showing" value={form.showingInstructions} onChange={(e) => update('showingInstructions', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Notas privadas del broker</label>
                    <textarea title="Notas broker" value={form.brokerNotes} onChange={(e) => update('brokerNotes', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Información de mantenimiento</label>
                    <textarea title="Mantenimiento info" value={form.maintenanceInfo} onChange={(e) => update('maintenanceInfo', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              {/* Inventory / Project */}
              <div className="sm:col-span-2 rounded-lg border border-gray-200 p-3 bg-gray-50">
                <label className="text-xs text-gray-700 font-medium">Inventario / Proyecto</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Modo</label>
                    <select title="Modo" value={form.inventoryMode} onChange={(e) => update('inventoryMode', e.target.value as 'single' | 'project')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      <option value="single">Unidad única</option>
                      <option value="project">Proyecto multi-unidades</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Unidades totales</label>
                    <input title="Total" value={form.totalUnits} onChange={(e) => update('totalUnits', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Unidades disponibles</label>
                    <input title="Disponibles" value={form.availableUnits} onChange={(e) => update('availableUnits', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              {/* Terrain */}
              <div className="sm:col-span-2 rounded-lg border border-gray-200 p-3 bg-gray-50">
                <label className="text-xs text-gray-700 font-medium">Detalles de terreno / zonificación</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Tipo de zonificación</label>
                    <input title="Zonificación" value={form.terrainZoningType} onChange={(e) => update('terrainZoningType', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Altura máxima de construcción</label>
                    <input title="Altura max" value={form.terrainMaxBuildHeight} onChange={(e) => update('terrainMaxBuildHeight', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Potencial constructivo</label>
                    <input title="Potencial" value={form.terrainBuildPotential} onChange={(e) => update('terrainBuildPotential', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Servicios disponibles (coma)</label>
                    <input title="Servicios" value={form.terrainUtilities} onChange={(e) => update('terrainUtilities', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Dirección</label>
                <input title="Dirección" value={form.address} onChange={(e) => update('address', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Latitud</label>
                <input title="Latitud" value={form.lat} onChange={(e) => update('lat', e.target.value)} inputMode="decimal" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Longitud</label>
                <input title="Longitud" value={form.lng} onChange={(e) => update('lng', e.target.value)} inputMode="decimal" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              {/* Amenities */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-700 font-medium">Amenidades</label>
                  {features.length > 0 && (
                    <span className="text-[10px] text-[#00A676] font-medium">{features.length} seleccionada(s)</span>
                  )}
                </div>
                <div className="space-y-3">
                  {AMENITIES_CATEGORIES.map((cat) => (
                    <div key={cat.key} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <p className="text-[11px] font-semibold text-gray-700 mb-2">{cat.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleFeature(item.id)}
                            className={`px-2 py-1 rounded-md border text-xs transition-all ${
                              features.includes(item.id)
                                ? 'bg-[#00A676] border-[#00A676] text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-[#00A676]'
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
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">URL imagen principal</label>
                <input title="Cover" value={form.coverImage} onChange={(e) => update('coverImage', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div className="sm:col-span-2 rounded-lg border border-gray-200 p-3 bg-gray-50">
                <label className="block text-xs text-gray-600 mb-2">Galería de imágenes</label>
                {uploadedImages.length > 0 ? (
                  <div className="mb-3 space-y-1">
                    {uploadedImages.map((url) => (
                      <div key={url} className="flex items-center justify-between text-xs bg-white border border-gray-200 rounded px-2 py-1 gap-2">
                        <span className="truncate flex-1">{url}</span>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => update('coverImage', url)} className="text-[#0B2545] underline">Principal</button>
                          <button type="button" onClick={() => removeImage(url)} className="text-red-600 underline">Quitar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 items-center">
                  <input type="file" multiple accept="image/*" title="Subir imágenes" onChange={(e) => onFileSelect(e.target.files)} className="text-xs" />
                  <button type="button" onClick={uploadSelectedFiles} disabled={uploading} className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545] disabled:opacity-50">
                    {uploading ? 'Subiendo...' : 'Subir seleccionadas'}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Video promocional</label>
                <input title="Video" value={form.promoVideoUrl} onChange={(e) => update('promoVideoUrl', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            ) : null}

            <div className="flex items-center gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-medium disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <Link href="/dashboard/listings" className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Cancelar</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
