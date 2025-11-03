'use client'
import { FiDollarSign, FiUsers, FiTrendingUp, FiMessageSquare } from 'react-icons/fi'

export default function ProfessionalsPage(){
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-[#004AAD] to-[#00A6A6] rounded-2xl overflow-hidden mb-12">
          <div className="p-10 md:p-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white">VIVENTA para Profesionales</h1>
            <p className="mt-4 text-white text-lg max-w-2xl">Una plataforma MLS moderna para corredores, agentes y desarrolladores en la República Dominicana. Rápida, colaborativa y lista para escalar.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a href="#pricing" className="px-6 py-3 bg-white text-[#004AAD] rounded-lg font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                <FiDollarSign /> Ver Planes
              </a>
              <a href="/contact" className="px-6 py-3 bg-[#00A6A6] text-white rounded-lg font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#008f8f] transition-colors">
                <FiMessageSquare /> Contáctanos
              </a>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Planes y Precios</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Agent Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <FiUsers className="text-3xl text-[#004AAD]" />
                <h3 className="text-2xl font-bold text-gray-800">Agentes</h3>
              </div>
              <div className="text-4xl font-extrabold text-gray-800 mb-6">
                Próximamente
              </div>
              <p className="text-gray-600 mb-6">Plan ideal para agentes independientes buscando acceso a MLS profesional</p>
              <ul className="space-y-3 mb-8 text-sm text-gray-700">
                <li className="flex items-start gap-2">✓ Acceso completo al MLS</li>
                <li className="flex items-start gap-2">✓ Gestión de propiedades</li>
                <li className="flex items-start gap-2">✓ CRM integrado</li>
                <li className="flex items-start gap-2">✓ Reportes y analytics</li>
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
                <h3 className="text-2xl font-bold text-gray-800">Brókers</h3>
              </div>
              <div className="text-4xl font-extrabold text-gray-800 mb-6">
                Próximamente
              </div>
              <p className="text-gray-600 mb-6">Solución completa para inmobiliarias con equipos de agentes</p>
              <ul className="space-y-3 mb-8 text-sm text-gray-700">
                <li className="flex items-start gap-2">✓ Todo del plan Agente</li>
                <li className="flex items-start gap-2">✓ Gestión de equipo</li>
                <li className="flex items-start gap-2">✓ Dashboard administrativo</li>
                <li className="flex items-start gap-2">✓ Comisiones automatizadas</li>
                <li className="flex items-start gap-2">✓ Soporte prioritario</li>
              </ul>
              <a href="/apply" className="block w-full px-6 py-3 bg-[#00A6A6] text-white rounded-lg font-semibold text-center hover:bg-[#008f8f] transition-colors">
                Solicitar Acceso
              </a>
            </div>

            {/* Developer Contact */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-lg p-8 border-2 border-orange-200">
              <div className="flex items-center gap-3 mb-4">
                <FiDollarSign className="text-3xl text-orange-600" />
                <h3 className="text-2xl font-bold text-gray-800">Constructoras</h3>
              </div>
              <div className="text-lg font-semibold text-gray-800 mb-6">
                Soluciones Personalizadas
              </div>
              <p className="text-gray-700 mb-6">¿Quieres destacar tus proyectos en VIVENTA? Ofrecemos planes personalizados para desarrolladores y constructoras.</p>
              <ul className="space-y-3 mb-8 text-sm text-gray-700">
                <li className="flex items-start gap-2">✓ Showcase de proyectos</li>
                <li className="flex items-start gap-2">✓ Integración con tu inventario</li>
                <li className="flex items-start gap-2">✓ Marketing destacado</li>
                <li className="flex items-start gap-2">✓ Análisis de mercado</li>
              </ul>
              <a href="/contact" className="block w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold text-center hover:bg-orange-700 transition-colors">
                Contactar para más información
              </a>
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Historias de Éxito</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map((i)=> (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="text-gray-700 italic">“Desde que nos unimos a VIVENTA, nuestro flujo de leads cualificados creció y cerramos ventas más rápido.”</div>
                <div className="mt-4 font-semibold text-gray-900">Agencia {i}</div>
                <div className="text-sm text-gray-500">Santo Domingo</div>
              </div>
            ))}
          </div>
        </section>

        {/* Affiliated Companies + CTA */}
        <section className="mb-12">
          <div className="rounded-2xl bg-gradient-to-r from-viventa-turquoise-500 to-viventa-ocean-500 p-6 md:p-8 text-white">
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold">Empresas Afiliadas</h3>
                <p className="text-white/85">Trabajamos con corredores y brókers líderes en República Dominicana.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-white/90">
                <div className="bg-white/10 rounded-lg px-4 py-2">RE/MAX RD</div>
                <div className="bg-white/10 rounded-lg px-4 py-2">Century 21 Dominicana</div>
                <div className="bg-white/10 rounded-lg px-4 py-2">Keller Williams RD</div>
                <div className="bg-white/10 rounded-lg px-4 py-2">Santo Domingo Sotheby's</div>
              </div>
              <div className="text-center mt-2">
                <p className="text-white/90 mb-3">Join VIVENTA Pro and grow with the leading MLS in the Caribbean.</p>
                <a href="/apply" className="inline-block px-8 py-3 bg-white text-viventa-ocean font-bold rounded-xl shadow-lg hover:scale-105 transition-all">Apply Now</a>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA Section */}
        <section className="bg-gradient-to-r from-[#004AAD] to-[#00A6A6] rounded-2xl overflow-hidden p-10 md:p-16 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para unirte a VIVENTA?</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">Contáctanos hoy y descubre cómo podemos ayudarte a crecer tu negocio inmobiliario.</p>
          <a href="/contact" className="inline-block px-8 py-4 bg-white text-[#004AAD] rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg">
            Contáctanos Ahora
          </a>
        </section>
      </div>
    </div>
  )
}
