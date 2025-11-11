import Footer from '../../components/Footer'
import Header from '../../components/Header'
import Link from 'next/link'
import { FiHome, FiTrendingUp, FiUsers, FiBarChart2, FiAward, FiCheck, FiZap, FiDollarSign, FiTarget, FiMapPin, FiEye, FiPhone } from 'react-icons/fi'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ConstructorasLanding() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-orange-600 via-red-600 to-orange-500 py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center text-white mb-12">
              <h1 className="text-5xl md:text-7xl font-bold mb-6">Vende Más Unidades con VIVENTA</h1>
              <p className="text-2xl md:text-3xl text-white/95 mb-4 max-w-4xl mx-auto font-semibold">
                La Plataforma #1 para Constructoras y Desarrolladores Inmobiliarios
              </p>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Maximiza la visibilidad de tus proyectos, conecta con compradores calificados y vende inventario más rápido
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-8">
              <Link href="/contact" className="inline-flex items-center gap-3 px-12 py-6 bg-white text-orange-600 font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all text-2xl">
                <FiPhone className="text-3xl" />
                Solicitar Demo
              </Link>
              <Link href="/apply" className="inline-flex items-center gap-3 px-12 py-6 border-3 border-white text-white font-bold rounded-2xl hover:bg-white hover:text-orange-600 transition-all text-2xl">
                Crear Cuenta
              </Link>
            </div>

            <p className="text-center text-white/80 text-lg">
              🏗️ Únete a las constructoras líderes que ya están vendiendo con VIVENTA
            </p>
          </div>
        </section>

        {/* Key Stats Section */}
        <section className="bg-white py-16 border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold text-orange-600 mb-2">10,000+</div>
                <p className="text-gray-600 text-lg">Compradores Activos Mensuales</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-orange-600 mb-2">500+</div>
                <p className="text-gray-600 text-lg">Agentes Conectados</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-orange-600 mb-2">95%</div>
                <p className="text-gray-600 text-lg">Satisfacción de Clientes</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-orange-600 mb-2">24/7</div>
                <p className="text-gray-600 text-lg">Visibilidad Global</p>
              </div>
            </div>
          </div>
        </section>

        {/* Value Propositions */}
        <section className="max-w-7xl mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-[#0B2545]">¿Por Qué Elegir VIVENTA?</h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">
              Diseñado específicamente para desarrolladores que quieren vender inventario más rápido y maximizar su ROI
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
            {/* Value Prop 1 */}
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-3xl shadow-2xl p-10 hover:shadow-3xl transition-all border-2 border-orange-200">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <FiEye className="text-4xl text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-[#0B2545]">Máxima Visibilidad</h3>
              <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                Expón tus proyectos a miles de compradores potenciales, agentes activos y inversores internacionales.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <FiCheck className="text-orange-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Showcase premium de proyectos</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-orange-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Posicionamiento destacado en búsquedas</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-orange-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Marketing digital integrado</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-orange-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Alcance internacional</span>
                </li>
              </ul>
            </div>

            {/* Value Prop 2 */}
            <div className="bg-gradient-to-br from-red-50 to-white rounded-3xl shadow-2xl p-10 hover:shadow-3xl transition-all border-2 border-red-200">
              <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <FiTarget className="text-4xl text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-[#0B2545]">Leads Calificados</h3>
              <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                Conecta directamente con compradores reales interesados en tu tipo de proyecto y rango de precios.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <FiCheck className="text-red-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Leads pre-calificados automáticamente</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-red-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Sistema de matching inteligente</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-red-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Notificaciones en tiempo real</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-red-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">CRM integrado para seguimiento</span>
                </li>
              </ul>
            </div>

            {/* Value Prop 3 */}
            <div className="bg-gradient-to-br from-yellow-50 to-white rounded-3xl shadow-2xl p-10 hover:shadow-3xl transition-all border-2 border-yellow-200">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-600 to-orange-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <FiBarChart2 className="text-4xl text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-[#0B2545]">Analytics Poderosos</h3>
              <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                Toma decisiones estratégicas con datos en tiempo real sobre el rendimiento de tus proyectos.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <FiCheck className="text-yellow-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Dashboard ejecutivo completo</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-yellow-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Métricas de interés y engagement</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-yellow-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Análisis de mercado comparativo</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-yellow-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Reportes exportables</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Platform Features for Developers */}
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">Plataforma Completa para Desarrolladores</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Todo lo que necesitas para gestionar, promocionar y vender tus proyectos inmobiliarios
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center mb-4">
                  <FiHome className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Gestión de Inventario</h3>
                <p className="text-gray-300 leading-relaxed">
                  Sistema avanzado para administrar todas las unidades de tus proyectos en un solo lugar.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center mb-4">
                  <FiMapPin className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Tours Virtuales 360°</h3>
                <p className="text-gray-300 leading-relaxed">
                  Integración con tours virtuales y renders 3D para mostrar tus proyectos en construcción.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 bg-yellow-600 rounded-xl flex items-center justify-center mb-4">
                  <FiUsers className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Red de Agentes</h3>
                <p className="text-gray-300 leading-relaxed">
                  Conecta con 500+ agentes activos que pueden promocionar y vender tus unidades.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-4">
                  <FiDollarSign className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Gestión de Precios</h3>
                <p className="text-gray-300 leading-relaxed">
                  Control total sobre precios, promociones y descuentos por unidad o fase del proyecto.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <FiTrendingUp className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Marketing Automatizado</h3>
                <p className="text-gray-300 leading-relaxed">
                  Campañas automáticas de email y redes sociales para mantener tu proyecto visible.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <FiAward className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Certificaciones y Documentos</h3>
                <p className="text-gray-300 leading-relaxed">
                  Almacena y comparte permisos, certificaciones y documentos legales de tus proyectos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Success Story */}
        <section className="bg-white py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#0B2545]">Casos de Éxito</h2>
              <p className="text-xl text-gray-600">Desarrolladores que han transformado sus ventas con VIVENTA</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white rounded-3xl shadow-2xl p-12 border-2 border-orange-200">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-32 h-32 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-4xl">MF</span>
                </div>
                <div className="flex-1">
                  <div className="text-6xl font-bold text-orange-600 mb-4">30 unidades</div>
                  <p className="text-2xl text-gray-700 mb-4 leading-relaxed italic">
                    "VIVENTA nos ayudó a vender 30 unidades en solo 6 meses. La exposición y las herramientas de marketing digital son incomparables en el mercado dominicano."
                  </p>
                  <div>
                    <h4 className="text-xl font-bold text-[#0B2545]">Miguel Fernández</h4>
                    <p className="text-gray-600">Director Comercial • Grupo Desarrollador Santiago</p>
                    <p className="text-orange-600 font-semibold mt-2">Proyecto: Residencial Las Palmas - 60 unidades</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="bg-gradient-to-br from-orange-600 to-red-600 py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">Planes para Constructoras</h2>
              <p className="text-2xl text-white/90 max-w-3xl mx-auto">
                Soluciones personalizadas según el tamaño y necesidades de tu proyecto
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Basic Plan */}
              <div className="bg-white rounded-3xl shadow-2xl p-10">
                <h3 className="text-2xl font-bold mb-4 text-[#0B2545]">Proyecto Individual</h3>
                <div className="text-4xl font-bold text-orange-600 mb-6">Desde $XXX/mes</div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <FiZap className="text-orange-600 text-xl mt-1 flex-shrink-0" />
                    <span>1 proyecto activo</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-orange-600 text-xl mt-1 flex-shrink-0" />
                    <span>Hasta 50 unidades</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-orange-600 text-xl mt-1 flex-shrink-0" />
                    <span>Galería de fotos y videos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-orange-600 text-xl mt-1 flex-shrink-0" />
                    <span>Dashboard básico</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-orange-600 text-xl mt-1 flex-shrink-0" />
                    <span>Soporte por email</span>
                  </li>
                </ul>
                <Link href="/contact" className="block w-full px-6 py-4 bg-orange-600 text-white rounded-xl font-bold text-center hover:bg-orange-700 transition-all text-lg">
                  Contactar
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-3xl shadow-2xl p-10 text-white transform lg:scale-110 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⭐ MÁS POPULAR
                </div>
                <h3 className="text-2xl font-bold mb-4 mt-2">Multi-Proyecto</h3>
                <div className="text-4xl font-bold mb-6">Desde $XXX/mes</div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <FiZap className="text-yellow-300 text-xl mt-1 flex-shrink-0" />
                    <span>Hasta 5 proyectos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-yellow-300 text-xl mt-1 flex-shrink-0" />
                    <span>Unidades ilimitadas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-yellow-300 text-xl mt-1 flex-shrink-0" />
                    <span>Tours virtuales 360°</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-yellow-300 text-xl mt-1 flex-shrink-0" />
                    <span>Marketing digital incluido</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-yellow-300 text-xl mt-1 flex-shrink-0" />
                    <span>Analytics avanzados</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-yellow-300 text-xl mt-1 flex-shrink-0" />
                    <span>Soporte prioritario 24/7</span>
                  </li>
                </ul>
                <Link href="/contact" className="block w-full px-6 py-4 bg-white text-orange-600 rounded-xl font-bold text-center hover:bg-gray-100 transition-all text-lg">
                  Contactar
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white rounded-3xl shadow-2xl p-10">
                <h3 className="text-2xl font-bold mb-4 text-[#0B2545]">Enterprise</h3>
                <div className="text-4xl font-bold text-orange-600 mb-6">Personalizado</div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <FiZap className="text-orange-600 text-xl mt-1 flex-shrink-0" />
                    <span>Proyectos ilimitados</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-orange-600 text-xl mt-1 flex-shrink-0" />
                    <span>White-label disponible</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-orange-600 text-xl mt-1 flex-shrink-0" />
                    <span>API personalizada</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-orange-600 text-xl mt-1 flex-shrink-0" />
                    <span>Account manager dedicado</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-orange-600 text-xl mt-1 flex-shrink-0" />
                    <span>Capacitación in-house</span>
                  </li>
                </ul>
                <Link href="/contact" className="block w-full px-6 py-4 bg-orange-600 text-white rounded-xl font-bold text-center hover:bg-orange-700 transition-all text-lg">
                  Hablar con Experto
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#0B2545]">Cómo Funciona</h2>
              <p className="text-xl text-gray-600">Empieza a vender en 4 simples pasos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#0B2545]">Crea tu Cuenta</h3>
                <p className="text-gray-600 leading-relaxed">
                  Regístrate en minutos y configura tu perfil de desarrollador
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#0B2545]">Sube tu Proyecto</h3>
                <p className="text-gray-600 leading-relaxed">
                  Agrega fotos, renders, planos y detalles de tus unidades disponibles
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#0B2545]">Promueve</h3>
                <p className="text-gray-600 leading-relaxed">
                  Usa nuestras herramientas de marketing para maximizar la visibilidad
                </p>
              </div>

              {/* Step 4 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg">
                  4
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#0B2545]">Vende Más</h3>
                <p className="text-gray-600 leading-relaxed">
                  Recibe leads calificados y cierra ventas más rápido
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-500 py-24 px-4">
          <div className="max-w-5xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">¿Listo para Vender Más Unidades?</h2>
            <p className="text-2xl md:text-3xl mb-12 text-white/95 leading-relaxed max-w-3xl mx-auto">
              Únete a las constructoras líderes que están revolucionando sus ventas con VIVENTA
            </p>
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
              <Link href="/contact" className="inline-flex items-center gap-3 px-12 py-6 bg-white text-orange-600 font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all text-2xl">
                <FiPhone className="text-3xl" />
                Agendar Demo
              </Link>
              <Link href="/apply" className="inline-flex items-center gap-3 px-12 py-6 border-3 border-white text-white font-bold rounded-2xl hover:bg-white hover:text-orange-600 transition-all text-2xl">
                Empezar Ahora
              </Link>
            </div>
            <p className="mt-8 text-white/80 text-lg">
              ✅ Sin compromiso • ✅ Soporte personalizado • ✅ Resultados garantizados
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
