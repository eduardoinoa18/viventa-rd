"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMail, FiPhone, FiMapPin, FiClock, FiMessageCircle, FiSend } from 'react-icons/fi';

export default function ContactPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'general',
    role: '',
    company: '',
    interests: [] as string[],
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'Contact Page'
        })
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to send message');

      toast.success('¡Mensaje enviado! Te contactaremos pronto.');
      setFormData({ name: '', email: '', phone: '', type: 'general', role: '', company: '', interests: [], message: '' });
    } catch (error) {
      toast.error('Error al enviar el mensaje. Intenta de nuevo.');
      console.error('Contact form error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Header />
      
      {/* Back button - Mobile optimized */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[#004AAD] font-semibold hover:text-[#003d8f] transition-colors active:scale-95"
          >
            <FiArrowLeft className="text-xl" />
            <span>Volver</span>
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0B2545] mb-3">¿Cómo podemos ayudarte?</h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Estamos aquí para responder tus preguntas sobre propiedades, servicios y cualquier consulta.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Contact Form - Takes more space on desktop */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00A676] to-[#00A6A6] rounded-xl flex items-center justify-center text-white">
                <FiSend className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Envíanos un mensaje</h2>
                <p className="text-sm text-gray-500">Te responderemos en menos de 24 horas</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all"
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all"
                    placeholder="juan@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all"
                    placeholder="809-555-1234"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ¿En qué podemos ayudarte? <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all appearance-none bg-white"
                  >
                    <option value="general">Consulta general</option>
                    <option value="buyer">Quiero comprar una propiedad</option>
                    <option value="seller">Quiero vender mi propiedad</option>
                    <option value="agent">Información sobre ser agente</option>
                    <option value="broker">Información sobre ser bróker</option>
                    <option value="developer">Información sobre constructoras</option>
                    <option value="support">Soporte técnico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rol profesional (opcional)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all appearance-none bg-white"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="agent">Agente</option>
                    <option value="broker">Bróker</option>
                    <option value="developer">Constructora/Desarrollador</option>
                    <option value="investor">Inversionista</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Empresa/Compañía (opcional)
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all"
                  placeholder="Nombre de tu empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mensaje <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all resize-none"
                  placeholder="Cuéntanos cómo podemos ayudarte... Por favor incluye detalles relevantes como ubicación, presupuesto, o cualquier pregunta específica."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white py-4 rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-98 text-lg"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Enviando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FiSend /> Enviar mensaje
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Contact Info Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Contact Cards */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-[#0B2545] mb-4">Contacto directo</h2>
              
              <div className="space-y-4">
                <a href="mailto:contacto@viventa.com.do" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors active:scale-98">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#004AAD] rounded-full flex items-center justify-center text-white">
                    <FiMail />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm">Email</h3>
                    <p className="text-gray-600 text-sm truncate">contacto@viventa.com.do</p>
                  </div>
                </a>

                <a href="tel:+18095551234" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors active:scale-98">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#00A676] rounded-full flex items-center justify-center text-white">
                    <FiPhone />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm">Teléfono</h3>
                    <p className="text-gray-600 text-sm">+1 (809) 555-1234</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Office Info */}
            <div className="bg-gradient-to-br from-[#004AAD] to-[#00A6A6] rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-4">Visítanos</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <FiMapPin className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Oficina Central</p>
                    <p className="opacity-90">Av. Winston Churchill, Santo Domingo, República Dominicana</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FiClock className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Horario</p>
                    <p className="opacity-90">Lun - Vie: 9:00 AM - 6:00 PM</p>
                    <p className="opacity-90">Sábado: 10:00 AM - 2:00 PM</p>
                    <p className="opacity-90">Domingo: Cerrado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency CTA */}
            <div className="bg-white border-2 border-[#00A676] rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">¿Necesitas ayuda urgente?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Nuestro equipo está listo para asistirte con cualquier consulta inmediata.
              </p>
              <a 
                href="tel:+18095551234" 
                className="block text-center bg-[#00A676] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#008F64] transition-colors active:scale-98"
              >
                Llamar ahora
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
