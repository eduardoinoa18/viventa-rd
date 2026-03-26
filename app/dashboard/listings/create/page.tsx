'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { uploadMultipleImages, validateImageFiles } from '@/lib/storageService'
import { mapOfficeQuotaIssue } from '@/lib/quotaUiMessages'

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
  imagesText: string
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

export default function CreateProfessionalListingPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [error, setError] = useState('')
  const [errorCta, setErrorCta] = useState<{ href: string; label: string } | null>(null)
  const [features, setFeatures] = useState<string[]>([])
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
    imagesText: '',
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

  const completion = useMemo(() => {
    const checks = [
      Boolean(form.title.trim()),
      Boolean(form.description.trim()),
      Boolean(form.price.trim()),
      Boolean(form.city.trim()),
      Boolean(form.neighborhood.trim()),
      Boolean(form.propertyType.trim()),
      Boolean(form.listingType.trim()),
      Boolean(form.bedrooms.trim()),
      Boolean(form.bathrooms.trim()),
      uploadedImages.length > 0 || Boolean(form.imagesText.trim()),
      features.length > 0,
    ]

    const score = Math.round((checks.filter(Boolean).length / checks.length) * 100)
    return {
      score,
      essentialsDone: checks.slice(0, 5).every(Boolean),
      mediaDone: checks[9],
      amenitiesDone: checks[10],
    }
  }, [features.length, form, uploadedImages.length])

  function applyTemplate(template: 'starter-home' | 'luxury-sea' | 'investor-rent' | 'project-preventa') {
    if (template === 'starter-home') {
      setForm((prev) => ({
        ...prev,
        title: prev.title || 'Apartamento familiar listo para mudarse',
        description: prev.description || 'Propiedad funcional, iluminada y con distribucion comoda para familia o pareja.',
        propertyType: 'apartment',
        listingType: 'sale',
        furnishedStatus: 'sin-amueblar',
      }))
      return
    }

    if (template === 'luxury-sea') {
      setForm((prev) => ({
        ...prev,
        title: prev.title || 'Penthouse de lujo con vista al mar',
        description: prev.description || 'Acabados premium, elevador privado y terraza panoramica para estilo de vida exclusivo.',
        propertyType: 'penthouse',
        listingType: 'sale',
        status: 'active',
      }))
      setFeatures((prev) => Array.from(new Set([...prev, 'ocean-view', 'pool', 'gym', 'security-24-7'])))
      return
    }

    if (template === 'investor-rent') {
      setForm((prev) => ({
        ...prev,
        title: prev.title || 'Unidad ideal para renta ejecutiva',
        description: prev.description || 'Excelente para flujo de caja con alta demanda en zona corporativa y servicios cercanos.',
        listingType: 'rent',
        mlsOnly: true,
        furnishedStatus: 'semi-amueblado',
      }))
      return
    }

    setForm((prev) => ({
      ...prev,
      title: prev.title || 'Proyecto en preventa con unidades escalables',
      description: prev.description || 'Proyecto residencial con plan de pagos, inventario por etapas y potencial de valorizacion.',
      propertyType: 'project',
      listingType: 'sale',
      inventoryMode: 'project',
      totalUnits: prev.totalUnits || '120',
      availableUnits: prev.availableUnits || '120',
    }))
  }

  function update<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleFeature(id: string) {
    setFeatures((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  function onFileSelect(files: FileList | null) {
    const incoming = Array.from(files || [])
    if (!incoming.length) return
    const total = uploadedImages.length + incoming.length
    if (total > 20) {
      setError('Máximo 20 imágenes por listado.')
      setErrorCta(null)
      return
    }
    const validation = validateImageFiles(incoming)
    if (!validation.valid) {
      setError(validation.errors[0] || 'Archivos inválidos')
      setErrorCta(null)
      return
    }
    setSelectedFiles(incoming)
    setError('')
    setErrorCta(null)
  }

  async function uploadSelectedFiles() {
    if (!selectedFiles.length) {
      setError('Selecciona imágenes antes de subir.')
      return
    }

    try {
      setUploading(true)
      setError('')
      setErrorCta(null)
      const folder = `listing_images/pro_${Date.now()}`
      const urls = await uploadMultipleImages(selectedFiles, folder)
      setUploadedImages((prev) => [...prev, ...urls])
      setSelectedFiles([])
      if (!form.coverImage && urls[0]) {
        setForm((prev) => ({ ...prev, coverImage: urls[0] }))
      }
    } catch (uploadError: any) {
      setError(uploadError?.message || 'No se pudieron subir las imágenes')
      setErrorCta(null)
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
    setErrorCta(null)

    if (!form.title || !form.description || !form.price || !form.city || !form.neighborhood) {
      setError('Completa título, descripción, precio, ciudad y sector.')
      setErrorCta(null)
      return
    }

    if ((form.lat && !form.lng) || (!form.lat && form.lng)) {
      setError('Si completas coordenadas, incluye latitud y longitud.')
      setErrorCta(null)
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
          maintenanceInfo: form.maintenanceInfo || undefined,
          deslindadoStatus: form.deslindadoStatus,
          furnishedStatus: form.furnishedStatus,
          hoaIncludedItems: form.hoaIncludedItems
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
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
          inventoryMode: form.inventoryMode,
          totalUnits: form.totalUnits ? Number(form.totalUnits) : undefined,
          availableUnits: form.availableUnits ? Number(form.availableUnits) : undefined,
          terrainDetails:
            form.terrainZoningType ||
            form.terrainMaxBuildHeight ||
            form.terrainBuildPotential ||
            form.terrainUtilities
              ? {
                  zoningType: form.terrainZoningType || undefined,
                  maxBuildHeight: form.terrainMaxBuildHeight || undefined,
                  buildPotential: form.terrainBuildPotential || undefined,
                  utilitiesAvailable: form.terrainUtilities
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                }
              : undefined,
          images: [
            ...uploadedImages,
            ...form.imagesText
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
          ],
          features,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) {
        const issue = mapOfficeQuotaIssue(json || {}, {
          context: 'listing',
          fallbackMessage: 'No se pudo crear el listado',
        })
        setError(issue.message)
        setErrorCta(issue.ctaHref && issue.ctaLabel ? { href: issue.ctaHref, label: issue.ctaLabel } : null)
        return
      }

      router.push(`/listing/${json.id}`)
    } catch (submitError: any) {
      setError(submitError?.message || 'No se pudo crear el listado')
      setErrorCta(null)
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
              <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Listing Studio Pro</h1>
              <p className="text-sm text-gray-600 mt-1">Flujo rapido estilo MLS, tropicalizado para RD y enfocado en conversion.</p>
            </div>
            <Link href="/dashboard/listings" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Ver mis listados</Link>
          </div>

          <div className="mb-4 rounded-xl border border-[#0B2545]/10 bg-gradient-to-r from-[#F7FAFF] to-[#ECFDF5] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#0B2545]">Barra de calidad del listado</p>
                <p className="text-xs text-gray-600">Mientras mas completa la ficha, mayor respuesta de clientes y brokers.</p>
              </div>
              <div className="inline-flex items-center rounded-full bg-[#0B2545] px-3 py-1 text-xs font-semibold text-white">
                {completion.score}% completo
              </div>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/80">
              <div className="h-full rounded-full bg-gradient-to-r from-[#0B2545] via-[#00A676] to-[#00A6A6] transition-all duration-500" style={{ width: `${completion.score}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className={`rounded-full px-2 py-1 border ${completion.essentialsDone ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-600'}`}>Datos base</span>
              <span className={`rounded-full px-2 py-1 border ${completion.mediaDone ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-600'}`}>Fotos y media</span>
              <span className={`rounded-full px-2 py-1 border ${completion.amenitiesDone ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-600'}`}>Amenidades</span>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-xs font-semibold text-[#0B2545] mb-2">Plantillas rapidas (dominican flow)</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => applyTemplate('starter-home')} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 hover:border-[#0B2545]">Primera vivienda</button>
              <button type="button" onClick={() => applyTemplate('luxury-sea')} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 hover:border-[#0B2545]">Lujo vista mar</button>
              <button type="button" onClick={() => applyTemplate('investor-rent')} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 hover:border-[#0B2545]">Inversion renta</button>
              <button type="button" onClick={() => applyTemplate('project-preventa')} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 hover:border-[#0B2545]">Proyecto preventa</button>
            </div>
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
                <select
                  title="Estado inicial del listado"
                  value={form.status}
                  onChange={(e) => update('status', e.target.value as CreateForm['status'])}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="active">Activo</option>
                  <option value="pending">Pendiente</option>
                  <option value="inactive">Inactivo</option>
                  <option value="sold">Vendido</option>
                  <option value="rented">Alquilado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Mantenimiento ({form.currency})</label>
                <input title="Costo de mantenimiento" placeholder="150" value={form.maintenanceFee} onChange={(e) => update('maintenanceFee', e.target.value)} inputMode="numeric" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Estado deslinde</label>
                <select title="Estado de deslinde" value={form.deslindadoStatus} onChange={(e) => update('deslindadoStatus', e.target.value as CreateForm['deslindadoStatus'])} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="desconocido">Desconocido</option>
                  <option value="deslindado">Deslindado</option>
                  <option value="en-proceso">En proceso</option>
                  <option value="sin-deslinde">Sin deslinde</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Amueblado</label>
                <select title="Estado amueblado" value={form.furnishedStatus} onChange={(e) => update('furnishedStatus', e.target.value as CreateForm['furnishedStatus'])} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="sin-amueblar">Sin amueblar</option>
                  <option value="semi-amueblado">Semi-amueblado</option>
                  <option value="amueblado">Amueblado</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">HOA incluye (separado por comas)</label>
                <input title="HOA incluye" value={form.hoaIncludedItems} onChange={(e) => update('hoaIncludedItems', e.target.value)} placeholder="Seguridad, piscina, gimnasio" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

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
                    <input title="Comisión co-broke" value={form.cobrokeCommissionPercent} onChange={(e) => update('cobrokeCommissionPercent', e.target.value)} placeholder="3" inputMode="decimal" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Contacto privado (nombre)</label>
                    <input title="Contacto privado nombre" value={form.privateContactName} onChange={(e) => update('privateContactName', e.target.value)} placeholder="Nombre" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Contacto privado (teléfono)</label>
                    <input title="Contacto privado teléfono" value={form.privateContactPhone} onChange={(e) => update('privateContactPhone', e.target.value)} placeholder="809..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Contacto privado (email)</label>
                    <input title="Contacto privado email" value={form.privateContactEmail} onChange={(e) => update('privateContactEmail', e.target.value)} placeholder="broker@..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Instrucciones de showing</label>
                    <textarea title="Instrucciones de showing" value={form.showingInstructions} onChange={(e) => update('showingInstructions', e.target.value)} rows={2} placeholder="Coordinar con 24h de antelación..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Notas privadas del broker</label>
                    <textarea title="Notas privadas" value={form.brokerNotes} onChange={(e) => update('brokerNotes', e.target.value)} rows={2} placeholder="Notas visibles solo para profesionales" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Información de mantenimiento</label>
                    <textarea
                      title="Información de mantenimiento"
                      value={form.maintenanceInfo}
                      onChange={(e) => update('maintenanceInfo', e.target.value)}
                      rows={2}
                      placeholder="Qué cubre, frecuencia y reglas de pago"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 rounded-lg border border-gray-200 p-3 bg-gray-50">
                <label className="text-xs text-gray-700 font-medium">Inventario / Proyecto</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Modo</label>
                    <select
                      title="Modo de inventario"
                      value={form.inventoryMode}
                      onChange={(e) => update('inventoryMode', e.target.value as 'single' | 'project')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="single">Unidad única</option>
                      <option value="project">Proyecto multi-unidades</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Unidades totales</label>
                    <input
                      title="Unidades totales"
                      value={form.totalUnits}
                      onChange={(e) => update('totalUnits', e.target.value)}
                      inputMode="numeric"
                      placeholder="120"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Unidades disponibles</label>
                    <input
                      title="Unidades disponibles"
                      value={form.availableUnits}
                      onChange={(e) => update('availableUnits', e.target.value)}
                      inputMode="numeric"
                      placeholder="95"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 rounded-lg border border-gray-200 p-3 bg-gray-50">
                <label className="text-xs text-gray-700 font-medium">Detalles de terreno / zonificación</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Tipo de zonificación</label>
                    <input
                      title="Tipo de zonificación"
                      value={form.terrainZoningType}
                      onChange={(e) => update('terrainZoningType', e.target.value)}
                      placeholder="Residencial R-3"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Altura máxima de construcción</label>
                    <input
                      title="Altura máxima"
                      value={form.terrainMaxBuildHeight}
                      onChange={(e) => update('terrainMaxBuildHeight', e.target.value)}
                      placeholder="8 niveles"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Potencial constructivo</label>
                    <input
                      title="Potencial constructivo"
                      value={form.terrainBuildPotential}
                      onChange={(e) => update('terrainBuildPotential', e.target.value)}
                      placeholder="Hasta 5,000 m2 vendibles"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Servicios disponibles (coma)</label>
                    <input
                      title="Servicios disponibles"
                      value={form.terrainUtilities}
                      onChange={(e) => update('terrainUtilities', e.target.value)}
                      placeholder="Agua, Energía, Alcantarillado"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
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

              {/* ─────────── AMENIDADES ─────────── */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-700 font-medium">Amenidades</label>
                  {features.length > 0 && (
                    <span className="text-[10px] text-[#00A676] font-medium">{features.length} seleccionada(s)</span>
                  )}
                </div>
                <div className="space-y-3">
                  {([
                    { key: 'interior', label: 'Interior', items: [{ id: 'ac', label: 'Aire Acondicionado' }, { id: 'furnished', label: 'Amueblado' }, { id: 'kitchen-equipped', label: 'Cocina Equipada' }, { id: 'walk-in-closet', label: 'Walk-in Closet' }, { id: 'laundry-room', label: 'Cuarto de Lavado' }, { id: 'maid-quarters', label: 'Cuarto de Servicio' }, { id: 'office', label: 'Oficina/Estudio' }, { id: 'fireplace', label: 'Chimenea' }, { id: 'high-ceilings', label: 'Techos Altos' }, { id: 'hardwood-floors', label: 'Pisos de Madera' }] },
                    { key: 'exterior', label: 'Exterior', items: [{ id: 'pool', label: 'Piscina' }, { id: 'garden', label: 'Jardín' }, { id: 'terrace', label: 'Terraza' }, { id: 'balcony', label: 'Balcón' }, { id: 'bbq-area', label: 'Área BBQ' }, { id: 'outdoor-kitchen', label: 'Cocina Exterior' }, { id: 'gazebo', label: 'Gazebo' }, { id: 'jacuzzi', label: 'Jacuzzi' }, { id: 'deck', label: 'Deck' }, { id: 'patio', label: 'Patio' }] },
                    { key: 'building', label: 'Edificio/Comunidad', items: [{ id: 'elevator', label: 'Ascensor' }, { id: 'gym', label: 'Gimnasio' }, { id: 'security-24-7', label: 'Seguridad 24/7' }, { id: 'concierge', label: 'Conserje' }, { id: 'playground', label: 'Parque Infantil' }, { id: 'social-area', label: 'Área Social' }, { id: 'party-room', label: 'Salón de Fiestas' }, { id: 'coworking', label: 'Coworking' }, { id: 'pet-friendly', label: 'Pet-Friendly' }, { id: 'spa', label: 'Spa' }, { id: 'tennis-court', label: 'Cancha de Tenis' }, { id: 'basketball-court', label: 'Cancha de Baloncesto' }] },
                    { key: 'parking', label: 'Parqueo', items: [{ id: 'covered-parking', label: 'Parqueo Techado' }, { id: 'garage', label: 'Garaje' }, { id: 'visitor-parking', label: 'Parqueo Visitantes' }, { id: 'electric-charger', label: 'Cargador Eléctrico' }] },
                    { key: 'views', label: 'Vistas', items: [{ id: 'ocean-view', label: 'Vista al Mar' }, { id: 'mountain-view', label: 'Vista a Montañas' }, { id: 'city-view', label: 'Vista a Ciudad' }, { id: 'golf-view', label: 'Vista a Campo Golf' }, { id: 'garden-view', label: 'Vista a Jardín' }, { id: 'pool-view', label: 'Vista a Piscina' }] },
                    { key: 'technology', label: 'Tecnología', items: [{ id: 'smart-home', label: 'Smart Home' }, { id: 'fiber-optic', label: 'Fibra Óptica' }, { id: 'solar-panels', label: 'Paneles Solares' }, { id: 'backup-generator', label: 'Planta Eléctrica' }, { id: 'water-cistern', label: 'Cisterna' }, { id: 'security-cameras', label: 'Cámaras de Seguridad' }, { id: 'alarm-system', label: 'Sistema de Alarma' }] },
                  ] as const).map((cat) => (
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

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p>{error}</p>
                {errorCta ? (
                  <div className="mt-2">
                    <Link href={errorCta.href} className="inline-flex text-sm font-medium text-red-800 underline">
                      {errorCta.label}
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}

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
