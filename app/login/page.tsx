/**
 * Unified Login Page
 * Secure implementation using httpOnly session cookies
 * NO localStorage token storage
 */

"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { FiAlertCircle, FiMail, FiLock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { usePageViewTracking } from '@/hooks/useAnalytics'

export default function UnifiedLoginPage() {
  usePageViewTracking()
  
  const router = useRouter()
  const [nextPath, setNextPath] = useState<string>('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setNextPath(params.get('next') || '')
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important: Ensure cookies are sent/received
      })

      const data = await res.json()

      if (!data.ok) {
        setError(data.error || 'Credenciales inválidas')
        toast.error(data.error || 'Credenciales inválidas')
        return
      }

      // Session cookie is set by server automatically (httpOnly)
      // Client does NOT touch tokens

      if (data.requires2FA) {
        // Master admin: Redirect to 2FA verification
        toast.success('Código 2FA enviado a tu email')
        router.push('/verify-2fa')
      } else {
        // Buyer/Professional: Direct access
        const safeNext = nextPath && nextPath.startsWith('/') ? nextPath : null
        toast.success('¡Bienvenido de vuelta!')
        router.push(safeNext || data.redirect || '/search')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Error de red. Inténtalo de nuevo.')
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-teal-50 min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0B2545] to-[#00A676] rounded-full mb-4 shadow-lg">
              <span className="text-4xl text-white font-bold">V</span>
            </div>
            <h1 className="text-3xl font-bold text-[#0B2545]">Viventa RD</h1>
            <p className="text-gray-600 mt-2">Inicia sesión en tu cuenta</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FiMail className="inline mr-2" />
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FiLock className="inline mr-2" />
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all"
                />
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
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando...' : 'Iniciar Sesión'}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 space-y-3 text-center">
              <a
                href="/forgot-password"
                className="block text-sm text-gray-600 hover:text-[#00A676] transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </a>
              <div className="text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <a href={`/signup${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`} className="text-[#00A676] hover:underline font-semibold">
                  Regístrate
                </a>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              🔒 Conexión segura. Tu información está protegida.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
