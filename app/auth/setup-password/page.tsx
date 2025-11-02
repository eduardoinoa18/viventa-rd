'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { FiLock, FiCheck, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function PasswordSetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const credentialId = searchParams.get('id')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)

  // Password strength indicators
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial && passwordsMatch

  useEffect(() => {
    validateToken()
  }, [token, email])

  async function validateToken() {
    if (!token || !email) {
      setIsValid(false)
      setValidating(false)
      return
    }

    try {
      const res = await fetch('/api/auth/validate-setup-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email })
      })

      const data = await res.json()
      setIsValid(data.valid)
    } catch {
      setIsValid(false)
    } finally {
      setValidating(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isPasswordValid) {
      toast.error('La contraseña no cumple los requisitos')
      return
    }

    setLoading(true)

    try {
      // Update password via API
      const res = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al configurar contraseña')
      }

      toast.success('¡Contraseña configurada exitosamente!')
      
      // Redirect to professional login
      setTimeout(() => {
        router.push('/profesionales?setup=success')
      }, 1500)
    } catch (error: any) {
      toast.error(error.message || 'Error al configurar contraseña')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B2545] via-[#134074] to-[#00A6A6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Validando enlace...</p>
        </div>
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B2545] via-[#134074] to-[#00A6A6] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiX className="text-red-600 text-4xl" />
          </div>
          <h1 className="text-3xl font-bold text-[#0B2545] mb-4">Enlace Inválido</h1>
          <p className="text-gray-600 mb-6">
            Este enlace de configuración ha expirado o no es válido. 
            Por favor, contacta a soporte para recibir un nuevo enlace.
          </p>
          <a
            href="/profesionales"
            className="inline-block px-6 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008c5f] transition"
          >
            Ir a Inicio de Sesión
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B2545] via-[#134074] to-[#00A6A6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#00A676] to-[#00A6A6] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiLock className="text-white text-4xl" />
          </div>
          <h1 className="text-3xl font-bold text-[#0B2545] mb-2">Configura tu Contraseña</h1>
          <p className="text-gray-600">ID: <span className="font-bold text-[#00A676]">{credentialId}</span></p>
          <p className="text-sm text-gray-500 mt-2">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
              placeholder="Crea una contraseña segura"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
              placeholder="Repite la contraseña"
              required
            />
          </div>

          {/* Password requirements */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-700 mb-3">Requisitos de contraseña:</p>
            <PasswordRequirement met={hasMinLength} text="Mínimo 8 caracteres" />
            <PasswordRequirement met={hasUppercase} text="Una letra mayúscula" />
            <PasswordRequirement met={hasLowercase} text="Una letra minúscula" />
            <PasswordRequirement met={hasNumber} text="Un número" />
            <PasswordRequirement met={hasSpecial} text="Un carácter especial (!@#$%)" />
            <PasswordRequirement met={passwordsMatch} text="Las contraseñas coinciden" />
          </div>

          <button
            type="submit"
            disabled={!isPasswordValid || loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#00A676] to-[#00A6A6] text-white rounded-lg font-bold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Configurando...' : 'Configurar Contraseña'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Necesitas ayuda? <a href="mailto:viventa.rd@gmail.com" className="text-[#00A676] font-semibold">Contáctanos</a>
        </p>
      </div>
    </div>
  )
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <FiCheck className="text-green-600 flex-shrink-0" />
      ) : (
        <FiX className="text-gray-400 flex-shrink-0" />
      )}
      <span className={`text-sm ${met ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  )
}
