'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveSessionLocal } from '../../../lib/authSession'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { FiAlertCircle, FiLock, FiArrowLeft } from 'react-icons/fi'

export default function MasterLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [remember, setRemember] = useState(true)
  const [step, setStep] = useState<'password' | 'verify'>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devCode, setDevCode] = useState<string | null>(null)

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setDevCode(null)
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
      if (twofaRes.devCode) {
        setDevCode(twofaRes.devCode)
      }
      setStep('verify')
    } catch (e) {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-master-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, remember })
      })
      const json = await res.json()
      if (!json.ok) {
        setError(json.error || 'Código inválido')
        return
      }
      saveSessionLocal({
        uid: json.user?.email || 'master_admin',
        role: 'master_admin',
        profileComplete: true,
        name: json.user?.name || email.split('@')[0],
        email: json.user?.email || email
      })
      router.push('/admin')
    } catch (e) {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function resendCode() {
    setError('')
    setLoading(true)
    setDevCode(null)
    try {
      const res = await fetch('/api/auth/send-master-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const json = await res.json()
      if (!json.ok) {
        setError(json.error || 'No se pudo reenviar el código')
        return
      }
      if (json.devCode) setDevCode(json.devCode)
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
            {step === 'password' ? (
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
                  {loading ? 'Enviando código…' : 'Continuar'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6">
                <button
                  type="button"
                  onClick={() => setStep('password')}
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <FiArrowLeft /> Cambiar credenciales
                </button>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Código 2FA</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={e=>setCode(e.target.value)}
                    placeholder="Código de 6 dígitos"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-2">Enviamos el código a {email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={e=>setRemember(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-700">Confiar en este dispositivo por 30 días</label>
                </div>
                {devCode && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-xs">
                    DEV code: <span className="font-mono font-semibold">{devCode}</span>
                  </div>
                )}
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
                  {loading ? 'Verificando…' : 'Verificar y entrar'}
                </button>
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={loading}
                  className="w-full py-3 rounded-lg border border-gray-300 font-semibold disabled:opacity-50"
                >
                  Reenviar código
                </button>
              </form>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
            <FiLock />
            <p>Área de administración segura con verificación 2FA.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
