'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, serverTimestamp, doc, runTransaction, query, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebaseClient'
import { getSession, type UserSession } from '@/lib/authSession'
import {
  FiUpload,
  FiX,
  FiImage,
  FiMapPin,
  FiHome,
  FiDollarSign,
  FiSave,
  FiArrowLeft,
  FiFolder,
  FiTrash2,
  FiEdit,
  FiFile,
  FiShield
} from 'react-icons/fi'
import toast from 'react-hot-toast'

type ListingFile = {
  id: string
  name: string
  type: 'floor-plan' | 'disclosure' | 'hoa-docs' | 'inspection' | 'other'
  visibility: 'public' | 'agents-only' | 'private'
  file: File
  url?: string
}

export default function CreateListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [agent, setAgent] = useState<UserSession | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const [showDrafts, setShowDrafts] = useState(false)
  const [drafts, setDrafts] = useState<Array<{ id: string; title?: string; updatedAt: number; createdAt: number; completion: number }>>([])
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
  const [documents, setDocuments] = useState<ListingFile[]>([])
  const [uploadingDocs, setUploadingDocs] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    description: '',
    descriptionEn: '',
    propertyType: 'apartment',
    listingType: 'sale',
    price: '',
    currency: 'USD',
    bedrooms: '',
    bathrooms: '',
    parkingSpaces: '',
    area: '',
    lotSize: '',
    yearBuilt: '',
    city: '',
    neighborhood: '',
    address: '',
    latitude: '',
    longitude: '',
    features: [] as string[],
    // Representation
    representation: 'independent' as 'independent' | 'broker' | 'builder',
    brokerName: '',
    builderName: '',
    // Default to pending so listings go through admin approval
    status: 'pending',
    featured: false,
    // Pro-to-pro information (not shown publicly)
    showingInstructions: '',
    compensationDetails: '',
    proNotes: ''
  })

  const propertyTypes = [
    { value: 'apartment', label: 'Apartamento' },
    { value: 'house', label: 'Casa' },
    { value: 'condo', label: 'Condominio' },
    { value: 'villa', label: 'Villa' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'land', label: 'Terreno' },
    { value: 'commercial', label: 'Comercial' }
  ]

  // Exchange rate (you should fetch this from an API in production)
  const exchangeRate = 58.5 // USD to DOP

  const amenitiesCategories = {
    interior: {
      label: 'Interior',
      icon: '🏠',
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
      icon: '🌳',
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
      icon: '🏢',
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
      icon: '🚗',
      items: [
        { id: 'covered-parking', label: 'Parqueo Techado' },
        { id: 'garage', label: 'Garaje' },
        { id: 'visitor-parking', label: 'Parqueo Visitantes' },
        { id: 'electric-charger', label: 'Cargador Eléctrico' }
      ]
    },
    views: {
      label: 'Vistas',
      icon: '🌅',
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
      icon: '💡',
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
  }

  // Legacy support - flatten for backward compatibility
  const availableFeatures = Object.values(amenitiesCategories).flatMap(cat => cat.items)

  // Load agent session early to show identification details and guard access
  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'agent') {
      // Soft-guard: redirect to login if not an agent
      router.push('/agent/login')
      return
    }
    setAgent(s)
  }, [router])

  // Generate a listing ID (VIV-YYYY-NNNNNN)
  const generateListingId = async (): Promise<string> => {
    const year = new Date().getFullYear()
    const countersRef = doc(db, 'counters', 'listings')
    try {
  const seq = await runTransaction(db, async (tx: any) => {
        const snap = await tx.get(countersRef)
        const data = (snap.exists() ? snap.data() : {}) as Record<string, number>
        const current = data[String(year)] || 0
        const next = current + 1
        if (!snap.exists()) {
          tx.set(countersRef, { [String(year)]: next })
        } else {
          tx.update(countersRef, { [String(year)]: next })
        }
        return next
      })
      const id = `VIV-${year}-${String(seq).padStart(6, '0')}`
      return id
    } catch (err) {
      console.warn('Falling back to timestamp-based listingId due to counter error:', err)
      return `VIV-${year}-${Date.now().toString().slice(-6)}`
    }
  }

  // --- Drafts helpers ---
  const requiredForPublish = ['title','description','propertyType','listingType','price','city','neighborhood','area'] as const

  function calculateCompletion(): number {
    let filled = 0
    requiredForPublish.forEach((key) => {
      // @ts-ignore
      if (String(formData[key] || '').trim().length > 0) filled++
    })
    // images are important but not required for draft; count them softly
    if (images.length > 0) filled++
    const total = requiredForPublish.length + 1
    return Math.round((filled / total) * 100)
  }

  async function saveDraft() {
    const session = getSession()
    if (!session || session.role !== 'agent') {
      toast.error('Debes estar autenticado como agente')
      router.push('/agent/login')
      return
    }
    setSavingDraft(true)
    try {
      const now = Date.now()
      const payload = {
        agentId: session.uid,
        createdAt: now,
        updatedAt: now,
        completion: calculateCompletion(),
        title: formData.title,
        data: {
          ...formData,
          // Images are not persisted in drafts for now
        }
      }
      if (currentDraftId) {
        await updateDoc(doc(db, 'drafts', currentDraftId), payload)
        toast.success('Borrador actualizado')
      } else {
        const ref = await addDoc(collection(db, 'drafts'), payload)
        setCurrentDraftId(ref.id)
        toast.success('Borrador guardado')
      }
    } catch (e: any) {
      console.error('saveDraft error', e)
      toast.error('No se pudo guardar el borrador')
    } finally {
      setSavingDraft(false)
    }
  }

  async function openDrafts() {
    const session = getSession()
    if (!session || session.role !== 'agent') {
      toast.error('Debes estar autenticado como agente')
      router.push('/agent/login')
      return
    }
    try {
      const q = query(collection(db, 'drafts'), where('agentId', '==', session.uid))
      const snaps = await getDocs(q)
      const list: Array<{ id: string; title?: string; updatedAt: number; createdAt: number; completion: number }> = []
      snaps.forEach((d: any) => {
        const data = d.data() as any
        list.push({ id: d.id, title: data.title, updatedAt: data.updatedAt, createdAt: data.createdAt, completion: data.completion })
      })
      // sort by updated desc
      list.sort((a,b) => b.updatedAt - a.updatedAt)
      setDrafts(list)
      setShowDrafts(true)
    } catch (e) {
      console.error('openDrafts error', e)
      toast.error('No se pudieron cargar los borradores')
    }
  }

  async function loadDraft(draftId: string) {
    try {
      const docRef = doc(db, 'drafts', draftId)
      const snap = await getDocs(query(collection(db, 'drafts'), where('__name__','==', draftId)))
      let data: any | null = null
  snap.forEach((d: any) => { data = d.data() })
      if (!data) {
        toast.error('Borrador no encontrado')
        return
      }
      setFormData((prev) => ({ ...prev, ...(data.data || {}) }))
      setCurrentDraftId(draftId)
      setShowDrafts(false)
      toast.success('Borrador cargado')
    } catch (e) {
      console.error('loadDraft error', e)
      toast.error('No se pudo cargar el borrador')
    }
  }

  async function removeDraft(draftId: string) {
    try {
      await deleteDoc(doc(db, 'drafts', draftId))
      setDrafts((prev) => prev.filter(d => d.id !== draftId))
      if (currentDraftId === draftId) setCurrentDraftId(null)
      toast.success('Borrador eliminado')
    } catch (e) {
      console.error('removeDraft error', e)
      toast.error('No se pudo eliminar el borrador')
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 10) {
      toast.error('Máximo 10 imágenes permitidas')
      return
    }

    setImages([...images, ...files])

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  function toggleFeature(featureId: string) {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter((f) => f !== featureId)
        : [...prev.features, featureId]
    }))
  }

  function handleDocumentUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: ListingFile['type'],
    defaultVisibility: ListingFile['visibility']
  ) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate file types
    const validTypes = type === 'floor-plan' ? ['.pdf', '.jpg', '.jpeg', '.png'] : ['.pdf']
    const invalidFiles = files.filter(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      return !validTypes.includes(ext)
    })

    if (invalidFiles.length > 0) {
      toast.error(`Archivos no válidos. Solo se permiten: ${validTypes.join(', ')}`)
      return
    }

    // Check file size (5MB max per file)
    const oversizedFiles = files.filter(f => f.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error('Algunos archivos exceden el límite de 5MB')
      return
    }

    // Add to documents array
    const newDocs: ListingFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      type,
      visibility: defaultVisibility,
      file
    }))

    setDocuments(prev => [...prev, ...newDocs])
    toast.success(`${files.length} documento(s) agregado(s)`)
    
    // Reset input
    e.target.value = ''
  }

  function removeDocument(id: string) {
    setDocuments(prev => prev.filter(doc => doc.id !== id))
  }

  function updateDocumentVisibility(id: string, visibility: ListingFile['visibility']) {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, visibility } : doc
    ))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validation
    if (images.length === 0) {
      toast.error('Debes subir al menos una imagen')
      return
    }
    if (!formData.title || !formData.description) {
      toast.error('El título y descripción son requeridos')
      return
    }

    setLoading(true)
    try {
      const session = getSession()
      if (!session || session.role !== 'agent') {
        toast.error('Debes estar autenticado como agente')
        router.push('/agent/login')
        return
      }

      // NOTE: Direct Firebase writes require Firebase Auth; we currently rely on custom session.
      // Provide graceful failure messaging if security rules reject.
      const listingId = await generateListingId()

      // Upload images (best-effort). If permission denied, abort with guidance.
      const imageUrls: string[] = []
      toast.loading('Subiendo imágenes...', { id: 'upload' })
      for (let i = 0; i < images.length; i++) {
        try {
          const file = images[i]
          const fileName = `${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
          const storageRef = ref(storage, `properties/${session.uid}/${fileName}`)
          await uploadBytes(storageRef, file)
          const url = await getDownloadURL(storageRef)
          imageUrls.push(url)
        } catch (err: any) {
          console.error('Image upload error', err)
          toast.error('Error al subir una imagen (permiso). Revisa autenticación Firebase.')
          throw err
        }
      }
      toast.success('Imágenes subidas', { id: 'upload' })

      // Documents upload
      const uploadedDocuments: Array<{ name: string; url: string; type: string; visibility: string; uploadedAt: number }> = []
      if (documents.length > 0) {
        setUploadingDocs(true)
        toast.loading('Subiendo documentos...', { id: 'docs-upload' })
        for (const docFile of documents) {
          try {
            const fileName = `${Date.now()}-${docFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
            const storageRef = ref(storage, `properties/${session.uid}/documents/${fileName}`)
            await uploadBytes(storageRef, docFile.file)
            const url = await getDownloadURL(storageRef)
            uploadedDocuments.push({
              name: docFile.name,
              url,
              type: docFile.type,
              visibility: docFile.visibility,
              uploadedAt: Date.now()
            })
          } catch (err: any) {
            console.error('Doc upload error', err)
            toast.error('Error al subir documentos (permiso).')
            throw err
          }
        }
        toast.success('Documentos subidos', { id: 'docs-upload' })
        setUploadingDocs(false)
      }

      // Prepare data
      const propertyData = {
        // Spanish content (primary)
        title: formData.title,
        description: formData.description,
        
        // English content (secondary)
        titleEn: formData.titleEn || formData.title,
        descriptionEn: formData.descriptionEn || formData.description,
        
        // Property details
        propertyType: formData.propertyType,
        listingType: formData.listingType,
        price: parseFloat(formData.price),
        currency: formData.currency,
        
        // Specifications
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseFloat(formData.bathrooms) || 0,
        parkingSpaces: parseInt(formData.parkingSpaces) || 0,
        area: parseInt(formData.area) || 0,
        lotSize: parseInt(formData.lotSize) || 0,
        yearBuilt: parseInt(formData.yearBuilt) || null,
        
        // Location
        location: {
          city: formData.city,
          neighborhood: formData.neighborhood,
          address: formData.address,
          latitude: parseFloat(formData.latitude) || null,
          longitude: parseFloat(formData.longitude) || null
        },
        
        // Media
        images: imageUrls,
        mainImage: imageUrls[0],
        
        // Features
        features: formData.features,
        
  // Agent and representation information
  listingId,
  agentId: session.uid,
  agentName: session.name || session.displayName || session.email,
  agentEmail: session.email,
  representation: formData.representation,
  brokerName: formData.representation === 'broker' ? formData.brokerName : '',
  builderName: formData.representation === 'builder' ? formData.builderName : '',
        
        // Status and visibility (pending by default until admin approval)
        status: formData.status,
        featured: formData.featured,

        // Pro-to-pro information (admin only)
        proInfo: {
          showingInstructions: formData.showingInstructions,
          compensationDetails: formData.compensationDetails,
          proNotes: formData.proNotes
        },
        
        // Documents
        documents: uploadedDocuments,
        
        // Metrics (initialized)
        views: 0,
        inquiries: 0,
        favorites: 0,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Use API route to bypass Firebase Auth requirements
      try {
        const response = await fetch('/api/listings/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyData,
            agentId: session.uid,
            agentEmail: session.email,
            agentName: session.name || session.displayName || session.email
          })
        })

        const result = await response.json()
        
        if (result.ok) {
          toast.success('¡Propiedad enviada para revisión! (24-48h)')
          router.push('/agent/listings')
        } else {
          throw new Error(result.error || 'Error al crear la propiedad')
        }
      } catch (err: any) {
        console.error('Firestore create error', err)
        toast.error(err.message || 'Error al crear la propiedad. Intenta de nuevo.')
      }
    } catch (outer: any) {
      // Already handled granular errors above
      console.error('Create listing workflow error', outer)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-[#00A676] mb-4"
          >
            <FiArrowLeft /> Volver
          </button>
          <h1 className="text-4xl font-bold text-[#0B2545] mb-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#00A676] to-[#00A6A6] rounded-xl flex items-center justify-center">
              <FiHome className="text-white text-2xl" />
            </div>
            Nueva Propiedad
          </h1>
          <p className="text-gray-600">
            Completa el formulario para publicar tu propiedad
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#0B2545] mb-4">
              Información Básica
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Título de la propiedad (Español) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  placeholder="Ej: Apartamento moderno en Piantini"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Título de la propiedad (English)
                </label>
                <input
                  type="text"
                  value={formData.titleEn}
                  onChange={(e) =>
                    setFormData({ ...formData, titleEn: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  placeholder="Ex: Modern apartment in Piantini"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción (Español) *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  placeholder="Describe tu propiedad en detalle..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción (English)
                </label>
                <textarea
                  rows={5}
                  value={formData.descriptionEn}
                  onChange={(e) =>
                    setFormData({ ...formData, descriptionEn: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  placeholder="Describe your property in detail..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="propertyType" className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de propiedad *
                  </label>
                  <select
                    id="propertyType"
                    required
                    value={formData.propertyType}
                    onChange={(e) =>
                      setFormData({ ...formData, propertyType: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    aria-label="Tipo de propiedad"
                  >
                    {propertyTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="listingType" className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de transacción *
                  </label>
                  <select
                    id="listingType"
                    required
                    value={formData.listingType}
                    onChange={(e) =>
                      setFormData({ ...formData, listingType: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    aria-label="Tipo de transacción"
                  >
                    <option value="sale">Venta</option>
                    <option value="rent">Alquiler</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Agent & Representation */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#0B2545] mb-4">Tu información y representación</h2>
            <div className="space-y-4">
              {agent && (
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700">
                    Publicando como: <span className="font-semibold">{agent.name || agent.displayName || agent.email}</span>
                  </p>
                  {agent.email && (
                    <p className="text-sm text-gray-500">{agent.email}</p>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label htmlFor="representation" className="block text-sm font-semibold text-gray-700 mb-2">
                    ¿Cómo representas este listado? *
                  </label>
                  <select
                    id="representation"
                    required
                    value={formData.representation}
                    onChange={(e) => setFormData({ ...formData, representation: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    aria-label="Representación del listado"
                  >
                    <option value="independent">Agente Independiente</option>
                    <option value="broker">A través de Inmobiliaria</option>
                    <option value="builder">Constructor/Proyecto</option>
                  </select>
                </div>

                {formData.representation === 'broker' && (
                  <div className="md:col-span-2">
                    <label htmlFor="brokerName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre de la inmobiliaria
                    </label>
                    <input
                      id="brokerName"
                      type="text"
                      value={formData.brokerName}
                      onChange={(e) => setFormData({ ...formData, brokerName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      placeholder="Ej. Viventa Realty"
                    />
                  </div>
                )}

                {formData.representation === 'builder' && (
                  <div className="md:col-span-2">
                    <label htmlFor="builderName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre del proyecto/constructor
                    </label>
                    <input
                      id="builderName"
                      type="text"
                      value={formData.builderName}
                      onChange={(e) => setFormData({ ...formData, builderName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      placeholder="Ej. Torre Piantini by ACME"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Price & Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#0B2545] mb-4 flex items-center gap-2">
              <FiDollarSign className="text-[#00A676]" />
              Precio y Detalles
            </h2>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Precio *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                      {formData.currency === 'USD' ? '$' : 'RD$'}
                    </span>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      placeholder="150000"
                    />
                  </div>
                  {formData.price && (
                    <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                      {formData.currency === 'USD' ? (
                        <>
                          ≈ RD$ {(parseFloat(formData.price) * exchangeRate).toLocaleString('es-DO')}
                          <span className="text-xs text-gray-500">(Tasa: {exchangeRate})</span>
                        </>
                      ) : (
                        <>
                          ≈ $ {(parseFloat(formData.price) / exchangeRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          <span className="text-xs text-gray-500">(Tasa: {exchangeRate})</span>
                        </>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-semibold text-gray-700 mb-2">
                    Moneda *
                  </label>
                  <select
                    id="currency"
                    required
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    aria-label="Moneda"
                  >
                    <option value="USD">🇺🇸 USD - Dólares Americanos</option>
                    <option value="DOP">🇩🇴 DOP - Pesos Dominicanos</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Tip: La mayoría de propiedades premium se publican en USD
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Habitaciones *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.bedrooms}
                    onChange={(e) =>
                      setFormData({ ...formData, bedrooms: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="3"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Baños *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={(e) =>
                      setFormData({ ...formData, bathrooms: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="2"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Área (m²) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.area}
                    onChange={(e) =>
                      setFormData({ ...formData, area: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="120"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Parqueos
                  </label>
                  <input
                    type="number"
                    value={formData.parkingSpaces}
                    onChange={(e) =>
                      setFormData({ ...formData, parkingSpaces: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="1"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tamaño del terreno (m²)
                  </label>
                  <input
                    type="number"
                    value={formData.lotSize}
                    onChange={(e) =>
                      setFormData({ ...formData, lotSize: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="150"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Año de construcción
                  </label>
                  <input
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) =>
                      setFormData({ ...formData, yearBuilt: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="2023"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#0B2545] mb-4 flex items-center gap-2">
              <FiMapPin className="text-[#00A676]" />
              Ubicación
            </h2>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="Santo Domingo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sector *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.neighborhood}
                    onChange={(e) =>
                      setFormData({ ...formData, neighborhood: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="Piantini"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dirección completa
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  placeholder="Calle, número, etc."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Latitud (coordenadas GPS)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="18.4861"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Longitud (coordenadas GPS)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="-69.9312"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiMapPin className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">
                      ¿Cómo obtener coordenadas?
                    </h3>
                    <p className="text-sm text-blue-700">
                      Abre Google Maps, busca tu propiedad, haz clic derecho en la ubicación y selecciona las coordenadas para copiarlas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amenities - Comprehensive Categorized System */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#0B2545] mb-2">
              Amenidades y Características
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Selecciona todas las características que apliquen a tu propiedad
            </p>

            <div className="space-y-6">
              {Object.entries(amenitiesCategories).map(([categoryKey, category]) => (
                <div key={categoryKey} className="border-2 border-gray-200 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    {category.label}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {category.items.map((feature) => (
                      <button
                        key={feature.id}
                        type="button"
                        onClick={() => toggleFeature(feature.id)}
                        className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                          formData.features.includes(feature.id)
                            ? 'bg-gradient-to-r from-[#00A676] to-[#00A6A6] border-[#00A676] text-white shadow-md scale-105'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-[#00A676] hover:shadow-sm'
                        }`}
                      >
                        {feature.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {formData.features.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-800">
                  <strong>{formData.features.length} amenidades seleccionadas</strong>
                </p>
              </div>
            )}
          </div>

          {/* Información profesional (pro-to-pro) */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#0B2545] mb-4">
              Información profesional (visible solo para agentes)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Instrucciones de muestra
                </label>
                <textarea
                  rows={3}
                  value={formData.showingInstructions}
                  onChange={(e) => setFormData({ ...formData, showingInstructions: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  placeholder="Cómo agendar y mostrar la propiedad, requisitos de acceso, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Detalles de compensación
                </label>
                <input
                  type="text"
                  value={formData.compensationDetails}
                  onChange={(e) => setFormData({ ...formData, compensationDetails: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  placeholder="Ej: 3% al agente comprador"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notas privadas (pro-to-pro)
                </label>
                <textarea
                  rows={3}
                  value={formData.proNotes}
                  onChange={(e) => setFormData({ ...formData, proNotes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  placeholder="Comentarios internos para otros profesionales"
                />
              </div>
            </div>
          </div>

          {/* Documents Upload */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#0B2545] mb-4 flex items-center gap-2">
              <FiFile className="text-[#00A676]" />
              Documentos Adicionales
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Sube planos, documentos de divulgación, HOA, etc. Controla la visibilidad de cada documento.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Floor Plans */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#00A676] transition-colors">
                <FiFile className="text-3xl text-blue-600 mb-2" />
                <h4 className="font-semibold mb-2">Planos</h4>
                <p className="text-xs text-gray-500 mb-3">PDF, JPG, PNG hasta 5MB</p>
                <label htmlFor="floor-plans-upload" className="sr-only">Subir planos</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleDocumentUpload(e, 'floor-plan', 'public')}
                  multiple
                  className="text-sm"
                  id="floor-plans-upload"
                  aria-label="Subir planos"
                />
              </div>

              {/* Disclosure Documents */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#00A676] transition-colors">
                <FiShield className="text-3xl text-green-600 mb-2" />
                <h4 className="font-semibold mb-2">Divulgaciones</h4>
                <p className="text-xs text-gray-500 mb-3">Solo PDF hasta 5MB</p>
                <label htmlFor="disclosure-upload" className="sr-only">Subir divulgaciones</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleDocumentUpload(e, 'disclosure', 'agents-only')}
                  multiple
                  className="text-sm"
                  id="disclosure-upload"
                  aria-label="Subir divulgaciones"
                />
              </div>

              {/* HOA Documents */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#00A676] transition-colors">
                <FiFile className="text-3xl text-purple-600 mb-2" />
                <h4 className="font-semibold mb-2">Documentos HOA</h4>
                <p className="text-xs text-gray-500 mb-3">Solo PDF hasta 5MB</p>
                <label htmlFor="hoa-upload" className="sr-only">Subir documentos HOA</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleDocumentUpload(e, 'hoa-docs', 'agents-only')}
                  multiple
                  className="text-sm"
                  id="hoa-upload"
                  aria-label="Subir documentos HOA"
                />
              </div>

              {/* Other Documents */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#00A676] transition-colors">
                <FiFile className="text-3xl text-gray-600 mb-2" />
                <h4 className="font-semibold mb-2">Otros</h4>
                <p className="text-xs text-gray-500 mb-3">Solo PDF hasta 5MB</p>
                <label htmlFor="other-upload" className="sr-only">Subir otros documentos</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleDocumentUpload(e, 'other', 'private')}
                  multiple
                  className="text-sm"
                  id="other-upload"
                  aria-label="Subir otros documentos"
                />
              </div>
            </div>

            {/* Uploaded Documents List */}
            {documents.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Documentos agregados ({documents.length})</h4>
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 flex-1">
                      <FiFile className="text-xl text-gray-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {doc.type === 'floor-plan' ? 'Plano' : 
                           doc.type === 'disclosure' ? 'Divulgación' :
                           doc.type === 'hoa-docs' ? 'HOA' :
                           doc.type === 'inspection' ? 'Inspección' : 'Otro'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={doc.visibility}
                        onChange={(e) => updateDocumentVisibility(doc.id, e.target.value as ListingFile['visibility'])}
                        className="text-xs px-2 py-1 border border-gray-300 rounded"
                        aria-label={`Visibilidad de ${doc.name}`}
                      >
                        <option value="public">Público</option>
                        <option value="agents-only">Solo agentes</option>
                        <option value="private">Privado</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        aria-label="Eliminar documento"
                        title="Eliminar documento"
                      >
                        <FiX className="text-lg" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#0B2545] mb-4 flex items-center gap-2">
              <FiImage className="text-[#00A676]" />
              Imágenes (Máx. 10)
            </h2>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#00A676] transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <FiUpload className="text-5xl text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-700">
                      Haz clic para subir imágenes
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      PNG, JPG hasta 5MB cada una
                    </p>
                  </div>
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Eliminar imagen"
                        title="Eliminar imagen"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status & Featured */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#0B2545] mb-4">
              Visibilidad y Estado
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-[#00A676] transition-colors">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Propiedad Destacada
                  </h3>
                  <p className="text-sm text-gray-600">
                    Las propiedades destacadas aparecen en la página principal y obtienen mayor visibilidad
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, featured: !formData.featured })
                  }
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    formData.featured ? 'bg-[#00A676]' : 'bg-gray-300'
                  }`}
                  aria-label="Alternar propiedad destacada"
                  title="Alternar propiedad destacada"
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      formData.featured ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Revisión y aprobación (24–48 horas)
                    </h3>
                    <p className="text-sm text-gray-600">
                      Tu propiedad se enviará para revisión del equipo de VIVENTA. Te notificaremos por correo cuando esté aprobada y visible para los usuarios.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit & Draft Buttons */}
          <div className="flex gap-4 sticky bottom-4 bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200">
            <button
              type="button"
              onClick={openDrafts}
              className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
              aria-label="Ver borradores"
              title="Ver borradores"
            >
              <FiFolder /> Mis borradores
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={savingDraft}
              className="px-6 py-3 bg-white border-2 border-[#00A676] text-[#00A676] rounded-xl font-semibold hover:bg-green-50 transition-all disabled:opacity-50 flex items-center gap-2"
              aria-label="Guardar borrador"
              title="Guardar borrador"
            >
              {savingDraft ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#00A676] border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <FiSave /> Guardar borrador
                </>
              )}
            </button>
            <button
              type="submit"
              disabled={loading || images.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Publicando...
                </>
              ) : (
                <>
                  <FiSave />
                  Publicar Propiedad
                </>
              )}
            </button>
          </div>
          {/* Drafts modal */}
          {showDrafts && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#0B2545] flex items-center gap-2"><FiFolder /> Mis borradores</h3>
                  <button onClick={() => setShowDrafts(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center" aria-label="Cerrar">
                    <FiX />
                  </button>
                </div>
                {drafts.length === 0 ? (
                  <p className="text-gray-600">No tienes borradores aún. Guarda uno para continuar más tarde.</p>
                ) : (
                  <div className="space-y-3 max-h-[60vh] overflow-auto">
                    {drafts.map((d) => (
                      <div key={d.id} className="border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{d.title || 'Sin título'}</p>
                          <p className="text-sm text-gray-600">Actualizado: {new Date(d.updatedAt).toLocaleString()} • Compleción: {d.completion}%</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => loadDraft(d.id)} className="px-3 py-2 rounded-lg bg-[#00A676] text-white hover:brightness-95 flex items-center gap-2" aria-label="Continuar">
                            <FiEdit /> Continuar
                          </button>
                          <button onClick={() => removeDraft(d.id)} className="px-3 py-2 rounded-lg border-2 border-red-500 text-red-600 hover:bg-red-50 flex items-center gap-2" aria-label="Eliminar">
                            <FiTrash2 /> Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
