'use client'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { notFound, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiArrowLeft, FiMail, FiPhone, FiStar, FiMapPin } from 'react-icons/fi'
import { db } from '@/lib/firebaseClient'
import { doc, getDoc } from 'firebase/firestore'

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [agent, setAgent] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAgent() {
      try {
        const ref = doc(db, 'users', params.id)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          setAgent(null)
        } else {
          const data = snap.data()
          if (data.role !== 'agent' || data.status !== 'active') {
            setAgent(null)
          } else {
            setAgent({
              id: snap.id,
              ...data,
              photo: data.profileImage || data.avatar || '/agent-placeholder.jpg',
              area: data.areas || data.markets || data.city || 'República Dominicana',
              rating: data.rating || 4.5,
            })
          }
        }
      } catch (e) {
        setAgent(null)
      } finally {
        setLoading(false)
      }
    }
    fetchAgent()
  }, [params.id])

  if (!loading && !agent) notFound()

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Back button - Mobile optimized */}
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <button 
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-[#004AAD] font-semibold hover:text-[#003d8f] transition-colors active:scale-95"
            >
              <FiArrowLeft className="text-xl" />
              <span>Volver</span>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Agent Card - Mobile First Design */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-[#004AAD] to-[#00A6A6] p-6 text-white">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <img 
                  src={agent.photo || '/default-agent.jpg'} 
                  alt={agent.name} 
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-lg" 
                />
                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold">{agent.name}</h1>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-blue-100">
                    <FiMapPin />
                    <span>{agent.area}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-1 mt-2">
                    <FiStar className="text-yellow-300 fill-current" />
                    <span className="font-semibold">{agent.rating}</span>
                    <span className="text-blue-100">/  5.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio section */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Sobre mí</h2>
              <p className="text-gray-700 leading-relaxed">{agent.bio}</p>
            </div>

            {/* Contact Section - Mobile Optimized */}
            <div className="p-6 bg-gray-50 border-t">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contactar</h2>
              <div className="space-y-3">
                {/* Phone - Direct tap on mobile */}
                <a 
                  href={`tel:${agent.phone}`} 
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-[#00A6A6] transition-all active:scale-98"
                >
                  <div className="w-12 h-12 bg-[#00A6A6] rounded-full flex items-center justify-center text-white">
                    <FiPhone className="text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Teléfono</div>
                    <div className="font-semibold text-gray-900">{agent.phone}</div>
                  </div>
                </a>

                {/* Email */}
                <a 
                  href={`mailto:${agent.email}`} 
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-[#004AAD] transition-all active:scale-98"
                >
                  <div className="w-12 h-12 bg-[#004AAD] rounded-full flex items-center justify-center text-white">
                    <FiMail className="text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-semibold text-gray-900">{agent.email}</div>
                  </div>
                </a>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <a 
                  href={`mailto:${agent.email}?subject=Consulta sobre propiedades en ${agent.area}`}
                  className="px-6 py-4 bg-[#00A676] text-white rounded-xl font-semibold text-center hover:bg-[#008F64] transition-colors shadow-lg active:scale-98"
                >
                  Enviar mensaje
                </a>
                <a 
                  href={`tel:${agent.phone}`} 
                  className="px-6 py-4 bg-white border-2 border-[#004AAD] text-[#004AAD] rounded-xl font-semibold text-center hover:bg-[#004AAD] hover:text-white transition-colors active:scale-98"
                >
                  Llamar ahora
                </a>
              </div>
            </div>
          </div>

          {/* Additional CTA */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <p className="text-sm text-gray-700 mb-2">¿Buscas otras opciones?</p>
            <button 
              onClick={() => router.push('/agents')}
              className="text-[#004AAD] font-semibold hover:underline"
            >
              Ver todos los agentes →
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
