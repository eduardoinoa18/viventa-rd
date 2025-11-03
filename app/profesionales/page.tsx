import Footer from '../../components/Footer'
import Header from '../../components/Header'
import { FiHome, FiBarChart2, FiCpu, FiCompass, FiShield, FiDollarSign, FiUsers, FiTrendingUp, FiStar } from 'react-icons/fi'

export default function ProfesionalesLanding() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-[#004AAD] to-[#00A6A6] py-16 px-4">
          <div className="max-w-6xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Impulsa tu carrera inmobiliaria con VIVENTA</h1>
            <p className="mb-8 text-lg text-white/90">El MLS más completo para profesionales del Caribe.</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <a href="/apply" className="px-8 py-3 bg-white text-[#004AAD] font-bold rounded-lg shadow hover:bg-gray-100 transition-colors">Solicitar Acceso</a>
              <a href="/professionals#contact" className="px-8 py-3 bg-[#00A6A6] text-white font-bold rounded-lg shadow hover:bg-[#008f8f] transition-colors border-2 border-white">Más Información</a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-12 text-[#0B2545] text-center">¿Por qué elegir VIVENTA?</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiHome className="text-3xl text-[#004AAD]" />
              </div>
              <div className="font-bold mb-2">Gestión de Propiedades</div>
              <div className="text-sm text-gray-600">Administra, publica y comparte tus listados fácilmente.</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiBarChart2 className="text-3xl text-[#00A6A6]" />
              </div>
              <div className="font-bold mb-2">Panel Inteligente</div>
              <div className="text-sm text-gray-600">Estadísticas y reportes en tiempo real.</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCpu className="text-3xl text-purple-600" />
              </div>
              <div className="font-bold mb-2">CRM Integrado</div>
              <div className="text-sm text-gray-600">Gestiona clientes y oportunidades en un solo lugar.</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCompass className="text-3xl text-green-600" />
              </div>
              <div className="font-bold mb-2">Buscador de Clientes</div>
              <div className="text-sm text-gray-600">Encuentra leads calificados y conecta rápido.</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShield className="text-3xl text-red-600" />
              </div>
              <div className="font-bold mb-2">Seguridad Total</div>
              <div className="text-sm text-gray-600">Tus datos y transacciones siempre protegidos.</div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-[#0B2545] text-center">Planes y Precios</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Agent Plan */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <FiUsers className="text-3xl text-[#004AAD]" />
                  <h3 className="text-2xl font-bold">Agentes</h3>
                </div>
                <div className="text-4xl font-bold text-gray-800 mb-6">Próximamente</div>
                <ul className="space-y-3 mb-8 text-sm text-gray-700">
                  <li className="flex items-start gap-2">✓ Listados ilimitados</li>
                  <li className="flex items-start gap-2">✓ CRM básico</li>
                  <li className="flex items-start gap-2">✓ Reportes y analytics</li>
                  <li className="flex items-start gap-2">✓ Soporte estándar</li>
                </ul>
                <a href="/apply" className="block w-full px-6 py-3 bg-[#004AAD] text-white rounded-lg font-semibold text-center hover:bg-[#003d8f] transition-colors">
                  Solicitar Acceso
                </a>
              </div>

              {/* Broker Plan */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-[#00A6A6] relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00A6A6] text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Recomendado
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <FiTrendingUp className="text-3xl text-[#00A6A6]" />
                  <h3 className="text-2xl font-bold">Brókers</h3>
                </div>
                <div className="text-4xl font-bold text-gray-800 mb-6">Próximamente</div>
                <ul className="space-y-3 mb-8 text-sm text-gray-700">
                  <li className="flex items-start gap-2">✓ Todo del plan Agente</li>
                  <li className="flex items-start gap-2">✓ Panel de equipo</li>
                  <li className="flex items-start gap-2">✓ CRM avanzado</li>
                  <li className="flex items-start gap-2">✓ Comisiones automatizadas</li>
                  <li className="flex items-start gap-2">✓ Soporte prioritario</li>
                </ul>
                <a href="/apply" className="block w-full px-6 py-3 bg-[#00A6A6] text-white rounded-lg font-semibold text-center hover:bg-[#008f8f] transition-colors">
                  Solicitar Acceso
                </a>
              </div>

              {/* Developer */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-lg p-8 border-2 border-orange-200">
                <div className="flex items-center gap-3 mb-4">
                  <FiDollarSign className="text-3xl text-orange-600" />
                  <h3 className="text-2xl font-bold">Constructoras</h3>
                </div>
                <div className="text-lg font-semibold text-gray-800 mb-6">Soluciones Personalizadas</div>
                <p className="text-gray-700 mb-6 text-sm">Planes personalizados para desarrolladores y constructoras.</p>
                <ul className="space-y-3 mb-8 text-sm text-gray-700">
                  <li className="flex items-start gap-2">✓ Showcase de proyectos</li>
                  <li className="flex items-start gap-2">✓ Integración con inventario</li>
                  <li className="flex items-start gap-2">✓ Marketing destacado</li>
                  <li className="flex items-start gap-2">✓ Análisis de mercado</li>
                </ul>
                <a href="/professionals#contact" className="block w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold text-center hover:bg-orange-700 transition-colors">
                  Contactar
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories for Professionals */}
        <section className="bg-white py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-viventa-navy">Testimonios de Profesionales</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Descubre cómo VIVENTA ha transformado el negocio de agentes y brokers exitosos
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {/* Professional Story 1 */}
              <div className="bg-gradient-to-br from-viventa-sand/50 to-white rounded-2xl p-6 shadow-lg border-2 border-viventa-turquoise/20 hover:border-viventa-turquoise/40 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/agent1.jpg" alt="Roberto Sánchez" className="w-12 h-12 rounded-full object-cover border-2 border-viventa-turquoise" onError={(e) => { e.currentTarget.src = '/agent-placeholder.jpg' }} />
                  <div>
                    <h4 className="font-bold text-viventa-navy">Roberto Sánchez</h4>
                    <p className="text-sm text-gray-600">Agente Top • Santo Domingo</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-4 h-4 text-viventa-sunset fill-viventa-sunset" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  "Desde que uso VIVENTA, mis ventas aumentaron un 40%. El sistema de leads y el CRM integrado me permiten gestionar más clientes eficientemente."
                </p>
              </div>

              {/* Professional Story 2 */}
              <div className="bg-gradient-to-br from-viventa-sand/50 to-white rounded-2xl p-6 shadow-lg border-2 border-viventa-ocean/20 hover:border-viventa-ocean/40 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/agent2.jpg" alt="Patricia Jiménez" className="w-12 h-12 rounded-full object-cover border-2 border-viventa-ocean" onError={(e) => { e.currentTarget.src = '/agent-placeholder.jpg' }} />
                  <div>
                    <h4 className="font-bold text-viventa-navy">Patricia Jiménez</h4>
                    <p className="text-sm text-gray-600">Broker • Punta Cana</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-4 h-4 text-viventa-sunset fill-viventa-sunset" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  "La herramienta perfecta para gestionar mi equipo de 15 agentes. Los reportes en tiempo real me dan control total del negocio."
                </p>
              </div>

              {/* Professional Story 3 */}
              <div className="bg-gradient-to-br from-viventa-sand/50 to-white rounded-2xl p-6 shadow-lg border-2 border-viventa-palm/20 hover:border-viventa-palm/40 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/agent3.jpg" alt="Miguel Fernández" className="w-12 h-12 rounded-full object-cover border-2 border-viventa-palm" onError={(e) => { e.currentTarget.src = '/agent-placeholder.jpg' }} />
                  <div>
                    <h4 className="font-bold text-viventa-navy">Miguel Fernández</h4>
                    <p className="text-sm text-gray-600">Desarrollador • Santiago</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-4 h-4 text-viventa-sunset fill-viventa-sunset" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  "VIVENTA nos ayudó a vender 30 unidades en 6 meses. La exposición y las herramientas de marketing son incomparables."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Affiliated Companies CTA */}
        <section className="bg-gradient-to-br from-viventa-navy to-viventa-ocean py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Únete a las Mejores Empresas</h2>
              <p className="text-viventa-sand/90 max-w-2xl mx-auto">
                Forma parte de la red inmobiliaria más grande de República Dominicana
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center mb-8">
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg">
                <span className="font-bold text-xl text-gray-700">RE/MAX</span>
              </div>
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg">
                <span className="font-bold text-xl text-gray-700">Century 21</span>
              </div>
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg">
                <span className="font-bold text-xl text-gray-700">Coldwell Banker</span>
              </div>
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg">
                <span className="font-bold text-xl text-gray-700">Sotheby's</span>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-viventa-sand mb-4 text-lg">Más de 500+ profesionales ya confían en VIVENTA</p>
              <a 
                href="/apply" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-viventa-ocean rounded-xl font-bold hover:bg-viventa-sand transition-all shadow-lg text-lg"
              >
                Solicitar Acceso Ahora →
              </a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-viventa-turquoise to-viventa-teal py-16 px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-4">¿Listo para llevar tu negocio al siguiente nivel?</h2>
            <p className="text-lg mb-8">Únete a los profesionales inmobiliarios que ya confían en VIVENTA</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/apply" className="px-8 py-4 bg-white text-viventa-ocean font-bold rounded-xl shadow-lg hover:scale-105 transition-all">
                Solicitar Acceso Ahora
              </a>
              <a href="/contact" className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all">
                Hablar con un Asesor
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
