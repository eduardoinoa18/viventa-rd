'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebaseClient'
import { getSession } from '@/lib/authSession'
import {
  FiUpload,
  FiX,
  FiImage,
  FiMapPin,
  FiHome,
  FiDollarSign,
  FiSave,
  FiArrowLeft
} from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function CreateListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  
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

    // Recommend adding pro info but not required

    setLoading(true)

    try {
      const session = await getSession()
      if (!session || session.role !== 'agent') {
        toast.error('Debes estar autenticado como agente')
        router.push('/agent/login')
        return
      }

      // Upload images with progress
      const imageUrls: string[] = []
      toast.loading('Subiendo imágenes...', { id: 'upload' })
      
      for (let i = 0; i < images.length; i++) {
        const file = images[i]
        const fileName = `${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        const storageRef = ref(storage, `properties/${session.uid}/${fileName}`)
        
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)
        imageUrls.push(url)
      }
      
      toast.success('Imágenes subidas', { id: 'upload' })

      // Create property document with complete structure
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
        
        // Agent information
        agentId: session.uid,
        agentName: session.name || session.displayName || session.email,
        agentEmail: session.email,
        
        // Status and visibility (pending by default until admin approval)
        status: formData.status,
        featured: formData.featured,

        // Pro-to-pro information (admin only)
        proInfo: {
          showingInstructions: formData.showingInstructions,
          compensationDetails: formData.compensationDetails,
          proNotes: formData.proNotes
        },
        
        // Metrics (initialized)
        views: 0,
        inquiries: 0,
        favorites: 0,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'properties'), propertyData)

      // Fire-and-forget: notify agent via email that listing is under review
      fetch('/api/listings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'received',
          listingId: docRef.id,
          listingTitle: formData.title,
          agentEmail: session.email,
          agentName: session.name || session.displayName || session.email
        })
      }).catch(() => {})

      toast.success('¡Propiedad enviada para revisión! (24-48h)')
      router.push('/agent/listings')
    } catch (error: any) {
      console.error('Error creating property:', error)
      toast.error(error.message || 'Error al crear la propiedad. Intenta de nuevo.')
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de propiedad *
                  </label>
                  <select
                    required
                    value={formData.propertyType}
                    onChange={(e) =>
                      setFormData({ ...formData, propertyType: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  >
                    {propertyTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de transacción *
                  </label>
                  <select
                    required
                    value={formData.listingType}
                    onChange={(e) =>
                      setFormData({ ...formData, listingType: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  >
                    <option value="sale">Venta</option>
                    <option value="rent">Alquiler</option>
                  </select>
                </div>
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

          {/* Submit Buttons */}
          <div className="flex gap-4 sticky bottom-4 bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
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
        </form>
      </div>
    </div>
  )
}
