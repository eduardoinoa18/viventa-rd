// components/InviteModal.tsx
'use client'
/* eslint-disable react/no-unescaped-entities */
import { useState } from 'react'
import { FiX, FiMail, FiUser, FiBriefcase, FiSend, FiCopy, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'

type InviteType = 'agent' | 'broker' | 'user'

type Props = {
  onClose: () => void
  inviteType: InviteType
  onSuccess?: () => void
}

export default function InviteModal({ onClose, inviteType, onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  const getTitle = () => {
    switch (inviteType) {
      case 'agent':
        return 'Invitar agente'
      case 'broker':
        return 'Invitar broker'
      case 'user':
        return 'Invitar usuario'
      default:
        return 'Enviar invitacion'
    }
  }

  const getDescription = () => {
    switch (inviteType) {
      case 'agent':
        return 'Crea una invitacion para sumar un agente a tu estructura en VIVENTA'
      case 'broker':
        return 'Invita un broker para completar su activacion en la plataforma'
      case 'user':
        return 'Comparte un acceso guiado para completar su perfil en la plataforma'
      default:
        return 'Enviar invitacion'
    }
  }

  const getIcon = () => {
    switch (inviteType) {
      case 'agent':
        return <FiUser className="text-3xl" />
      case 'broker':
        return <FiBriefcase className="text-3xl" />
      default:
        return <FiMail className="text-3xl" />
    }
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !name) {
      toast.error('Completa los campos obligatorios')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          message,
          inviteType,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo enviar la invitacion')
      }

      setInviteLink(data.inviteLink)
      onSuccess?.()
      toast.success('Invitacion enviada correctamente')
    } catch (error: any) {
      console.error('Error sending invitation:', error)
      toast.error(error.message || 'No se pudo enviar la invitacion')
    } finally {
      setSending(false)
    }
  }

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      toast.success('Enlace copiado')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSendAnother = () => {
    setEmail('')
    setName('')
    setMessage('')
    setInviteLink('')
    setCopied(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#0B2545] to-[#134074] text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                {getIcon()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{getTitle()}</h2>
                <p className="text-white/80 text-sm mt-1">{getDescription()}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <FiX className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Success State */}
        {inviteLink ? (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <FiCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Invitacion enviada</h3>
              <p className="text-gray-600">
                Se envio una invitacion por correo a <strong>{email}</strong>
              </p>
            </div>

            {/* Invitation Link */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <label htmlFor="invite-link" className="block text-sm font-medium text-gray-700 mb-2">
                Enlace de invitacion (vence en 7 dias)
              </label>
              <div className="flex gap-2">
                <input
                  id="invite-link"
                  type="text"
                  value={inviteLink}
                  readOnly
                  aria-label="Invitation link"
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-[#00A676] text-white rounded-lg hover:bg-[#008F64] transition-colors inline-flex items-center gap-2"
                >
                  {copied ? <FiCheck /> : <FiCopy />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tambien puedes compartir este enlace directamente con la persona invitada
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSendAnother}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
              >
                Enviar otra invitacion
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00A676] to-[#00C896] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* Invitation Form */
          <form onSubmit={handleSendInvite} className="p-6">
            <div className="space-y-5">
              {/* Role Badge */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Invitacion para:</strong>{' '}
                  {inviteType === 'agent'
                    ? 'Agente inmobiliario'
                    : inviteType === 'broker'
                    ? 'Broker / inmobiliaria'
                    : 'Usuario de plataforma'}
                </p>
              </div>

              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  <FiUser className="inline mr-2" />
                  Nombre de la persona <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  placeholder="Nombre completo"
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMail className="inline mr-2" />
                  Correo electronico <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  placeholder="juan@ejemplo.com"
                  required
                />
              </div>

              {/* Personal Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje personal (opcional)
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  rows={4}
                  placeholder="Agrega una nota para contextualizar la invitacion..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este mensaje se incluira en el correo de invitacion
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  📧 <strong>Que pasa despues:</strong>
                </p>
                <ul className="text-sm text-green-800 mt-2 space-y-1 ml-5 list-disc">
                  <li>Se envia un correo con acceso guiado al onboarding</li>
                  <li>La persona completa su perfil y crea su contrasena</li>
                  <li>La invitacion vence despues de 7 dias</li>
                  <li>Puedes seguir el estado desde el panel</li>
                </ul>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sending || !email || !name}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00A676] to-[#00C896] text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transition-all"
              >
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <FiSend />
                    Enviar invitacion
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
