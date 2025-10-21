import Footer from '../../components/Footer'
import Header from '../../components/Header'

export default function ProfesionalesLanding() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-cover bg-center h-[340px] flex items-center justify-center" style={{backgroundImage:'url(/pro-hero.jpg)'}}>
          <div className="absolute inset-0 bg-[#0B2545]/70" />
          <div className="relative z-10 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Impulsa tu carrera inmobiliaria con VIVENTA.</h1>
            <p className="mb-6 text-lg">El MLS más completo para profesionales del Caribe.</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <a href="#signup" className="px-8 py-3 bg-[#00A676] text-white font-bold rounded shadow hover:bg-[#00905c]">Unirme Ahora</a>
              <a href="#contact" className="px-8 py-3 bg-white text-[#0B2545] font-bold rounded shadow hover:bg-gray-100">Solicitar Demostración</a>
            </div>
          </div>
        </section>
        {/* Features */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-center">
            <div>
              <div className="text-4xl mb-2">🏢</div>
              <div className="font-bold mb-1">Gestión de Propiedades</div>
              <div className="text-xs text-gray-600">Administra, publica y comparte tus listados fácilmente.</div>
            </div>
            <div>
              <div className="text-4xl mb-2">📊</div>
              <div className="font-bold mb-1">Panel Inteligente</div>
              <div className="text-xs text-gray-600">Estadísticas y reportes en tiempo real.</div>
            </div>
            <div>
              <div className="text-4xl mb-2">🧠</div>
              <div className="font-bold mb-1">CRM Integrado</div>
              <div className="text-xs text-gray-600">Gestiona clientes y oportunidades en un solo lugar.</div>
            </div>
            <div>
              <div className="text-4xl mb-2">🧭</div>
              <div className="font-bold mb-1">Buscador de Clientes</div>
              <div className="text-xs text-gray-600">Encuentra leads calificados y conecta rápido.</div>
            </div>
            <div>
              <div className="text-4xl mb-2">🔒</div>
              <div className="font-bold mb-1">Seguridad Total</div>
              <div className="text-xs text-gray-600">Tus datos y transacciones siempre protegidos.</div>
            </div>
          </div>
        </section>
        {/* Pricing */}
        <section className="bg-white py-12">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-[#0B2545] text-center">Planes y Precios</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#FAFAFA] rounded-lg shadow p-6 flex flex-col items-center">
                <div className="font-bold text-lg mb-2">Agente</div>
                <div className="text-3xl font-bold text-[#00A676] mb-2">$25<span className="text-base font-normal">/mes</span></div>
                <ul className="text-sm text-gray-600 mb-4 list-disc list-inside">
                  <li>Listados ilimitados</li>
                  <li>CRM básico</li>
                  <li>Soporte estándar</li>
                </ul>
                <a href="#signup" className="px-6 py-2 bg-[#00A676] text-white rounded font-semibold">Empieza Gratis</a>
              </div>
              <div className="bg-[#FAFAFA] rounded-lg shadow p-6 flex flex-col items-center border-2 border-[#3BAFDA]">
                <div className="font-bold text-lg mb-2">Broker</div>
                <div className="text-3xl font-bold text-[#3BAFDA] mb-2">$99<span className="text-base font-normal">/mes</span></div>
                <ul className="text-sm text-gray-600 mb-4 list-disc list-inside">
                  <li>Panel de equipo</li>
                  <li>CRM avanzado</li>
                  <li>Soporte prioritario</li>
                </ul>
                <a href="#signup" className="px-6 py-2 bg-[#3BAFDA] text-white rounded font-semibold">Empieza Gratis</a>
              </div>
              <div className="bg-[#FAFAFA] rounded-lg shadow p-6 flex flex-col items-center">
                <div className="font-bold text-lg mb-2">Desarrollador</div>
                <div className="text-3xl font-bold text-[#0B2545] mb-2">$149<span className="text-base font-normal">/mes</span></div>
                <ul className="text-sm text-gray-600 mb-4 list-disc list-inside">
                  <li>Integración de proyectos</li>
                  <li>CRM premium</li>
                  <li>Soporte dedicado</li>
                </ul>
                <a href="#signup" className="px-6 py-2 bg-[#0B2545] text-white rounded font-semibold">Empieza Gratis</a>
              </div>
            </div>
          </div>
        </section>
        {/* Contact Form */}
        <section id="contact" className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6 text-[#0B2545] text-center">Contáctanos</h2>
          <form className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Nombre" className="px-3 py-2 border rounded col-span-1" />
            <input placeholder="Email" className="px-3 py-2 border rounded col-span-1" />
            <input placeholder="Teléfono" className="px-3 py-2 border rounded col-span-1" />
            <select className="px-3 py-2 border rounded col-span-1">
              <option>Agente</option>
              <option>Broker</option>
              <option>Desarrollador</option>
            </select>
            <textarea placeholder="Mensaje" className="px-3 py-2 border rounded col-span-2" rows={3} />
            <button type="submit" className="col-span-2 px-6 py-2 bg-[#00A676] text-white rounded font-semibold mt-2">Enviar</button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  )
}
