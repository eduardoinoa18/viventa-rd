'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginDemo } from '../../../lib/authClient'
import { saveSession } from '../../../lib/authSession'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { FiAlertCircle, FiLock } from 'react-icons/fi'

export default function MasterLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/master-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Credenciales inválidas')
        return
      }
      // Step 2: Send 2FA code to email
      const twofa = await fetch('/api/auth/send-master-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const twofaRes = await twofa.json()
      if (!twofaRes.ok) {
        setError(twofaRes.error || 'No se pudo enviar el código 2FA')
        return
      }
      // Persist minimal session client-side for UX continuity (cookies set by API)
      await loginDemo(data.user.email, 'master_admin')
      saveSession({
        uid: 'admin_'+Math.random().toString(36).slice(2,9),
        role: 'master_admin',
        profileComplete: true,
        name: data.user.email.split('@')[0],
        email: data.user.email
      })
      router.push(`/admin/verify?email=${encodeURIComponent(email)}`)
    } catch (e) {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <Header />
      <main className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0B2545] to-[#00A676] rounded-full mb-4">
              <span className="text-4xl text-white font-bold">V</span>
            </div>
            <h1 className="text-3xl font-bold text-[#0B2545]">Master Admin Login</h1>
            <p className="text-gray-600 mt-2">Acceso con contraseña + 2FA</p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handlePasswordLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                  placeholder="admin@viventa.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <FiAlertCircle className="text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
            <FiLock />
            <p>Área de administración segura. El 2FA será activado más adelante.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
