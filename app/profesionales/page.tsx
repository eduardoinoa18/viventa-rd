/* eslint-disable react/no-unescaped-entities */
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

        {/* Consolidated Professional Access & Pricing Section */}
        <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border-2 border-blue-200">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#0B2545]">Planes y Acceso Profesional</h2>
                <p className="text-gray-600 max-w-3xl mx-auto text-lg">
                  Únete a la red inmobiliaria más grande de República Dominicana. Planes diseñados para impulsar tu éxito.
                </p>
              </div>
              
              {/* Pricing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Agent Plan */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-6 border-2 border-blue-200 flex flex-col hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#004AAD] to-[#0066cc] rounded-xl flex items-center justify-center">
                      <FiUsers className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0B2545]">Agentes</h3>
                      <p className="text-sm text-gray-600">Plan Profesional</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">Próximamente</div>
                  <p className="text-sm text-gray-600 mb-6">Precio competitivo por mes</p>
                  <ul className="text-sm text-gray-700 space-y-2.5 mb-6 flex-1">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Listados ilimitados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>CRM básico integrado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Reportes y analytics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Calendario y gestión de citas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Soporte estándar</span>
                    </li>
                  </ul>
                  <Link href="/apply" className="block w-full px-6 py-3 bg-[#004AAD] text-white rounded-lg text-center font-semibold hover:bg-[#003d8f] transition-colors shadow-md hover:shadow-lg">
                    Solicitar Acceso
                  </Link>
                </div>

                {/* Broker Plan */}
                <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl shadow-xl p-6 border-2 border-[#00A6A6] flex flex-col relative hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#00A6A6] to-[#00C896] text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    ⭐ Recomendado
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#00A6A6] to-[#00C896] rounded-xl flex items-center justify-center">
                      <FiTrendingUp className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0B2545]">Brókers</h3>
                      <p className="text-sm text-gray-600">Plan Premium</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">Próximamente</div>
                  <p className="text-sm text-gray-600 mb-6">Precio premium por mes</p>
                  <ul className="text-sm text-gray-700 space-y-2.5 mb-6 flex-1">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Todo del plan Agente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Panel de gestión de equipo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>CRM avanzado multi-agente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Sistema de comisiones automatizado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Reportes ejecutivos avanzados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Soporte prioritario 24/7</span>
                    </li>
                  </ul>
                  <Link href="/apply" className="block w-full px-6 py-3 bg-gradient-to-r from-[#00A6A6] to-[#00C896] text-white rounded-lg text-center font-semibold hover:shadow-lg transition-all shadow-md">
                    Solicitar Acceso
                  </Link>
                </div>

                {/* Developer/Constructor Plan */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-lg p-6 border-2 border-orange-300 flex flex-col hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
                      <FiDollarSign className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0B2545]">Constructoras</h3>
                      <p className="text-sm text-gray-600">Plan Empresarial</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">Personalizado</div>
                  <p className="text-sm text-gray-600 mb-6">Soluciones a medida</p>
                  <ul className="text-sm text-gray-700 space-y-2.5 mb-6 flex-1">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold mt-0.5">✓</span>
                      <span>Showcase de proyectos destacado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold mt-0.5">✓</span>
                      <span>Integración con inventario</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold mt-0.5">✓</span>
                      <span>Marketing y promoción destacada</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold mt-0.5">✓</span>
                      <span>Análisis de mercado avanzado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold mt-0.5">✓</span>
                      <span>Soporte dedicado VIP</span>
                    </li>
                  </ul>
                  <Link href="/contact" className="block w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg text-center font-semibold hover:shadow-lg transition-all shadow-md">
                    Contactar Ventas
                  </Link>
                </div>
              </div>

              {/* CTA Section */}
              <div className="mt-10 pt-8 border-t-2 border-gray-200">
                <div className="text-center">
                  <p className="text-gray-700 mb-4 text-lg font-medium">
                    ¿Listo para transformar tu negocio inmobiliario?
                  </p>
                  <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                    <Link href="/apply" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#004AAD] to-[#00A6A6] text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-0.5 text-lg">
                      <FiUserPlus className="text-xl" /> Solicitar Acceso Ahora
                    </Link>
                    <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-[#004AAD] text-[#004AAD] font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-lg">
                      Hablar con Ventas
                    </Link>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Más de 500+ profesionales ya confían en VIVENTA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Note: Pricing section removed - now consolidated in the access section above */}

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
                  <h4 className="font-bold text-viventa-navy">Miguel Fernández</h4>
                  <p className="text-sm text-gray-600">Desarrollador • Santiago</p>
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
