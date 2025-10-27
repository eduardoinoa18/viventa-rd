import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { notFound } from 'next/navigation'

const agents = [
  { id: 'a1', photo: '/agent1.jpg', name: 'María López', area: 'Santo Domingo', rating: 4.9, bio: 'Especialista en propiedades de lujo en Santo Domingo. Más de 10 años de experiencia.', phone: '+1 809 555 0101', email: 'maria@viventa.com' },
  { id: 'a2', photo: '/agent2.jpg', name: 'Carlos Pérez', area: 'Punta Cana', rating: 5.0, bio: 'Experto en inversiones turísticas en Punta Cana y Bávaro.', phone: '+1 809 555 0102', email: 'carlos@viventa.com' },
  { id: 'a3', photo: '/agent3.jpg', name: 'Ana García', area: 'Santiago', rating: 4.8, bio: 'Agente con amplia red en la región del Cibao.', phone: '+1 809 555 0103', email: 'ana@viventa.com' },
  { id: 'a4', photo: '/agent4.jpg', name: 'Luis Rodríguez', area: 'La Romana', rating: 4.7, bio: 'Conocedor profundo del mercado en La Romana y Casa de Campo.', phone: '+1 809 555 0104', email: 'luis@viventa.com' },
]

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const agent = agents.find(a => a.id === params.id)
  
  if (!agent) notFound()

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <img src={agent.photo || '/default-agent.jpg'} alt={agent.name} className="w-32 h-32 rounded-full object-cover" />
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-[#0B2545]">{agent.name}</h1>
              <div className="text-gray-600 mt-1">{agent.area}</div>
              <div className="text-yellow-500 mt-2">★ {agent.rating} / 5.0</div>
              <p className="text-gray-700 mt-4">{agent.bio}</p>
            </div>
          </div>

          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold mb-4 text-[#0B2545]">Información de contacto</h2>
            <div className="space-y-2 text-gray-700">
              <div><strong>Teléfono:</strong> {agent.phone}</div>
              <div><strong>Email:</strong> {agent.email}</div>
            </div>
            <div className="mt-6 flex gap-3">
              <a href={`mailto:${agent.email}`} className="px-4 py-2 bg-[#00A676] text-white rounded font-semibold hover:bg-[#008F64]">
                Enviar mensaje
              </a>
              <a href={`tel:${agent.phone}`} className="px-4 py-2 border border-[#0B2545] text-[#0B2545] rounded font-semibold hover:bg-[#0B2545] hover:text-white">
                Llamar
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
