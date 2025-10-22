"use client";
import { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'general',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to send message');

      toast.success('¡Mensaje enviado! Te contactaremos pronto.');
      setFormData({ name: '', email: '', phone: '', type: 'general', message: '' });
    } catch (error) {
      toast.error('Error al enviar el mensaje. Intenta de nuevo.');
      console.error('Contact form error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#0B2545] mb-4">Contáctanos</h1>
          <p className="text-gray-600 text-lg">
            ¿Tienes alguna pregunta? Estamos aquí para ayudarte.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-[#0B2545] mb-6">Envíanos un mensaje</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  placeholder="juan@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  placeholder="809-555-1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de consulta <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                >
                  <option value="general">Consulta general</option>
                  <option value="buyer">Quiero comprar</option>
                  <option value="seller">Quiero vender</option>
                  <option value="agent">Ser agente</option>
                  <option value="support">Soporte técnico</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  placeholder="Cuéntanos cómo podemos ayudarte..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#00A676] text-white py-3 rounded-lg font-semibold hover:bg-[#008F64] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-[#0B2545] mb-6">Información de contacto</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#00A676] rounded-full flex items-center justify-center text-white">
                    📧
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">contacto@viventa.com.do</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#00A676] rounded-full flex items-center justify-center text-white">
                    📱
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Teléfono</h3>
                    <p className="text-gray-600">+1 (809) 555-1234</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#00A676] rounded-full flex items-center justify-center text-white">
                    📍
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Oficina</h3>
                    <p className="text-gray-600">
                      Av. Winston Churchill<br />
                      Santo Domingo, República Dominicana
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#00A676] rounded-full flex items-center justify-center text-white">
                    🕐
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Horario</h3>
                    <p className="text-gray-600">
                      Lunes - Viernes: 9:00 AM - 6:00 PM<br />
                      Sábado: 10:00 AM - 2:00 PM<br />
                      Domingo: Cerrado
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#00A676] to-[#3BAFDA] rounded-xl shadow-lg p-8 text-white">
              <h3 className="text-xl font-bold mb-3">¿Necesitas ayuda inmediata?</h3>
              <p className="mb-4">Nuestro equipo está disponible para asistirte en tu búsqueda del hogar perfecto.</p>
              <a 
                href="tel:+18095551234" 
                className="inline-block bg-white text-[#00A676] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Llamar ahora
              </a>
            </div>
          </div>
        </div>

        {/* Map Section (Optional) */}
        <div className="mt-12 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-64 bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">Mapa de ubicación (próximamente)</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
