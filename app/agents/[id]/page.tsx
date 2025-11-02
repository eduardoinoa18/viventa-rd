'use client'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { notFound, useRouter } from 'next/navigation'
import { FiArrowLeft, FiMail, FiPhone, FiStar, FiMapPin } from 'react-icons/fi'

const agents = [
  { id: 'a1', photo: '/agent1.jpg', name: 'María López', area: 'Santo Domingo', rating: 4.9, bio: 'Especialista en propiedades de lujo en Santo Domingo. Más de 10 años de experiencia.', phone: '+1 809 555 0101', email: 'maria@viventa.com' },
  { id: 'a2', photo: '/agent2.jpg', name: 'Carlos Pérez', area: 'Punta Cana', rating: 5.0, bio: 'Experto en inversiones turísticas en Punta Cana y Bávaro.', phone: '+1 809 555 0102', email: 'carlos@viventa.com' },
  { id: 'a3', photo: '/agent3.jpg', name: 'Ana García', area: 'Santiago', rating: 4.8, bio: 'Agente con amplia red en la región del Cibao.', phone: '+1 809 555 0103', email: 'ana@viventa.com' },
  { id: 'a4', photo: '/agent4.jpg', name: 'Luis Rodríguez', area: 'La Romana', rating: 4.7, bio: 'Conocedor profundo del mercado en La Romana y Casa de Campo.', phone: '+1 809 555 0104', email: 'luis@viventa.com' },
]

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const agent = agents.find(a => a.id === params.id)
  
  if (!agent) notFound()

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
