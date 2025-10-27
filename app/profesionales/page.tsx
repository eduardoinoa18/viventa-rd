import Footer from '../../components/Footer'
import Header from '../../components/Header'
import { FiHome, FiBarChart2, FiCpu, FiCompass, FiShield, FiDollarSign, FiUsers, FiTrendingUp } from 'react-icons/fi'

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

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-[#004AAD] to-[#00A6A6] py-16 px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-4">¿Listo para llevar tu negocio al siguiente nivel?</h2>
            <p className="text-lg mb-8 text-white/90">Únete a los profesionales inmobiliarios que ya confían en VIVENTA</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/apply" className="px-8 py-4 bg-white text-[#004AAD] font-bold rounded-lg shadow-lg hover:bg-gray-100 transition-colors">
                Solicitar Acceso Ahora
              </a>
              <a href="/professionals#contact" className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors">
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
