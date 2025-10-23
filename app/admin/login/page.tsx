'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginDemo } from '../../../lib/authClient'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function MasterLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [expiresIn, setExpiresIn] = useState(0)

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-master-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!data.ok) {
        setError(data.error || 'Failed to send verification code')
        setLoading(false)
        return
      }

      setMessage('Verification code sent! Check your email.')
      setExpiresIn(data.expiresIn)
      setStep('code')
      
      // Start countdown
      const interval = setInterval(() => {
        setExpiresIn(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-master-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })

      const data = await res.json()

      if (!data.ok) {
        setError(data.error || 'Invalid verification code')
        setLoading(false)
        return
      }

      // Login success
      await loginDemo(data.user.email, 'master_admin')
      router.push('/admin')

    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
            <p className="text-gray-600 mt-2">Secure two-factor authentication</p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {step === 'email' ? (
              <form onSubmit={handleSendCode} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@viventa.com"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    ⚠️ {error}
                  </div>
                )}

                {message && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    ✓ {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>

                <div className="text-center text-sm text-gray-500">
                  <p>A 6-digit code will be sent to your email</p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
                    <span className="text-3xl">📧</span>
                  </div>
                  <p className="text-gray-700">
                    We sent a code to<br />
                    <strong className="text-[#00A676]">{email}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-center text-2xl font-bold tracking-widest focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all"
                  />
                </div>

                {expiresIn > 0 && (
                  <div className="text-center text-sm text-gray-600">
                    Code expires in <strong className="text-[#00A676]">{formatTime(expiresIn)}</strong>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>

                <div className="flex justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setCode(''); setError(''); }}
                    className="text-gray-600 hover:text-[#00A676] font-medium"
                  >
                    ← Change Email
                  </button>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    className="text-[#00A676] hover:text-[#008F64] font-medium disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>🔒 This is a secure admin area. All logins are monitored.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
