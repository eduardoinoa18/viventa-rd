import Footer from '../../components/Footer'
import Header from '../../components/Header'
import Link from 'next/link'
import { FiHome, FiBarChart2, FiCpu, FiCompass, FiShield, FiDollarSign, FiUsers, FiTrendingUp, FiStar, FiLogIn, FiUserPlus } from 'react-icons/fi'

// Avoid static generation timeouts by rendering this page dynamically at runtime
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
              <Link href="/agent/login" className="px-8 py-3 bg-white text-[#004AAD] font-bold rounded-lg shadow hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2">
                <FiLogIn /> Portal de Agentes
              </Link>
              <Link href="/broker/login" className="px-8 py-3 bg-white text-[#00A6A6] font-bold rounded-lg shadow hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2">
                <FiLogIn /> Portal de Brókers
              </Link>
              <Link href="/apply" className="px-8 py-3 bg-[#00A6A6] text-white font-bold rounded-lg shadow hover:bg-[#008f8f] transition-colors border-2 border-white inline-flex items-center justify-center gap-2">
                <FiUserPlus /> Solicitar Acceso
              </Link>
            </div>
            <p className="mt-6 text-sm text-white/70">
              ¿Eres profesional? Accede a tu portal exclusivo arriba
            </p>
          </div>
        </section>

        {/* Professional Login Portal Section */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl shadow-xl p-8 md:p-12 border-2 border-blue-200">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 text-[#0B2545]">Acceso para Profesionales</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Accede a tu portal profesional con herramientas avanzadas de gestión,
                CRM integrado, y analíticas en tiempo real.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Agent Portal Card */}
              <Link href="/agent/login" className="group">
                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-[#004AAD]">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#004AAD] to-[#0066cc] rounded-xl flex items-center justify-center">
                      <FiUsers className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0B2545]">Portal de Agentes</h3>
                      <p className="text-sm text-gray-500">Para agentes inmobiliarios</p>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-4 text-sm text-gray-700">
                    <li className="flex items-start gap-2">✓ Gestión de listados</li>
                    <li className="flex items-start gap-2">✓ CRM de clientes</li>
                    <li className="flex items-start gap-2">✓ Analytics de rendimiento</li>
                    <li className="flex items-start gap-2">✓ Calendario y citas</li>
                  </ul>
                  <div className="flex items-center justify-between text-[#004AAD] font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Iniciar sesión</span>
                    <FiLogIn className="text-xl" />
                  </div>
                </div>
              </Link>

              {/* Broker Portal Card */}
              <Link href="/broker/login" className="group">
                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-[#00A6A6]">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#00A6A6] to-[#00C896] rounded-xl flex items-center justify-center">
                      <FiTrendingUp className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0B2545]">Portal de Brókers</h3>
                      <p className="text-sm text-gray-500">Para brókers y gerentes</p>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-4 text-sm text-gray-700">
                    <li className="flex items-start gap-2">✓ Gestión de equipo</li>
                    <li className="flex items-start gap-2">✓ Dashboard ejecutivo</li>
                    <li className="flex items-start gap-2">✓ Reportes y comisiones</li>
                    <li className="flex items-start gap-2">✓ Supervisión de agentes</li>
                  </ul>
                  <div className="flex items-center justify-between text-[#00A6A6] font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Iniciar sesión</span>
                    <FiLogIn className="text-xl" />
                  </div>
                </div>
              </Link>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">¿Aún no tienes cuenta profesional?</p>
              <Link href="/apply" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#004AAD] to-[#00A6A6] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all">
                <FiUserPlus /> Solicitar Acceso Profesional
              </Link>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
                <div className="mb-3">
                  <h4 className="font-bold text-viventa-navy">Roberto Sánchez</h4>
                  <p className="text-sm text-gray-600">Agente Top • Santo Domingo</p>
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
                <div className="mb-3">
                  <h4 className="font-bold text-viventa-navy">Patricia Jiménez</h4>
                  <p className="text-sm text-gray-600">Broker • Punta Cana</p>
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
                <div className="mb-3">
                  <h4 className="font-bold text-viventa-navy">Ana Fernández</h4>
                  <p className="text-sm text-gray-600">Agente • Santiago</p>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-4 h-4 text-viventa-sunset fill-viventa-sunset" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  "VIVENTA transformó mi forma de trabajar. La plataforma es intuitiva y me ayuda a cerrar ventas más rápido."
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
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg"><span className="font-bold text-xl text-gray-700">RE/MAX RD</span></div>
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg"><span className="font-bold text-xl text-gray-700">Century 21 Dominicana</span></div>
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg"><span className="font-bold text-xl text-gray-700">Keller Williams RD</span></div>
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg"><span className="font-bold text-xl text-gray-700">Santo Domingo Sotheby's</span></div>
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

        {/* Contacto CTA Section */}
        <section className="bg-gradient-to-r from-[#004AAD] to-[#00A6A6] py-16 px-4">
          <div className="max-w-6xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para unirte a VIVENTA?</h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">Contáctanos hoy y descubre cómo podemos ayudarte a crecer tu negocio inmobiliario.</p>
            <a href="/contact" className="inline-block px-8 py-4 bg-white text-[#004AAD] rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-lg text-lg">
              Contáctanos Ahora
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
