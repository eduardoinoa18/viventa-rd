import Header from '../components/Header'
import Footer from '../components/Footer'
import SearchBar from '../components/SearchBar'
import PropertyCard from '../components/PropertyCard'
import AgentCard from '../components/AgentCard'

const featuredProperties = [
  { id: '1', image: '/demo1.jpg', price_usd: 250000, city: 'Santo Domingo', neighborhood: 'Piantini', beds: 3, baths: 2, sqft: 180 },
  { id: '2', image: '/demo2.jpg', price_usd: 180000, city: 'Punta Cana', neighborhood: 'Bávaro', beds: 2, baths: 2, sqft: 120 },
  { id: '3', image: '/demo3.jpg', price_usd: 320000, city: 'Santiago', neighborhood: 'Los Jardines', beds: 4, baths: 3, sqft: 220 },
  { id: '4', image: '/demo4.jpg', price_usd: 95000, city: 'La Romana', neighborhood: 'Casa de Campo', beds: 1, baths: 1, sqft: 60 },
  { id: '5', image: '/demo5.jpg', price_usd: 210000, city: 'Santo Domingo', neighborhood: 'Naco', beds: 3, baths: 2, sqft: 150 },
  { id: '6', image: '/demo6.jpg', price_usd: 400000, city: 'Punta Cana', neighborhood: 'Cap Cana', beds: 5, baths: 4, sqft: 350 },
]

const topAgents = [
  { id: 'a1', photo: '/agent1.jpg', name: 'María López', area: 'Santo Domingo', rating: 4.9 },
  { id: 'a2', photo: '/agent2.jpg', name: 'Carlos Pérez', area: 'Punta Cana', rating: 5.0 },
  { id: 'a3', photo: '/agent3.jpg', name: 'Ana García', area: 'Santiago', rating: 4.8 },
  { id: 'a4', photo: '/agent4.jpg', name: 'Luis Rodríguez', area: 'La Romana', rating: 4.7 },
]

export default function HomePage() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-cover bg-center h-[420px] flex items-center justify-center" style={{backgroundImage:'url(/hero-bg.jpg)'}}>
          <div className="absolute inset-0 bg-[#0B2545]/60" />
          <div className="relative z-10 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Encuentra tu próximo hogar con VIVENTA.</h1>
            <p className="mb-6 text-lg">Tu espacio, tu futuro.</p>
            <div className="max-w-2xl mx-auto">
              <SearchBar />
            </div>
          </div>
        </section>
        {/* Featured Listings */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6 text-[#0B2545]">Propiedades Destacadas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {featuredProperties.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        </section>
        {/* Top Agents */}
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-[#0B2545]">Encuentra a tu agente ideal</h2>
            <div className="flex space-x-6 overflow-x-auto pb-2">
              {topAgents.map(a => <AgentCard key={a.id} agent={a} />)}
            </div>
          </div>
        </section>
        {/* Why Choose VIVENTA */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6 text-[#0B2545]">¿Por qué elegir VIVENTA?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <span className="text-4xl mb-2">✅</span>
              <div className="font-bold mb-1">Listados Verificados</div>
              <div className="text-sm text-gray-600 text-center">Solo propiedades revisadas y aprobadas por nuestro equipo.</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <span className="text-4xl mb-2">🤝</span>
              <div className="font-bold mb-1">Agentes de Confianza</div>
              <div className="text-sm text-gray-600 text-center">Trabaja con los mejores profesionales del sector inmobiliario.</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <span className="text-4xl mb-2">🔒</span>
              <div className="font-bold mb-1">Transacciones Seguras</div>
              <div className="text-sm text-gray-600 text-center">Tu información y tu inversión están protegidas.</div>
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section className="bg-[#00A676] py-12 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">¿Eres agente o desarrollador?</h2>
          <p className="mb-4">Únete a VIVENTA PRO y lleva tu carrera al siguiente nivel.</p>
          <a href="/profesionales" className="inline-block px-8 py-3 bg-white text-[#00A676] font-bold rounded shadow hover:bg-gray-100">Descubre VIVENTA para Profesionales</a>
        </section>
      </main>
      <Footer />
    </div>
  )
}
