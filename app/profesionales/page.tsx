import Footer from '../../components/Footer'
import Header from '../../components/Header'
import Link from 'next/link'
import { FiHome, FiBarChart2, FiCpu, FiCompass, FiShield, FiDollarSign, FiUsers, FiTrendingUp, FiStar, FiLogIn, FiUserPlus, FiZap, FiTarget, FiAward, FiCheck, FiPhone } from 'react-icons/fi'

// Avoid static generation timeouts by rendering this page dynamically at runtime
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ProfesionalesLanding() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-[#004AAD] to-[#00A6A6] py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center text-white mb-12">
              <h1 className="text-5xl md:text-7xl font-bold mb-6">Potencia tu Carrera Inmobiliaria</h1>
              <p className="text-2xl md:text-3xl text-white/95 mb-4 max-w-4xl mx-auto font-semibold">
                El MLS #1 de República Dominicana para Agentes y Brókers
              </p>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Más listados, mejores herramientas, mayor productividad. Todo lo que necesitas para cerrar más ventas.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-8">
              <Link href="/apply" className="inline-flex items-center gap-3 px-12 py-6 bg-white text-[#004AAD] font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all text-2xl">
                <FiUserPlus className="text-3xl" />
                Solicitar Acceso
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-3 px-12 py-6 border-3 border-white text-white font-bold rounded-2xl hover:bg-white hover:text-[#004AAD] transition-all text-2xl">
                <FiPhone className="text-3xl" />
                Agendar Demo
              </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <Link href="/agent/login" className="inline-flex items-center gap-2 px-6 py-3 bg-white/90 text-[#004AAD] font-semibold rounded-xl hover:bg-white transition-colors">
                <FiLogIn /> Portal de Agentes
              </Link>
              <Link href="/broker/login" className="inline-flex items-center gap-2 px-6 py-3 bg-white/90 text-[#00A6A6] font-semibold rounded-xl hover:bg-white transition-colors">
                <FiLogIn /> Portal de Brókers
              </Link>
            </div>

            <p className="text-center text-white/80 text-lg mt-6">
              ✨ Únete a 500+ profesionales inmobiliarios que confían en VIVENTA
            </p>
          </div>
        </section>

        {/* Key Stats Section */}
        <section className="bg-white py-16 border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold text-[#004AAD] mb-2">15,000+</div>
                <p className="text-gray-600 text-lg">Propiedades Activas</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-[#004AAD] mb-2">500+</div>
                <p className="text-gray-600 text-lg">Profesionales Activos</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-[#004AAD] mb-2">98%</div>
                <p className="text-gray-600 text-lg">Satisfacción de Usuarios</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-[#004AAD] mb-2">40%</div>
                <p className="text-gray-600 text-lg">Aumento en Ventas Promedio</p>
              </div>
            </div>
          </div>
        </section>

        {/* Value Propositions */}
        <section className="max-w-7xl mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-[#0B2545]">¿Por Qué Elegir VIVENTA?</h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">
              Las herramientas más poderosas del mercado para impulsar tu negocio inmobiliario
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
            {/* Value Prop 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-3xl shadow-2xl p-10 hover:shadow-3xl transition-all border-2 border-blue-200">
              <div className="w-20 h-20 bg-gradient-to-br from-[#004AAD] to-[#0066cc] rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <FiHome className="text-4xl text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-[#0B2545]">Acceso Total al MLS</h3>
              <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                15,000+ propiedades exclusivas al alcance de tu mano. El inventario más grande del Caribe.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <FiCheck className="text-[#004AAD] text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Listados verificados y actualizados en tiempo real</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-[#004AAD] text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Búsqueda avanzada y filtros inteligentes</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-[#004AAD] text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Alertas automáticas de nuevas propiedades</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-[#004AAD] text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Historial de precios y tendencias de mercado</span>
                </li>
              </ul>
            </div>

            {/* Value Prop 2 */}
            <div className="bg-gradient-to-br from-teal-50 to-white rounded-3xl shadow-2xl p-10 hover:shadow-3xl transition-all border-2 border-teal-200">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00A6A6] to-[#00C896] rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <FiCpu className="text-4xl text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-[#0B2545]">CRM Completo</h3>
              <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                Gestiona clientes, leads y oportunidades en una sola plataforma integrada.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <FiCheck className="text-[#00A6A6] text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Seguimiento automatizado de leads</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-[#00A6A6] text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Calendario integrado con recordatorios</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-[#00A6A6] text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Email marketing y comunicación masiva</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-[#00A6A6] text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Pipeline visual de ventas</span>
                </li>
              </ul>
            </div>

            {/* Value Prop 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-3xl shadow-2xl p-10 hover:shadow-3xl transition-all border-2 border-purple-200">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <FiBarChart2 className="text-4xl text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-[#0B2545]">Analytics Poderosos</h3>
              <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                Datos en tiempo real para tomar decisiones inteligentes y cerrar más ventas.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <FiCheck className="text-purple-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Dashboard con métricas clave de rendimiento</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-purple-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Reportes detallados de comisiones</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-purple-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Análisis de mercado comparativo (CMA)</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-purple-600 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Proyecciones y pronósticos de ventas</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Platform Features - Enhanced */}
        <section className="relative bg-gradient-to-br from-[#0B2545] to-[#004AAD] py-24">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Todas las Herramientas que Necesitas</h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Una plataforma completa diseñada para profesionales inmobiliarios modernos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <FiTarget className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Gestión de Listados</h3>
                <p className="text-gray-300 leading-relaxed">
                  Publica, edita y administra tus propiedades con facilidad. Sincronización automática con portales externos.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center mb-4">
                  <FiUsers className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Colaboración en Red</h3>
                <p className="text-gray-300 leading-relaxed">
                  Conecta con otros agentes, comparte listados y aumenta tu alcance en todo el país.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-4">
                  <FiDollarSign className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Calculadora Financiera</h3>
                <p className="text-gray-300 leading-relaxed">
                  Herramientas integradas para calcular hipotecas, ROI y costos de cierre al instante.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center mb-4">
                  <FiCompass className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Mapas Interactivos</h3>
                <p className="text-gray-300 leading-relaxed">
                  Visualiza propiedades en mapas avanzados con datos de zonas, escuelas y amenidades.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <FiShield className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Documentos Seguros</h3>
                <p className="text-gray-300 leading-relaxed">
                  Almacenamiento seguro en la nube para contratos, formularios y documentos importantes.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 bg-yellow-600 rounded-xl flex items-center justify-center mb-4">
                  <FiZap className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">App Móvil</h3>
                <p className="text-gray-300 leading-relaxed">
                  Acceso completo desde tu smartphone. Trabaja desde cualquier lugar, en cualquier momento.
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
              <p className="text-xl text-gray-600">Profesionales que han transformado sus resultados con VIVENTA</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {/* Professional Story 1 */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-lg border-2 border-blue-200 hover:border-blue-400 transition-all">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-700 text-lg leading-relaxed mb-6 italic">
                  &quot;Desde que uso VIVENTA, mis ventas aumentaron un 40%. El sistema de leads y el CRM integrado me permiten gestionar más clientes eficientemente.&quot;
                </p>
                <div>
                  <h4 className="font-bold text-[#0B2545] text-lg">Roberto Sánchez</h4>
                  <p className="text-gray-600">Agente Top • Santo Domingo</p>
                  <p className="text-[#004AAD] font-semibold mt-2">⭐ 45 propiedades vendidas en 2024</p>
                </div>
              </div>

              {/* Professional Story 2 */}
              <div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl p-8 shadow-lg border-2 border-teal-200 hover:border-teal-400 transition-all">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-700 text-lg leading-relaxed mb-6 italic">
                  &quot;La herramienta perfecta para gestionar mi equipo de 15 agentes. Los reportes en tiempo real me dan control total del negocio.&quot;
                </p>
                <div>
                  <h4 className="font-bold text-[#0B2545] text-lg">Patricia Jiménez</h4>
                  <p className="text-gray-600">Broker • Punta Cana</p>
                  <p className="text-[#00A6A6] font-semibold mt-2">⭐ Gestiona equipo de 15 agentes</p>
                </div>
              </div>

              {/* Professional Story 3 */}
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 shadow-lg border-2 border-purple-200 hover:border-purple-400 transition-all">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-700 text-lg leading-relaxed mb-6 italic">
                  &quot;VIVENTA transformó mi forma de trabajar. La plataforma es intuitiva y me ayuda a cerrar ventas más rápido que nunca.&quot;
                </p>
                <div>
                  <h4 className="font-bold text-[#0B2545] text-lg">Ana Fernández</h4>
                  <p className="text-gray-600">Agente • Santiago</p>
                  <p className="text-purple-600 font-semibold mt-2">⭐ 3x más productiva en 6 meses</p>
                </div>
              </div>
            </div>

            {/* Featured Story */}
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-3xl shadow-2xl p-12 border-2 border-blue-300">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-32 h-32 bg-gradient-to-br from-[#004AAD] to-[#00A6A6] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-4xl">RS</span>
                </div>
                <div className="flex-1">
                  <div className="text-6xl font-bold text-[#004AAD] mb-4">+40% ventas</div>
                  <p className="text-2xl text-gray-700 mb-4 leading-relaxed italic">
                    &quot;Con VIVENTA, no solo mejoré mis números, transformé completamente mi negocio. Tengo más tiempo, más clientes y mejores comisiones.&quot;
                  </p>
                  <div>
                    <h4 className="text-xl font-bold text-[#0B2545]">Roberto Sánchez</h4>
                    <p className="text-gray-600">Agente Independiente • Santo Domingo</p>
                    <p className="text-[#004AAD] font-semibold mt-2">🏆 Agente del Año 2024 • Zona Colonial</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-gradient-to-br from-[#004AAD] to-[#00A6A6] py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">Planes Profesionales</h2>
              <p className="text-2xl text-white/90 max-w-3xl mx-auto">
                Elige el plan que mejor se adapte a tu negocio y empieza a vender más
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Agent Plan */}
              <div className="bg-white rounded-3xl shadow-2xl p-10">
                <div className="flex items-center gap-3 mb-4">
                  <FiUsers className="text-4xl text-[#004AAD]" />
                  <h3 className="text-3xl font-bold">Plan Agente</h3>
                </div>
                <div className="text-5xl font-bold text-[#004AAD] mb-6">Próximamente</div>
                <p className="text-gray-600 mb-8 text-lg">Perfecto para agentes independientes que buscan crecer</p>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3">
                    <FiZap className="text-[#004AAD] text-2xl mt-1 flex-shrink-0" />
                    <span className="text-gray-700 text-lg"><strong>Listados ilimitados</strong> de propiedades</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-[#004AAD] text-2xl mt-1 flex-shrink-0" />
                    <span className="text-gray-700 text-lg"><strong>CRM completo</strong> con seguimiento de leads</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-[#004AAD] text-2xl mt-1 flex-shrink-0" />
                    <span className="text-gray-700 text-lg"><strong>Analytics y reportes</strong> en tiempo real</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-[#004AAD] text-2xl mt-1 flex-shrink-0" />
                    <span className="text-gray-700 text-lg"><strong>App móvil</strong> iOS y Android</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-[#004AAD] text-2xl mt-1 flex-shrink-0" />
                    <span className="text-gray-700 text-lg"><strong>Soporte técnico</strong> estándar</span>
                  </li>
                </ul>
                <Link href="/apply" className="block w-full px-6 py-4 bg-[#004AAD] text-white rounded-xl font-bold text-center hover:bg-[#003d8f] transition-all text-lg">
                  Solicitar Acceso
                </Link>
              </div>

              {/* Broker Plan */}
              <div className="bg-gradient-to-br from-[#00A6A6] to-[#00C896] rounded-3xl shadow-2xl p-10 text-white transform lg:scale-105 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⭐ RECOMENDADO
                </div>
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <FiTrendingUp className="text-4xl text-white" />
                  <h3 className="text-3xl font-bold">Plan Bróker</h3>
                </div>
                <div className="text-5xl font-bold mb-6">Próximamente</div>
                <p className="text-white/90 mb-8 text-lg">Ideal para brókers y líderes de equipos inmobiliarios</p>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3">
                    <FiZap className="text-yellow-300 text-2xl mt-1 flex-shrink-0" />
                    <span className="text-lg"><strong>Todo del Plan Agente</strong> incluido</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-yellow-300 text-2xl mt-1 flex-shrink-0" />
                    <span className="text-lg"><strong>Panel de equipo</strong> con gestión completa</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-yellow-300 text-2xl mt-1 flex-shrink-0" />
                    <span className="text-lg"><strong>CRM avanzado</strong> multi-agente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-yellow-300 text-2xl mt-1 flex-shrink-0" />
                    <span className="text-lg"><strong>Comisiones automatizadas</strong> y splits</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-yellow-300 text-2xl mt-1 flex-shrink-0" />
                    <span className="text-lg"><strong>Reportes ejecutivos</strong> detallados</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiZap className="text-yellow-300 text-2xl mt-1 flex-shrink-0" />
                    <span className="text-lg"><strong>Soporte prioritario 24/7</strong></span>
                  </li>
                </ul>
                <Link href="/apply" className="block w-full px-6 py-4 bg-white text-[#00A6A6] rounded-xl font-bold text-center hover:bg-gray-100 transition-all text-lg">
                  Solicitar Acceso
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
              <p className="text-xl text-gray-600">Empieza a usar VIVENTA en 4 simples pasos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#004AAD] to-[#0066cc] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#0B2545]">Solicita Acceso</h3>
                <p className="text-gray-600 leading-relaxed">
                  Completa el formulario de solicitud profesional en menos de 2 minutos
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#004AAD] to-[#0066cc] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#0B2545]">Verificación</h3>
                <p className="text-gray-600 leading-relaxed">
                  Nuestro equipo verifica tu licencia y credenciales profesionales
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#004AAD] to-[#0066cc] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#0B2545]">Configuración</h3>
                <p className="text-gray-600 leading-relaxed">
                  Personaliza tu perfil y recibe capacitación gratuita de la plataforma
                </p>
              </div>

              {/* Step 4 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#004AAD] to-[#0066cc] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg">
                  4
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#0B2545]">¡A Vender!</h3>
                <p className="text-gray-600 leading-relaxed">
                  Accede al MLS completo y empieza a cerrar más ventas inmediatamente
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Professional Login Portal Section - Moved Down */}
        <section className="bg-gradient-to-br from-blue-50 to-teal-50 py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#0B2545]">Acceso Profesional</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                ¿Ya tienes cuenta? Accede a tu portal con herramientas avanzadas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Agent Portal Card */}
              <Link href="/agent/login" className="group">
                <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-[#004AAD]">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#004AAD] to-[#0066cc] rounded-2xl flex items-center justify-center shadow-lg">
                      <FiUsers className="text-3xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#0B2545]">Portal de Agentes</h3>
                      <p className="text-gray-500">Para agentes inmobiliarios</p>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-gray-700">✓ Gestión de listados ilimitados</li>
                    <li className="flex items-start gap-2 text-gray-700">✓ CRM completo de clientes</li>
                    <li className="flex items-start gap-2 text-gray-700">✓ Analytics de rendimiento</li>
                    <li className="flex items-start gap-2 text-gray-700">✓ Calendario y recordatorios</li>
                  </ul>
                  <div className="flex items-center justify-between text-[#004AAD] font-bold text-lg group-hover:translate-x-2 transition-transform">
                    <span>Iniciar Sesión</span>
                    <FiLogIn className="text-2xl" />
                  </div>
                </div>
              </Link>

              {/* Broker Portal Card */}
              <Link href="/broker/login" className="group">
                <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-[#00A6A6]">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#00A6A6] to-[#00C896] rounded-2xl flex items-center justify-center shadow-lg">
                      <FiTrendingUp className="text-3xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#0B2545]">Portal de Brókers</h3>
                      <p className="text-gray-500">Para brókers y gerentes</p>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-gray-700">✓ Gestión de equipo completa</li>
                    <li className="flex items-start gap-2 text-gray-700">✓ Dashboard ejecutivo avanzado</li>
                    <li className="flex items-start gap-2 text-gray-700">✓ Reportes y comisiones automáticas</li>
                    <li className="flex items-start gap-2 text-gray-700">✓ Supervisión de agentes en tiempo real</li>
                  </ul>
                  <div className="flex items-center justify-between text-[#00A6A6] font-bold text-lg group-hover:translate-x-2 transition-transform">
                    <span>Iniciar Sesión</span>
                    <FiLogIn className="text-2xl" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Affiliated Companies CTA */}
        <section className="bg-gradient-to-br from-[#0B2545] to-[#004AAD] py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Únete a las Mejores Empresas</h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Forma parte de la red inmobiliaria más grande de República Dominicana
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center mb-12">
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg">
                <span className="font-bold text-xl text-gray-700">RE/MAX RD</span>
              </div>
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg">
                <span className="font-bold text-xl text-gray-700">Century 21</span>
              </div>
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg">
                <span className="font-bold text-xl text-gray-700">Keller Williams</span>
              </div>
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg">
                <span className="font-bold text-xl text-gray-700">Sotheby&apos;s RD</span>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-white/90 mb-6 text-xl">500+ profesionales ya confían en VIVENTA</p>
              <Link href="/apply" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-[#004AAD] rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-xl text-xl">
                <FiUserPlus className="text-2xl" />
                Solicitar Acceso Profesional
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-gradient-to-r from-[#004AAD] to-[#00A6A6] py-24 px-4">
          <div className="max-w-5xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">¿Listo para Transformar tu Negocio?</h2>
            <p className="text-2xl md:text-3xl mb-12 text-white/95 leading-relaxed max-w-3xl mx-auto">
              Únete a los profesionales inmobiliarios más exitosos de República Dominicana
            </p>
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
              <Link href="/apply" className="inline-flex items-center gap-3 px-12 py-6 bg-white text-[#004AAD] font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all text-2xl">
                <FiUserPlus className="text-3xl" />
                Solicitar Acceso
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-3 px-12 py-6 border-3 border-white text-white font-bold rounded-2xl hover:bg-white hover:text-[#004AAD] transition-all text-2xl">
                <FiPhone className="text-3xl" />
                Hablar con un Experto
              </Link>
            </div>
            <p className="mt-8 text-white/80 text-lg">
              ✅ Capacitación gratuita • ✅ Soporte 24/7 • ✅ Resultados comprobados
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
