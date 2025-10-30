'use client'
import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import PropertyCard from './PropertyCard'
import Link from 'next/link'
import { FiArrowRight, FiTrendingUp } from 'react-icons/fi'

interface Property {
  id: string
  title: string
  description: string
  price: number
  currency: string
  location: string
  city: string
  bedrooms: number
  bathrooms: number
  area: number
  images: string[]
  propertyType: string
  listingType: string
  featured?: boolean
  agentId?: string
  agentName?: string
  agentImage?: string
  createdAt?: any
}

export default function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'featured' | 'new' | 'popular'>('featured')

  useEffect(() => {
    loadProperties()
  }, [activeTab])

  async function loadProperties() {
    setLoading(true)
    try {
      const propertiesRef = collection(db, 'properties')
      let q

      if (activeTab === 'featured') {
        q = query(
          propertiesRef,
          where('status', '==', 'active'),
          where('featured', '==', true),
          orderBy('createdAt', 'desc'),
          limit(6)
        )
      } else if (activeTab === 'new') {
        q = query(
          propertiesRef,
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(6)
        )
      } else {
        // Popular - for now, same as featured
        // Later can add view count sorting
        q = query(
          propertiesRef,
          where('status', '==', 'active'),
          where('featured', '==', true),
          orderBy('createdAt', 'desc'),
          limit(6)
        )
      }

      const snapshot = await getDocs(q)
      const props: Property[] = []
      snapshot.forEach((doc: any) => {
        props.push({ id: doc.id, ...doc.data() } as Property)
      })

      setProperties(props)
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00A676] to-[#00A6A6] rounded-xl flex items-center justify-center">
                <FiTrendingUp className="text-white text-2xl" />
              </div>
              <h2 className="text-4xl font-bold text-[#0B2545]">
                Propiedades Destacadas
              </h2>
            </div>
            <p className="text-gray-600 text-lg ml-15">
              Descubre las mejores oportunidades del mercado inmobiliario
            </p>
          </div>

          <Link
            href="/search?featured=1"
            className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Ver todas
            <FiArrowRight />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('featured')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'featured'
                ? 'bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
            }`}
          >
            ⭐ Destacadas
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'new'
                ? 'bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
            }`}
          >
            🆕 Nuevas
          </button>
          <button
            onClick={() => setActiveTab('popular')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'popular'
                ? 'bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
            }`}
          >
            🔥 Populares
          </button>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiTrendingUp className="text-gray-400 text-4xl" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              No hay propiedades disponibles
            </h3>
            <p className="text-gray-600 mb-6">
              Vuelve pronto para ver nuevas propiedades destacadas
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Explorar todas las propiedades
              <FiArrowRight />
            </Link>
          </div>
        )}

        {/* CTA Banner */}
        {properties.length > 0 && (
          <div className="mt-16 bg-gradient-to-r from-[#0B2545] to-[#00A676] rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                ¿No encuentras lo que buscas?
              </h3>
              <p className="text-lg text-white/90 mb-6">
                Regístrate y recibe notificaciones personalizadas cuando publiquemos propiedades que coincidan con tus preferencias
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-white text-[#00A676] rounded-xl font-bold hover:shadow-xl transition-all"
                >
                  Crear cuenta gratis
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 border-2 border-white text-white rounded-xl font-bold hover:bg-white/10 transition-all"
                >
                  Hablar con un agente
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
