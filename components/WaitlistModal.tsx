// components/WaitlistModal.tsx
'use client'
import { useState, useEffect } from 'react'
import { FiX, FiMail, FiUser, FiPhone } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface WaitlistModalProps {
  isOpen: boolean
  onClose: () => void
  trigger: 'initial' | 'time' | 'exit' | 'scroll'
}

export default function WaitlistModal({ isOpen, onClose, trigger }: WaitlistModalProps) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'user' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.name) {
      toast.error('Por favor completa tu nombre y email')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/notifications/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          phone: form.phone,
          userType: form.role,
          source: `modal_${trigger}`,
        }),
      })

      if (res.ok) {
        toast.success('¡Gracias! Te notificaremos pronto.')
        localStorage.setItem('viventa_waitlist_submitted', Date.now().toString())
        onClose()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al registrarse')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar"
        >
          <FiX size={24} />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-[#00A676] to-[#3BAFDA] rounded-full mx-auto mb-4 flex items-center justify-center">
              <FiMail className="text-white text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-[#0B2545] mb-2">
              Únete a la Lista de Espera
            </h2>
            <p className="text-gray-600">
              Sé de los primeros en acceder a funcionalidades exclusivas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="waitlist-name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo *
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="waitlist-name"
                  type="text"
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="waitlist-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="waitlist-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="waitlist-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono (opcional)
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="waitlist-phone"
                  type="tel"
                  placeholder="+1 (809) 555-1234"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="waitlist-role" className="block text-sm font-medium text-gray-700 mb-1">
                Estoy interesado como
              </label>
              <select
                id="waitlist-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
              >
                <option value="user">Comprador</option>
                <option value="agent">Agente</option>
                <option value="broker">Broker</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-[#00A676] to-[#3BAFDA] text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Registrando...' : 'Unirme a la Lista'}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            Al registrarte aceptas recibir actualizaciones por email
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
