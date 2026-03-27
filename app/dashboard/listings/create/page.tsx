'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaSave } from 'react-icons/fa'
import { uploadMultipleImages, validateImageFiles } from '@/lib/storageService'
import { mapOfficeQuotaIssue } from '@/lib/quotaUiMessages'

const DRAFT_KEY = 'viventa_draft_create_v2'

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

const DEFAULT_FORM: CreateForm = {
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
}

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartamento', emoji: '🏢' },
  { value: 'house', label: 'Casa', emoji: '🏡' },
  { value: 'penthouse', label: 'Penthouse', emoji: '🌅' },
  { value: 'villa', label: 'Villa', emoji: '🏖️' },
  { value: 'office', label: 'Oficina', emoji: '💼' },
  { value: 'commercial', label: 'Comercial', emoji: '🏪' },
  { value: 'land', label: 'Solar', emoji: '🌿' },
  { value: 'project', label: 'Proyecto', emoji: '🏗️' },
]

const AMENITIES_CATEGORIES = [
  {
    key: 'interior',
    label: '🛋️ Interior',
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
      { id: 'hardwood-floors', label: 'Pisos de Madera' },
    ],
  },
  {
    key: 'exterior',
    label: '🌿 Exterior',
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
      { id: 'patio', label: 'Patio' },
    ],
  },
  {
    key: 'building',
    label: '🏢 Edificio',
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
      { id: 'tennis-court', label: 'Tenis' },
      { id: 'basketball-court', label: 'Baloncesto' },
    ],
  },
  {
    key: 'parking',
    label: '🚗 Parqueo',
    items: [
      { id: 'covered-parking', label: 'Techado' },
      { id: 'garage', label: 'Garaje' },
      { id: 'visitor-parking', label: 'Visitantes' },
      { id: 'electric-charger', label: 'Cargador EV' },
    ],
  },
  {
    key: 'views',
    label: '🌊 Vistas',
    items: [
      { id: 'ocean-view', label: 'Vista al Mar' },
      { id: 'mountain-view', label: 'Montañas' },
      { id: 'city-view', label: 'Ciudad' },
      { id: 'golf-view', label: 'Golf' },
      { id: 'garden-view', label: 'Jardín' },
      { id: 'pool-view', label: 'Piscina' },
    ],
  },
  {
    key: 'technology',
    label: '⚡ Tecnología',
    items: [
      { id: 'smart-home', label: 'Smart Home' },
      { id: 'fiber-optic', label: 'Fibra Óptica' },
      { id: 'solar-panels', label: 'Paneles Solares' },
      { id: 'backup-generator', label: 'Planta Eléctrica' },
      { id: 'water-cistern', label: 'Cisterna' },
      { id: 'security-cameras', label: 'Cámaras' },
      { id: 'alarm-system', label: 'Alarma' },
    ],
  },
]

const STEPS = [
  { label: 'Tipo', emoji: '🏠', desc: 'Tipo y operación' },
  { label: 'Lugar', emoji: '📍', desc: 'Ubicación y precio' },
  { label: 'Detalles', emoji: '📐', desc: 'Medidas y características' },
  { label: 'Media', emoji: '📸', desc: 'Fotos y amenidades' },
  { label: 'Pro', emoji: '📋', desc: 'Información profesional MLS' },
  { label: 'Publicar', emoji: '🚀', desc: 'Revisión y publicación' },
]

