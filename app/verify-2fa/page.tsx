/**
 * 2FA Verification Page (Master Admin Only)
 * Secure implementation using httpOnly session cookies
 */

"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiAlertCircle, FiShield, FiArrowLeft } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Verify2FAPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        credentials: 'include', // Include cookies
      })

      const data = await res.json()

      if (!data.ok) {
        setError(data.error || 'Código inválido')
        toast.error(data.error || 'Código inválido')
        return
      }

      // Session cookie updated by server with twoFactorVerified=true
      toast.success('Verificación exitosa')
      
      // Use full page redirect to ensure cookie is sent with next request
      window.location.href = data.redirect || '/master'
    } catch (err) {
      console.error('2FA verification error:', err)
      setError('Error de red. Inténtalo de nuevo.')
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError('')

    try {
      const res = await fetch('/api/auth/send-master-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include',
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        const msg = data?.error || 'No se pudo reenviar el código'
        setError(msg)
        toast.error(msg)
        return
      }

      if (data?.devCode) {
        toast.success(`Código de respaldo: ${data.devCode}`)
      } else {
        toast.success('Código reenviado a tu correo')
      }
    } catch (err) {
      toast.error('Error al reenviar código')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0B2545] to-[#00A676] rounded-full mb-4 shadow-lg">
            <FiShield className="text-4xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#0B2545]">Verificación 2FA</h1>
          <p className="text-gray-600 mt-2">Ingresa el código enviado a tu email</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <FiArrowLeft /> Volver a iniciar sesión
          </button>

          <form onSubmit={handleVerify} className="space-y-6">
            {/* Code Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Código de Verificación
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                inputMode="numeric"
                pattern="\d{6}"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Código de 6 dígitos
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <FiAlertCircle className="text-red-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Verificar Código'}
            </button>
          </form>

          {/* Resend Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-gray-600 hover:text-[#00A676] transition-colors disabled:opacity-50"
            >
              {resending ? 'Reenviando...' : '¿No recibiste el código? Reenviar'}
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 Tu cuenta está protegida con autenticación de dos factores
          </p>
        </div>
      </div>
    </div>
  )
}
