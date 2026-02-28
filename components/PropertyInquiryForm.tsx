'use client'
import { useState } from 'react'
import { FiX, FiSend, FiMail, FiUser, FiPhone } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { trackContactSubmission, getCurrentUserInfo } from '@/lib/analyticsService'

interface PropertyInquiryFormProps {
  propertyId: string
  propertyTitle: string
  agentName?: string
  agentEmail?: string
  selectedUnitNumber?: string
  selectedUnitModel?: string
  selectedUnitPrice?: number
  selectedUnitSizeMt2?: number
  onClose: () => void
}

export default function PropertyInquiryForm({ 
  propertyId, 
  propertyTitle, 
  agentName, 
  agentEmail,
  selectedUnitNumber,
  selectedUnitModel,
  selectedUnitPrice,
  selectedUnitSizeMt2,
  onClose 
}: PropertyInquiryFormProps) {
  const unitContext = selectedUnitNumber
    ? `Unidad ${selectedUnitNumber}${selectedUnitModel ? ` · ${selectedUnitModel}` : ''}${selectedUnitSizeMt2 ? ` · ${selectedUnitSizeMt2}m²` : ''}${selectedUnitPrice ? ` · ${selectedUnitPrice}` : ''}`
    : ''

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: selectedUnitNumber
      ? `Hola, estoy interesado en la unidad ${selectedUnitNumber} de la propiedad ${propertyTitle}. Me gustaría obtener más información sobre disponibilidad y forma de reserva.`
      : `Hola, estoy interesado en la propiedad: ${propertyTitle}. Me gustaría obtener más información.`,
    visitDate: '',
    preferredContact: 'email'
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/contact/property-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          propertyId,
          propertyTitle,
          unitNumber: selectedUnitNumber || '',
          unitModelType: selectedUnitModel || '',
          unitPrice: selectedUnitPrice || null,
          unitSizeMt2: selectedUnitSizeMt2 || null,
          agentName,
          agentEmail,
          source: 'Property Detail Page'
        })
      })

      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Failed to send inquiry')

      toast.success('¡Consulta enviada! El agente te contactará pronto.')
      
      // Track contact form submission
      const { userId, userRole } = getCurrentUserInfo()
      trackContactSubmission(
        'property_inquiry',
        {
          propertyId,
          propertyTitle,
          unitNumber: selectedUnitNumber || '',
          unitModelType: selectedUnitModel || '',
          preferredContact: formData.preferredContact,
          hasVisitDate: !!formData.visitDate
        },
        userId,
        userRole
      )
      
      onClose()
    } catch (error) {
      toast.error('Error al enviar la consulta. Intenta de nuevo.')
      console.error('Property inquiry error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <FiMail className="text-2xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Consultar Propiedad</h2>
              <p className="text-sm text-white/80">{agentName || 'Agente VIVENTA'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Cerrar formulario"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">{propertyTitle}</p>
            {unitContext && <p className="text-xs text-blue-700 mt-1">{unitContext}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FiUser className="inline mr-1" />
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
                <FiMail className="inline mr-1" />
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
                <FiPhone className="inline mr-1" />
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all"
                placeholder="809-555-1234"
              />
            </div>
          </div>

          <div>
            <label htmlFor="visit-date" className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha preferida para visita (opcional)
            </label>
            <input
              id="visit-date"
              type="date"
              value={formData.visitDate}
              onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Método de contacto preferido
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="preferredContact"
                  value="email"
                  checked={formData.preferredContact === 'email'}
                  onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                  className="w-4 h-4 text-[#00A676] focus:ring-[#00A676]"
                />
                <span className="text-sm text-gray-700">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="preferredContact"
                  value="phone"
                  checked={formData.preferredContact === 'phone'}
                  onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                  className="w-4 h-4 text-[#00A676] focus:ring-[#00A676]"
                />
                <span className="text-sm text-gray-700">Teléfono</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="preferredContact"
                  value="whatsapp"
                  checked={formData.preferredContact === 'whatsapp'}
                  onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                  className="w-4 h-4 text-[#00A676] focus:ring-[#00A676]"
                />
                <span className="text-sm text-gray-700">WhatsApp</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mensaje <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all resize-none"
              placeholder="Cuéntanos más sobre tus necesidades..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="animate-spin">⏳</span> Enviando...
                </>
              ) : (
                <>
                  <FiSend /> Enviar Consulta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
