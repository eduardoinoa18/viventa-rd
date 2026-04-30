'use client'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  FiCheck, FiUsers, FiTrendingUp, FiDollarSign, FiBarChart2,
  FiMessageSquare, FiTarget, FiZap, FiAward, FiPhone, FiShield,
  FiHome, FiStar,
} from 'react-icons/fi'

export default function ProfessionalsLanding() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative bg-gradient-to-br from-[#0B2545] via-[#0d3060] to-[#0B2545] py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,166,118,0.28),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(59,175,218,0.15),_transparent_32%)]" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center text-white mb-12">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/80 mb-6">
                <FiStar /> VIVENTA Pro
              </span>
              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">La Plataforma MLS #1<br className="hidden md:block" /> para Profesionales en RD</h1>
              <p className="text-xl md:text-2xl text-white/90 mb-4 max-w-4xl mx-auto font-medium">
                Todo lo que necesitas para crecer: CRM integrado, acceso completo al inventario, comisiones automáticas y analytics en tiempo real.
              </p>
              <p className="text-lg text-white/75 max-w-3xl mx-auto">
                Diseñado para agentes, brókers y constructoras que quieren trabajar con tecnología de primer nivel.
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
              <Link href="/apply" className="inline-flex items-center gap-3 px-10 py-5 bg-[#00A676] text-white font-bold rounded-2xl shadow-2xl hover:scale-105 transition-all text-xl">
                <FiZap className="text-2xl" />
                Aplicar Ahora
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-3 px-10 py-5 border-2 border-white/40 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-xl">
                <FiPhone className="text-2xl" />
                Solicitar Demo
              </Link>
            </div>
            <p className="text-center text-white/60 text-sm">
              Únete a los agentes y brókers líderes que ya están creciendo con VIVENTA
            </p>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="bg-white py-16 border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: '10,000+', label: 'Compradores activos mensuales' },
                { value: '500+', label: 'Agentes y brókers registrados' },
                { value: '95%', label: 'Satisfacción de profesionales' },
                { value: '24/7', label: 'Visibilidad en la plataforma' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-4xl md:text-5xl font-black text-[#00A676] mb-2">{value}</div>
                  <p className="text-gray-600">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Who is this for ── */}
        <section className="max-w-7xl mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#0B2545]">Hecho para Cada Tipo de Profesional</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Un solo ecosistema, planes adaptados a tu rol y tamaño de operación.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8" id="planes">
            {/* Agentes */}
            <div className="bg-white rounded-3xl shadow-xl p-10 border-2 border-[#0B2545]/10 hover:border-[#00A676]/50 hover:shadow-2xl transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0B2545] to-[#1a4a7a] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <FiUsers className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#0B2545]">Agentes</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Independientes o dentro de una inmobiliaria. Accede al inventario más completo de RD y cierra más ventas con menos tiempo.</p>
              <ul className="space-y-3 mb-8 text-sm text-gray-700">
                {['Acceso completo al MLS', 'CRM personal integrado', 'Gestión de leads y seguimiento', 'Reportes de rendimiento', 'Calculadora de comisiones', 'Perfil público verificado'].map(feat => (
                  <li key={feat} className="flex items-start gap-3">
                    <FiCheck className="text-[#00A676] text-lg mt-0.5 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link href="/apply" className="block w-full text-center px-6 py-3 bg-[#0B2545] text-white rounded-xl font-semibold hover:bg-[#12355f] transition-colors">
                Aplicar como Agente
              </Link>
            </div>

            {/* Brókers */}
            <div className="relative bg-white rounded-3xl shadow-2xl p-10 border-2 border-[#00A676] hover:shadow-3xl transition-all">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00A676] text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg">
                Más popular
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#00A676] to-[#008060] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <FiTrendingUp className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#0B2545]">Brókers</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Gestiona tu inmobiliaria, tu equipo de agentes y tu cartera de propiedades desde un solo panel de control.
              </p>
              <ul className="space-y-3 mb-8 text-sm text-gray-700">
                {['Todo del plan Agente', 'Gestión de equipo de agentes', 'Dashboard de oficina con KPIs', 'Asignación y rastreo de leads', 'Comisiones y splits automáticos', 'Pipeline Kanban de transacciones', 'Soporte prioritario dedicado'].map(feat => (
                  <li key={feat} className="flex items-start gap-3">
                    <FiCheck className="text-[#00A676] text-lg mt-0.5 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link href="/apply" className="block w-full text-center px-6 py-3 bg-[#00A676] text-white rounded-xl font-semibold hover:bg-[#008060] transition-colors">
                Aplicar como Bróker
              </Link>
            </div>

            {/* Constructoras */}
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-3xl shadow-xl p-10 border-2 border-orange-200 hover:border-orange-400/60 hover:shadow-2xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <FiHome className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#0B2545]">Constructoras</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Promociona tus proyectos, conecta con la red de agentes VIVENTA y vende unidades más rápido con datos en tiempo real.</p>
              <ul className="space-y-3 mb-8 text-sm text-gray-700">
                {['Showcase de proyectos premium', 'Gestión de inventario por unidad', 'Red de 500+ agentes activos', 'Leads calificados automáticos', 'Analytics de proyecto y mercado', 'Integración con tours virtuales', 'Plan personalizado por volumen'].map(feat => (
                  <li key={feat} className="flex items-start gap-3">
                    <FiCheck className="text-orange-600 text-lg mt-0.5 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link href="/constructoras" className="block w-full text-center px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors">
                Ver Plan Constructoras
              </Link>
            </div>
          </div>
        </section>

        {/* ── Platform Features ── */}
        <section className="bg-gradient-to-br from-[#0B2545] to-[#091e38] py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Una Plataforma Completa para Todo el Ciclo de Venta</h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Desde el primer contacto con un lead hasta el cierre y cobro de comisión, VIVENTA lo cubre todo.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: FiTarget, color: 'bg-[#00A676]', title: 'CRM Integrado', body: 'Gestiona leads, deals y clientes en un pipeline Kanban claro con estados de ciclo de vida completos.' },
                { icon: FiBarChart2, color: 'bg-blue-600', title: 'Analytics en Tiempo Real', body: 'KPIs de rendimiento, valor del pipeline, comisiones ganadas y comparativos de mercado.' },
                { icon: FiDollarSign, color: 'bg-emerald-600', title: 'Comisiones Automáticas', body: 'Splits configurable por oficina, cálculo automático y seguimiento del estado de pago por transacción.' },
                { icon: FiMessageSquare, color: 'bg-purple-600', title: 'Mensajería Interna', body: 'Comunicación directa entre agentes, brókers y compradores dentro de la plataforma.' },
                { icon: FiShield, color: 'bg-rose-600', title: 'Datos Seguros', body: 'Sesiones verificadas, roles y permisos granulares por portal, cumplimiento de datos DR.' },
                { icon: FiAward, color: 'bg-orange-600', title: 'Perfil Verificado Público', body: 'Tu perfil profesional indexado en Google, enlazado desde listados y visible para compradores.' },
              ].map(({ icon: Icon, color, title, body }) => (
                <div key={title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/15 hover:bg-white/15 transition-all">
                  <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4 shadow`}>
                    <Icon className="text-2xl text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-gray-300 leading-relaxed text-sm">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="max-w-7xl mx-auto px-4 py-24">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#0B2545]">Profesionales que Ya Confían en VIVENTA</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: 'Desde que me uní a VIVENTA, cerramos ventas un 35% más rápido. El CRM y el pipeline son exactamente lo que necesitaba.', name: 'Carlos M.', role: 'Agente Inmobiliario', city: 'Santo Domingo' },
              { quote: 'Gestionar mi equipo de 12 agentes nunca fue tan fácil. Los reportes de comisiones automáticos nos ahorran horas cada semana.', name: 'Ana R.', role: 'Bróker / Directora', city: 'Santiago de los Caballeros' },
              { quote: 'La visibilidad que nos da VIVENTA para nuestros proyectos es incomparable. Los leads llegan calificados y listos para conversar.', name: 'Miguel F.', role: 'Director de Ventas', city: 'Punta Cana' },
            ].map(({ quote, name, role, city }) => (
              <div key={name} className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
                <div className="flex gap-1 mb-4">{[1,2,3,4,5].map(s => <FiStar key={s} className="text-[#00A676] fill-[#00A676]" />)}</div>
                <p className="text-gray-700 italic leading-relaxed mb-6">&ldquo;{quote}&rdquo;</p>
                <div>
                  <div className="font-bold text-[#0B2545]">{name}</div>
                  <div className="text-sm text-gray-500">{role} · {city}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Affiliated Companies ── */}
        <section className="bg-slate-50 border-y py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-8">Trabajamos con las mejores inmobiliarias de RD</p>
            <div className="flex flex-wrap justify-center gap-4">
              {['RE/MAX RD', 'Century 21 Dominicana', 'Keller Williams RD', "Santo Domingo Sotheby's", 'Grupo Puntacana Realty'].map(co => (
                <span key={co} className="rounded-xl bg-white border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 shadow-sm">{co}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="bg-gradient-to-r from-[#0B2545] to-[#0d3060] py-24 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">¿Listo para Crecer con VIVENTA?</h2>
            <p className="text-xl text-white/80 mb-10">Aplica hoy. Aprobación en menos de 48 horas para profesionales verificados.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/apply" className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#00A676] text-white font-bold rounded-2xl shadow-xl hover:scale-105 transition-all text-xl">
                <FiZap /> Aplicar Ahora
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-3 px-10 py-5 border-2 border-white/40 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-xl">
                <FiMessageSquare /> Contáctanos
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}

