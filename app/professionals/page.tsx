'use client'
import { useState } from 'react'
import { db } from '../../lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { FiDollarSign, FiUsers, FiTrendingUp, FiMessageSquare, FiMail, FiPhone } from 'react-icons/fi'

export default function ProfessionalsPage(){
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [message,setMessage]=useState('')

  async function submitLead(){
    if(!email) return alert('Email requerido')
    await addDoc(collection(db,'marketing_leads'), { name,email,message, createdAt: serverTimestamp(), source:'professionals' })
    setName(''); setEmail(''); setMessage(''); alert('¡Gracias! Te contactaremos pronto.')
  }

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
              <a href="#contact" className="px-6 py-3 bg-[#00A6A6] text-white rounded-lg font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#008f8f] transition-colors">
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
              <a href="#contact" className="block w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold text-center hover:bg-orange-700 transition-colors">
                Contactar para más información
              </a>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">¿Listo para comenzar?</h2>
            <p className="text-gray-600 mb-6">Déjanos tus datos y un miembro de nuestro equipo te contactará para conocer tus necesidades y ayudarte a elegir el mejor plan.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Juan Pérez" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Correo electrónico</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="juan@ejemplo.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mensaje (opcional)</label>
                <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Cuéntanos sobre tu empresa o tus necesidades..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={4}/>
              </div>
              <button onClick={submitLead} className="w-full px-6 py-3 bg-[#00A6A6] text-white rounded-lg font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#008f8f] transition-colors">
                <FiMessageSquare /> Enviar Mensaje
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Información de Contacto</h2>
            <p className="mb-8 text-blue-100">Estamos aquí para ayudarte. Contáctanos por cualquiera de estos medios.</p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <FiMail className="text-2xl mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Email</div>
                  <a href="mailto:info@viventa.com.do" className="text-blue-100 hover:text-white">info@viventa.com.do</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <FiPhone className="text-2xl mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Teléfono</div>
                  <a href="tel:+18095551234" className="text-blue-100 hover:text-white">+1 (809) 555-1234</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <FiMessageSquare className="text-2xl mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">WhatsApp</div>
                  <a href="https://wa.me/18095551234" target="_blank" rel="noopener noreferrer" className="text-blue-100 hover:text-white">+1 (809) 555-1234</a>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-blue-400">
              <p className="text-sm text-blue-100">Horario de atención:</p>
              <p className="font-semibold">Lunes a Viernes: 9:00 AM - 6:00 PM</p>
              <p className="font-semibold">Sábados: 9:00 AM - 1:00 PM</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