export default function CreateProfessionalListingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [draftSaved, setDraftSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [error, setError] = useState('')
  const [errorCta, setErrorCta] = useState<{ href: string; label: string } | null>(null)
  const [features, setFeatures] = useState<string[]>([])
  const [form, setForm] = useState<CreateForm>(DEFAULT_FORM)
  const [showAdvancedCoords, setShowAdvancedCoords] = useState(false)

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        if (d.form) setForm((prev) => ({ ...prev, ...d.form }))
        if (Array.isArray(d.features)) setFeatures(d.features)
        if (Array.isArray(d.uploadedImages)) setUploadedImages(d.uploadedImages)
      }
    } catch {
      // ignore malformed draft
    }
  }, [])

  // Autosave draft with debounce
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, features, uploadedImages }))
      setDraftSaved(true)
      const t2 = setTimeout(() => setDraftSaved(false), 1800)
      return () => clearTimeout(t2)
    }, 700)
    return () => clearTimeout(t)
  }, [form, features, uploadedImages])

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

  function update<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleFeature(id: string) {
    setFeatures((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  function applyTemplate(template: 'starter-home' | 'luxury-sea' | 'investor-rent' | 'project-preventa') {
    if (template === 'starter-home') {
      setForm((prev) => ({
        ...prev,
        title: prev.title || 'Apartamento familiar listo para mudarse',
        description: prev.description || 'Propiedad funcional, iluminada y con distribución cómoda para familia o pareja. Todo listo para entrar.',
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
        description: prev.description || 'Acabados premium, elevador privado y terraza panorámica. Estilo de vida exclusivo frente al Caribe.',
        propertyType: 'penthouse',
        listingType: 'sale',
        status: 'active',
      }))
      setFeatures((prev) => Array.from(new Set([...prev, 'ocean-view', 'pool', 'gym', 'security-24-7', 'elevator', 'concierge'])))
      return
    }
    if (template === 'investor-rent') {
      setForm((prev) => ({
        ...prev,
        title: prev.title || 'Unidad ideal para renta ejecutiva',
        description: prev.description || 'Excelente flujo de caja con alta demanda en zona corporativa. Ideal para inversión con retorno rápido.',
        listingType: 'rent',
        mlsOnly: true,
        furnishedStatus: 'semi-amueblado',
      }))
      return
    }
    setForm((prev) => ({
      ...prev,
      title: prev.title || 'Proyecto en preventa — unidades desde planos',
      description: prev.description || 'Proyecto residencial con plan de pagos flexible, inventario por etapas y alto potencial de valorización.',
      propertyType: 'project',
      listingType: 'sale',
      inventoryMode: 'project',
      totalUnits: prev.totalUnits || '120',
      availableUnits: prev.availableUnits || '120',
    }))
  }

  function canAdvance(): boolean {
    if (currentStep === 0) return Boolean(form.propertyType && form.listingType && form.title.trim())
    if (currentStep === 1) return Boolean(form.price.trim() && form.city.trim() && form.neighborhood.trim())
    return true
  }

  function nextStep() {
    if (currentStep < STEPS.length - 1) {
      if (!canAdvance()) {
        if (currentStep === 0) setError('Escribe el título del listado para continuar.')
        else if (currentStep === 1) setError('Completa precio, ciudad y sector.')
        return
      }
      setError('')
      setCurrentStep((s) => s + 1)
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      setError('')
      setCurrentStep((s) => s - 1)
    }
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
      if (!form.coverImage && urls[0]) update('coverImage', urls[0])
    } catch (err: any) {
      setError(err?.message || 'No se pudieron subir las imágenes')
    } finally {
      setUploading(false)
    }
  }

  function removeUploadedImage(url: string) {
    setUploadedImages((prev) => prev.filter((u) => u !== url))
    if (form.coverImage === url) update('coverImage', '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setErrorCta(null)

    if (!form.title || !form.description || !form.price || !form.city || !form.neighborhood) {
      setError('Faltan campos esenciales: título, descripción, precio, ciudad y sector.')
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
          maintenanceInfo: form.maintenanceInfo || undefined,
          deslindadoStatus: form.deslindadoStatus,
          furnishedStatus: form.furnishedStatus,
          hoaIncludedItems: form.hoaIncludedItems
            .split(',')
            .map((i) => i.trim())
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
            form.terrainZoningType || form.terrainMaxBuildHeight || form.terrainBuildPotential || form.terrainUtilities
              ? {
                  zoningType: form.terrainZoningType || undefined,
                  maxBuildHeight: form.terrainMaxBuildHeight || undefined,
                  buildPotential: form.terrainBuildPotential || undefined,
                  utilitiesAvailable: form.terrainUtilities
                    .split(',')
                    .map((i) => i.trim())
                    .filter(Boolean),
                }
              : undefined,
          images: [
            ...uploadedImages,
            ...form.imagesText
              .split(',')
              .map((i) => i.trim())
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

      localStorage.removeItem(DRAFT_KEY)
      router.push(`/listing/${json.id}`)
    } catch (err: any) {
      setError(err?.message || 'No se pudo crear el listado')
    } finally {
      setSaving(false)
    }
  }

  const previewPrice = form.price
    ? form.currency === 'USD'
      ? `$${Number(form.price).toLocaleString()} USD`
      : `RD$${Number(form.price).toLocaleString()}`
    : null

  const propTypeLabel = PROPERTY_TYPES.find((t) => t.value === form.propertyType)

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#EEF3FA] to-gray-100 pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545] tracking-tight">Listing Studio Pro</h1>
            <p className="text-xs text-gray-500 mt-0.5">Flujo MLS tropicalizado — borrador auto-guardado</p>
          </div>
          <div className="flex items-center gap-3">
            {draftSaved && (
              <span className="flex items-center gap-1 text-xs text-[#00A676] animate-fade-in font-medium">
                <FaSave className="w-3 h-3" /> Borrador guardado
              </span>
            )}
            <Link
              href="/dashboard/listings"
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-[#0B2545] hover:border-[#0B2545] transition-colors"
            >
              ← Mis listados
            </Link>
          </div>
        </div>

        {/* ── Step Progress ── */}
        <div className="mb-5">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 right-0 top-[18px] h-0.5 bg-gray-200 z-0" />
            <div
              className="absolute left-0 top-[18px] h-0.5 bg-gradient-to-r from-[#0B2545] to-[#00A676] z-0 transition-all duration-500"
              style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((step, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => idx < currentStep && setCurrentStep(idx)}
                disabled={idx > currentStep}
                className="relative z-10 flex flex-col items-center gap-1"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition-all duration-300 shadow-sm
                    ${idx < currentStep ? 'bg-[#00A676] border-[#00A676] text-white' : ''}
                    ${idx === currentStep ? 'bg-[#0B2545] border-[#0B2545] text-white scale-110 shadow-md' : ''}
                    ${idx > currentStep ? 'bg-white border-gray-200 text-gray-400' : ''}`}
                >
                  {idx < currentStep ? '✓' : step.emoji}
                </div>
                <span
                  className={`hidden sm:block text-[10px] font-medium transition-colors
                    ${idx === currentStep ? 'text-[#0B2545]' : idx < currentStep ? 'text-[#00A676]' : 'text-gray-400'}`}
                >
                  {step.label}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">{STEPS[currentStep].desc}</p>
        </div>

        {/* ── Quality Bar ── */}
        <div className="mb-5 flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2.5">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 font-medium">Calidad del listado</span>
              <span className="text-xs font-bold text-[#0B2545]">{completion.score}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0B2545] via-[#00A676] to-[#00A6A6] transition-all duration-700"
                style={{ width: `${completion.score}%` }}
              />
            </div>
          </div>
          <div className="flex gap-1.5 text-[10px] shrink-0">
            <span className={`px-2 py-0.5 rounded-full border font-medium ${completion.essentialsDone ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
              ✓ Base
            </span>
            <span className={`px-2 py-0.5 rounded-full border font-medium ${completion.mediaDone ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
              📸 Fotos
            </span>
            <span className={`px-2 py-0.5 rounded-full border font-medium ${completion.amenitiesDone ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
              ⭐ Amenidades
            </span>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">

          {/* Form column */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>

              {/* Animated step panel */}
              <div
                key={currentStep}
                className="animate-step-in bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6"
              >

                {/* ══ STEP 0: Tipo y Operación ══ */}
                {currentStep === 0 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-base font-bold text-[#0B2545]">¿Qué estás publicando?</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Tipo de propiedad, operación y descripción principal.</p>
                    </div>

                    {/* Quick templates */}
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Plantillas rápidas — Dominican Flow</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { key: 'starter-home', label: '🏠 Primera vivienda', desc: 'Familiar, venta' },
                          { key: 'luxury-sea', label: '🌊 Lujo vista mar', desc: 'Penthouse, premium' },
                          { key: 'investor-rent', label: '💰 Inversión renta', desc: 'MLS, ejecutiva' },
                          { key: 'project-preventa', label: '🏗️ Proyecto preventa', desc: 'Multi-unidades' },
                        ].map((t) => (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => applyTemplate(t.key as 'starter-home' | 'luxury-sea' | 'investor-rent' | 'project-preventa')}
                            className="flex flex-col items-start p-3 rounded-xl border border-gray-200 hover:border-[#00A676] hover:bg-[#ECFDF5] text-left transition-all group"
                          >
                            <span className="text-xs font-bold text-[#0B2545] group-hover:text-[#00A676] leading-tight">{t.label}</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">{t.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Property type visual grid */}
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo de propiedad</p>
                      <div className="grid grid-cols-4 gap-2">
                        {PROPERTY_TYPES.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => update('propertyType', t.value)}
                            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-200
                              ${form.propertyType === t.value
                                ? 'border-[#0B2545] bg-[#0B2545] text-white shadow-md scale-[1.04]'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-[#0B2545]/40 hover:bg-gray-50'}`}
                          >
                            <span className="text-2xl">{t.emoji}</span>
                            <span className="text-[10px] font-semibold leading-tight text-center">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sale vs Rent */}
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Operación</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'sale', label: '🏷️ Venta', desc: 'Transferencia de dominio' },
                          { value: 'rent', label: '🔑 Alquiler', desc: 'Arrendamiento mensual' },
                        ].map((op) => (
                          <button
                            key={op.value}
                            type="button"
                            onClick={() => update('listingType', op.value as 'sale' | 'rent')}
                            className={`flex flex-col p-4 rounded-xl border-2 text-left transition-all duration-200
                              ${form.listingType === op.value
                                ? 'border-[#00A676] bg-[#ECFDF5] shadow-sm scale-[1.01]'
                                : 'border-gray-200 bg-white hover:border-[#00A676]/40'}`}
                          >
                            <span className="text-sm font-bold text-[#0B2545]">{op.label}</span>
                            <span className="text-[11px] text-gray-500 mt-0.5">{op.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Título del listado *</label>
                        <input
                          value={form.title}
                          onChange={(e) => update('title', e.target.value)}
                          placeholder="Ej: Penthouse moderno con vista panorámica en Piantini"
                          maxLength={120}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/10 outline-none transition-colors"
                        />
                        <p className="text-[10px] text-gray-400 mt-1 text-right">{form.title.length}/120</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción *</label>
                        <textarea
                          value={form.description}
                          onChange={(e) => update('description', e.target.value)}
                          placeholder="Describe lo que hace especial esta propiedad: acabados, entorno, acceso, beneficios exclusivos..."
                          rows={4}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/10 outline-none transition-colors resize-none"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">{form.description.length} caracteres · mínimo sugerido: 150</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Estado inicial</label>
                      <select
                        value={form.status}
                        onChange={(e) => update('status', e.target.value as CreateForm['status'])}
                        className="w-full sm:w-48 px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"
                      >
                        <option value="active">Activo</option>
                        <option value="pending">Pendiente</option>
                        <option value="inactive">Inactivo</option>
                        <option value="sold">Vendido</option>
                        <option value="rented">Alquilado</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ══ STEP 1: Ubicación y Precio ══ */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-base font-bold text-[#0B2545]">Ubicación y precio</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Los campos con * son requeridos.</p>
                    </div>

                    <div className="rounded-2xl border border-[#0B2545]/10 bg-[#F7FAFF] p-4">
                      <p className="text-[11px] font-bold text-[#0B2545] uppercase tracking-wide mb-3">💰 Precio</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Precio *</label>
                          <input
                            value={form.price}
                            onChange={(e) => update('price', e.target.value)}
                            placeholder="250,000"
                            inputMode="numeric"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:border-[#0B2545] outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Moneda</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['USD', 'DOP'] as const).map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => update('currency', c)}
                                className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all duration-200
                                  ${form.currency === c ? 'border-[#0B2545] bg-[#0B2545] text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-[#0B2545]/40'}`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Mantenimiento ({form.currency})</label>
                          <input
                            value={form.maintenanceFee}
                            onChange={(e) => update('maintenanceFee', e.target.value)}
                            placeholder="150"
                            inputMode="numeric"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-3">📍 Ubicación</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Ciudad *</label>
                          <input
                            value={form.city}
                            onChange={(e) => update('city', e.target.value)}
                            placeholder="Santo Domingo"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#0B2545] outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Sector *</label>
                          <input
                            value={form.neighborhood}
                            onChange={(e) => update('neighborhood', e.target.value)}
                            placeholder="Piantini"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#0B2545] outline-none bg-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Referencia textual</label>
                          <input
                            value={form.location}
                            onChange={(e) => update('location', e.target.value)}
                            placeholder="Naco, Santo Domingo, cerca del metro"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Dirección física (opcional)</label>
                          <input
                            value={form.address}
                            onChange={(e) => update('address', e.target.value)}
                            placeholder="Calle 45 No. 12, Edificio Torres del Mar"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setShowAdvancedCoords(!showAdvancedCoords)}
                        className="text-xs text-[#0B2545] underline hover:text-[#00A676] transition-colors"
                      >
                        {showAdvancedCoords ? '▲ Ocultar coordenadas GPS' : '▼ Agregar coordenadas GPS (avanzado)'}
                      </button>
                      {showAdvancedCoords && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Latitud</label>
                            <input
                              value={form.lat}
                              onChange={(e) => update('lat', e.target.value)}
                              placeholder="18.4861"
                              inputMode="decimal"
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Longitud</label>
                            <input
                              value={form.lng}
                              onChange={(e) => update('lng', e.target.value)}
                              placeholder="-69.9312"
                              inputMode="decimal"
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ══ STEP 2: Detalles y Medidas ══ */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-base font-bold text-[#0B2545]">Detalles y medidas</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Cuartos, áreas, estado legal y características adicionales.</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Especificaciones principales</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { key: 'bedrooms', emoji: '🛏', label: 'Cuartos', placeholder: '3' },
                          { key: 'bathrooms', emoji: '🚿', label: 'Baños', placeholder: '2' },
                          { key: 'area', emoji: '📐', label: 'm²', placeholder: '120' },
                          { key: 'parking', emoji: '🚗', label: 'Parqueos', placeholder: '2' },
                        ].map((f) => (
                          <div key={f.key} className="flex flex-col items-center">
                            <span className="text-lg mb-1">{f.emoji}</span>
                            <label className="text-[10px] font-medium text-gray-500 mb-1">{f.label}</label>
                            <input
                              value={(form as any)[f.key]}
                              onChange={(e) => update(f.key as keyof CreateForm, e.target.value)}
                              placeholder={f.placeholder}
                              inputMode="numeric"
                              className="w-full px-2 py-2.5 border border-gray-200 rounded-xl text-sm text-center font-bold focus:border-[#0B2545] outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Deslinde</label>
                        <select
                          value={form.deslindadoStatus}
                          onChange={(e) => update('deslindadoStatus', e.target.value as CreateForm['deslindadoStatus'])}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"
                        >
                          <option value="desconocido">Desconocido</option>
                          <option value="deslindado">✅ Deslindado</option>
                          <option value="en-proceso">⏳ En proceso</option>
                          <option value="sin-deslinde">❌ Sin deslinde</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Amueblado</label>
                        <select
                          value={form.furnishedStatus}
                          onChange={(e) => update('furnishedStatus', e.target.value as CreateForm['furnishedStatus'])}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"
                        >
                          <option value="sin-amueblar">Sin amueblar</option>
                          <option value="semi-amueblado">Semi-amueblado</option>
                          <option value="amueblado">Amueblado completo</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">HOA incluye (separado por comas)</label>
                      <input
                        value={form.hoaIncludedItems}
                        onChange={(e) => update('hoaIncludedItems', e.target.value)}
                        placeholder="Seguridad, piscina, gimnasio, agua"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Información de mantenimiento</label>
                      <textarea
                        value={form.maintenanceInfo}
                        onChange={(e) => update('maintenanceInfo', e.target.value)}
                        rows={2}
                        placeholder="Qué cubre, frecuencia y condiciones de pago"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none outline-none"
                      />
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-3">🏗️ Inventario / Proyecto</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Modo</label>
                          <select
                            value={form.inventoryMode}
                            onChange={(e) => update('inventoryMode', e.target.value as 'single' | 'project')}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none bg-white"
                          >
                            <option value="single">Unidad única</option>
                            <option value="project">Proyecto multi-unidades</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Unidades totales</label>
                          <input
                            value={form.totalUnits}
                            onChange={(e) => update('totalUnits', e.target.value)}
                            placeholder="120"
                            inputMode="numeric"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Unidades disponibles</label>
                          <input
                            value={form.availableUnits}
                            onChange={(e) => update('availableUnits', e.target.value)}
                            placeholder="95"
                            inputMode="numeric"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {(form.propertyType === 'land' || form.propertyType === 'project') && (
                      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                        <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wide mb-3">🌿 Terreno y zonificación</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Tipo de zonificación</label>
                            <input
                              value={form.terrainZoningType}
                              onChange={(e) => update('terrainZoningType', e.target.value)}
                              placeholder="Residencial R-3"
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Altura máx. de construcción</label>
                            <input
                              value={form.terrainMaxBuildHeight}
                              onChange={(e) => update('terrainMaxBuildHeight', e.target.value)}
                              placeholder="8 niveles"
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Potencial constructivo</label>
                            <input
                              value={form.terrainBuildPotential}
                              onChange={(e) => update('terrainBuildPotential', e.target.value)}
                              placeholder="Hasta 5,000 m² vendibles"
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Servicios disponibles</label>
                            <input
                              value={form.terrainUtilities}
                              onChange={(e) => update('terrainUtilities', e.target.value)}
                              placeholder="Agua, Energía, Alcantarillado"
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ══ STEP 3: Amenidades y Media ══ */}
                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-base font-bold text-[#0B2545]">Fotos y amenidades</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Los listados con fotos reciben 3× más consultas.</p>
                    </div>

                    <div className="rounded-2xl border-2 border-dashed border-[#0B2545]/20 bg-[#F7FAFF] p-4">
                      <p className="text-[11px] font-bold text-[#0B2545] uppercase tracking-wide mb-3">📸 Galería</p>
                      <div className="flex flex-wrap gap-2 items-center mb-3">
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
                          disabled={uploading || !selectedFiles.length}
                          className="px-3 py-2 rounded-lg bg-[#0B2545] text-white text-xs font-semibold disabled:opacity-40 hover:bg-[#0B2545]/90 transition-colors"
                        >
                          {uploading ? '⏳ Subiendo...' : '⬆️ Subir imágenes'}
                        </button>
                        {selectedFiles.length > 0 && (
                          <span className="text-xs text-[#00A676] font-medium">{selectedFiles.length} archivo(s)</span>
                        )}
                      </div>
                      {uploadedImages.length > 0 && (
                        <div className="space-y-1.5">
                          {uploadedImages.map((url) => (
                            <div key={url} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2 gap-2">
                              <span className="text-[11px] text-gray-600 truncate flex-1">{url}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                {form.coverImage === url ? (
                                  <span className="text-[10px] text-[#00A676] font-bold">✓ Portada</span>
                                ) : (
                                  <button type="button" onClick={() => update('coverImage', url)} className="text-[10px] text-[#0B2545] underline">
                                    Portada
                                  </button>
                                )}
                                <button type="button" onClick={() => removeUploadedImage(url)} className="text-[10px] text-red-500 underline">
                                  Quitar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">URL imagen de portada</label>
                      <input
                        value={form.coverImage}
                        onChange={(e) => update('coverImage', e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">URLs de imágenes adicionales (coma)</label>
                      <textarea
                        value={form.imagesText}
                        onChange={(e) => update('imagesText', e.target.value)}
                        rows={2}
                        placeholder="https://img1.com/foto.jpg, https://img2.com/foto.jpg"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">🎬 Video promocional (YouTube/Vimeo)</label>
                      <input
                        value={form.promoVideoUrl}
                        onChange={(e) => update('promoVideoUrl', e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-bold text-[#0B2545] uppercase tracking-wide">⭐ Amenidades</p>
                        {features.length > 0 && (
                          <span className="text-xs bg-[#00A676] text-white px-2 py-0.5 rounded-full font-semibold">
                            {features.length} seleccionadas
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {AMENITIES_CATEGORIES.map((cat) => (
                          <div key={cat.key} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                            <p className="text-[11px] font-bold text-gray-700 mb-2">{cat.label}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {cat.items.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => toggleFeature(item.id)}
                                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all duration-150
                                    ${features.includes(item.id)
                                      ? 'bg-[#00A676] border-[#00A676] text-white shadow-sm scale-[1.03]'
                                      : 'bg-white border-gray-200 text-gray-700 hover:border-[#00A676]/60'}`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ══ STEP 4: MLS y Profesionales ══ */}
                {currentStep === 4 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-base font-bold text-[#0B2545]">Información profesional MLS</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Visible solo para brokers, agentes y el equipo de VIVENTA.</p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F7FAFF] border border-[#0B2545]/10">
                      <div>
                        <p className="text-sm font-bold text-[#0B2545]">Solo MLS — no público</p>
                        <p className="text-xs text-gray-500">Solo visible para profesionales verificados</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.mlsOnly}
                          onChange={(e) => update('mlsOnly', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B2545]" />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Co-broke comisión (%)</label>
                        <input
                          value={form.cobrokeCommissionPercent}
                          onChange={(e) => update('cobrokeCommissionPercent', e.target.value)}
                          placeholder="3"
                          inputMode="decimal"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Contacto privado</label>
                        <input
                          value={form.privateContactName}
                          onChange={(e) => update('privateContactName', e.target.value)}
                          placeholder="Nombre del contacto"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono privado</label>
                        <input
                          value={form.privateContactPhone}
                          onChange={(e) => update('privateContactPhone', e.target.value)}
                          placeholder="809-555-0000"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Email privado</label>
                        <input
                          value={form.privateContactEmail}
                          onChange={(e) => update('privateContactEmail', e.target.value)}
                          placeholder="broker@inmobiliaria.com"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Instrucciones de showing</label>
                      <textarea
                        value={form.showingInstructions}
                        onChange={(e) => update('showingInstructions', e.target.value)}
                        rows={2}
                        placeholder="Coordinar con 24h de antelación. Acceso por portería principal..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Notas privadas del broker</label>
                      <textarea
                        value={form.brokerNotes}
                        onChange={(e) => update('brokerNotes', e.target.value)}
                        rows={3}
                        placeholder="Motivación del vendedor, historial de negociaciones, oportunidad de precio..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* ══ STEP 5: Publicar ══ */}
                {currentStep === 5 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-base font-bold text-[#0B2545]">🚀 Revisión y publicación</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Verifica el resumen antes de publicar.</p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
                      <div className="flex items-start gap-3 p-4">
                        {form.coverImage ? (
                          <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={form.coverImage} alt="portada" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-20 h-16 rounded-xl bg-gray-200 shrink-0 flex items-center justify-center text-2xl">📸</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#0B2545] leading-tight">{form.title || '(sin título)'}</p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            📍 {[form.neighborhood, form.city].filter(Boolean).join(', ') || '(sin ubicación)'}
                          </p>
                          {previewPrice && <p className="text-base font-bold text-[#00A676] mt-1">{previewPrice}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 border-t border-gray-100 divide-x divide-gray-100 text-xs text-center">
                        {[
                          { label: 'Cuartos', val: form.bedrooms || '—' },
                          { label: 'Baños', val: form.bathrooms || '—' },
                          { label: 'm²', val: form.area || '—' },
                          { label: 'Fotos', val: String(uploadedImages.length) },
                        ].map((c) => (
                          <div key={c.label} className="py-3">
                            <p className="font-bold text-[#0B2545]">{c.val}</p>
                            <p className="text-gray-400">{c.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${completion.score >= 70 ? 'bg-[#00A676]' : 'bg-amber-400'}`} />
                        <span className="text-xs text-gray-700">
                          Calidad: <strong>{completion.score}%</strong>
                        </span>
                        {completion.score >= 80 && <span className="text-[10px] text-[#00A676] font-bold ml-1">🔥 Excelente — va a tener mucha respuesta</span>}
                        {completion.score >= 60 && completion.score < 80 && (
                          <span className="text-[10px] text-amber-600 font-medium ml-1">Bueno — agrega fotos para más respuesta</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { done: Boolean(form.title.trim()), label: 'Título' },
                        { done: Boolean(form.description.trim()), label: 'Descripción' },
                        { done: Boolean(form.price.trim()), label: 'Precio' },
                        { done: Boolean(form.city.trim()), label: 'Ciudad' },
                        { done: Boolean(form.neighborhood.trim()), label: 'Sector' },
                        { done: uploadedImages.length > 0 || Boolean(form.imagesText.trim()), label: 'Al menos 1 foto' },
                        { done: features.length > 0, label: 'Amenidades' },
                        { done: Boolean(form.area.trim()), label: 'Área m²' },
                      ].map((c) => (
                        <div key={c.label} className="flex items-center gap-1.5 text-xs">
                          <span className={c.done ? 'text-[#00A676] font-bold' : 'text-red-400'}>{c.done ? '✓' : '✗'}</span>
                          <span className={c.done ? 'text-gray-600' : 'text-red-500 font-medium'}>{c.label}</span>
                        </div>
                      ))}
                    </div>

                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <p>{error}</p>
                        {errorCta && (
                          <Link href={errorCta.href} className="mt-2 inline-flex text-sm font-medium text-red-800 underline">
                            {errorCta.label}
                          </Link>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={saving || !completion.essentialsDone}
                        className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#0B2545] via-[#134074] to-[#00A676] text-white font-bold text-sm tracking-wide disabled:opacity-40 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                      >
                        {saving ? '⏳ Publicando...' : '🚀 Publicar listado'}
                      </button>
                      <Link
                        href="/dashboard/listings"
                        className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-[#0B2545] text-center hover:border-[#0B2545] transition-colors"
                      >
                        Cancelar
                      </Link>
                    </div>

                    {!completion.essentialsDone && (
                      <p className="text-xs text-center text-amber-600">
                        Regresa a pasos anteriores para completar los campos marcados con ✗.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ── Step navigation buttons ── */}
              <div className="flex items-center justify-between mt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-30 hover:border-[#0B2545] transition-colors"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-gray-400 font-medium">
                  {currentStep + 1} / {STEPS.length}
                </span>
                {currentStep < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B2545] text-white text-sm font-bold hover:bg-[#0B2545]/90 transition-colors shadow-sm"
                  >
                    Siguiente →
                  </button>
                ) : (
                  <div className="w-28" />
                )}
              </div>

              {currentStep < STEPS.length - 1 && error && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* ── Desktop Live Preview ── */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#0B2545] to-[#134074] px-4 py-3">
                  <p className="text-xs font-bold text-white">Vista previa</p>
                  <p className="text-[10px] text-white/60">Así lo verán los compradores</p>
                </div>

                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {form.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.coverImage} alt="portada" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300">
                      <span className="text-4xl">📸</span>
                      <p className="text-xs">Sin portada aún</p>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                    {form.listingType && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          form.listingType === 'sale' ? 'bg-[#0B2545] text-white' : 'bg-[#00A676] text-white'
                        }`}
                      >
                        {form.listingType === 'sale' ? 'EN VENTA' : 'EN ALQUILER'}
                      </span>
                    )}
                    {propTypeLabel && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-[#0B2545]">
                        {propTypeLabel.emoji} {propTypeLabel.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 space-y-1.5">
                  <p className="text-xs font-bold text-[#0B2545] leading-tight line-clamp-2 min-h-[32px]">
                    {form.title || <span className="text-gray-300 italic font-normal">Título del listado...</span>}
                  </p>
                  {previewPrice && <p className="text-base font-bold text-[#00A676]">{previewPrice}</p>}
                  {(form.city || form.neighborhood) && (
                    <p className="text-[11px] text-gray-500">
                      📍 {[form.neighborhood, form.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-gray-600">
                    {form.bedrooms && form.bedrooms !== '0' && <span>🛏 {form.bedrooms}</span>}
                    {form.bathrooms && form.bathrooms !== '0' && <span>🚿 {form.bathrooms}</span>}
                    {form.area && <span>📐 {form.area}m²</span>}
                    {form.parking && form.parking !== '0' && <span>🚗 {form.parking}</span>}
                  </div>
                  {features.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {features.slice(0, 5).map((f) => (
                        <span key={f} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">
                          {AMENITIES_CATEGORIES.flatMap((c) => c.items).find((i) => i.id === f)?.label ?? f}
                        </span>
                      ))}
                      {features.length > 5 && <span className="text-[9px] text-gray-400">+{features.length - 5}</span>}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 px-3 py-2">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-gray-500">Calidad del listado</span>
                    <span className={`font-bold ${completion.score >= 70 ? 'text-[#00A676]' : 'text-amber-500'}`}>{completion.score}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0B2545] to-[#00A676] transition-all duration-700"
                      style={{ width: `${completion.score}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-[#0B2545]/5 border border-[#0B2545]/10 p-3">
                <p className="text-[11px] font-semibold text-[#0B2545]">{STEPS[currentStep].emoji} {STEPS[currentStep].desc}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {currentStep === 0 && 'Un buen título aumenta clics en 40%. Sé específico y atractivo.'}
                  {currentStep === 1 && 'El precio y el sector son los filtros #1 en búsquedas.'}
                  {currentStep === 2 && 'El área m² y los cuartos son esenciales para aparecer en filtros.'}
                  {currentStep === 3 && 'Las propiedades con 5+ fotos reciben 3× más consultas.'}
                  {currentStep === 4 && 'Los brokers co-broke generan el 30% de las ventas en RD.'}
                  {currentStep === 5 && 'Revisa todo antes de publicar. Puedes editar después.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
