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
    description: '',
    propertyType: 'apartment',
    listingType: 'sale',
    price: '',
    currency: 'USD',
    bedrooms: '',
    bathrooms: '',
    area: '',
    city: '',
    neighborhood: '',
    address: '',
    features: [] as string[],
    status: 'pending'
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

  const availableFeatures = [
    { id: 'pool', label: 'Piscina' },
    { id: 'gym', label: 'Gimnasio' },
    { id: 'parking', label: 'Parqueo' },
    { id: 'security', label: 'Seguridad 24/7' },
    { id: 'garden', label: 'Jardín' },
    { id: 'balcony', label: 'Balcón' },
    { id: 'terrace', label: 'Terraza' },
    { id: 'elevator', label: 'Ascensor' },
    { id: 'ac', label: 'Aire Acondicionado' },
    { id: 'furnished', label: 'Amueblado' },
    { id: 'pets', label: 'Acepta Mascotas' },
    { id: 'oceanview', label: 'Vista al Mar' }
  ]

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
    setLoading(true)

    try {
      const session = await getSession()
      if (!session || session.role !== 'agent') {
        toast.error('Debes estar autenticado como agente')
        router.push('/agent/login')
        return
      }

      // Upload images
      const imageUrls: string[] = []
      for (let i = 0; i < images.length; i++) {
        const file = images[i]
        const fileName = `${Date.now()}-${i}-${file.name}`
        const storageRef = ref(storage, `properties/${session.uid}/${fileName}`)
        
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)
        imageUrls.push(url)
      }

      // Create property document
      const propertyData = {
        ...formData,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        area: parseInt(formData.area) || 0,
        images: imageUrls,
        agentId: session.uid,
        agentName: session.displayName || session.email,
        agentEmail: session.email,
        location: {
          city: formData.city,
          neighborhood: formData.neighborhood,
          address: formData.address
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'properties'), propertyData)

      toast.success('¡Propiedad creada exitosamente!')
      router.push(`/listing/${docRef.id}`)
    } catch (error) {
      console.error('Error creating property:', error)
      toast.error('Error al crear la propiedad. Intenta de nuevo.')
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
                  Título de la propiedad *
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
                  Descripción *
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
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="150000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Moneda *
                  </label>
                  <select
                    required
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  >
                    <option value="USD">USD - Dólares</option>
                    <option value="DOP">DOP - Pesos</option>
                  </select>
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Baños *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.bathrooms}
                    onChange={(e) =>
                      setFormData({ ...formData, bathrooms: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    placeholder="2"
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
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#0B2545] mb-4">
              Características
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableFeatures.map((feature) => (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => toggleFeature(feature.id)}
                  className={`px-4 py-3 rounded-xl border-2 font-medium text-sm transition-colors ${
                    formData.features.includes(feature.id)
                      ? 'bg-[#00A676] border-[#00A676] text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-[#00A676]'
                  }`}
                >
                  {feature.label}
                </button>
              ))}
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
