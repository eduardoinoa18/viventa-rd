"use client"
import { useState } from 'react'
import { FiStar, FiBell } from 'react-icons/fi'
import { analytics } from '@/lib/analytics'

export default function SocialComingSoon() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function subscribe(e?: React.FormEvent) {
    e?.preventDefault()
    setError('')
    setStatus('loading')
    try {
      const res = await fetch('/api/notify/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'No se pudo registrar')
      setStatus('success')
      analytics?.pageView?.('/social_waitlist', 'Social Waitlist Signup')
    } catch (err: any) {
      setError(err.message || 'Error desconocido')
      setStatus('error')
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#0B2545] to-[#00A676] rounded-full mb-8 animate-pulse">
          <FiStar className="text-5xl text-white" />
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-[#0B2545] mb-4">
          Red Social
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-[#00A676] mb-6">
          Próximamente
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto">
          Estamos trabajando en una experiencia social única donde podrás conectar con agentes, 
          ver propiedades exclusivas y descubrir contenido relevante del mercado inmobiliario.
        </p>

        {/* Features Coming */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-xl font-bold text-[#0B2545] mb-4">
            ¿Qué podrás hacer?
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[#0B2545] to-[#00A676] rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Videos de Propiedades</p>
                <p className="text-sm text-gray-600">Tours virtuales y contenido exclusivo</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[#0B2545] to-[#00A676] rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Interacción con Agentes</p>
                <p className="text-sm text-gray-600">Comenta y da like a publicaciones</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[#0B2545] to-[#00A676] rounded-full flex items-center justify-center">
                <span className="text-white text sm">✓</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Listados Destacados</p>
                <p className="text-sm text-gray-600">Las mejores propiedades en tu feed</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[#0B2545] to-[#00A676] rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Contenido Educativo</p>
                <p className="text-sm text-gray-600">Tips y consejos del mercado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification CTA + signup */}
        <div className="bg-gradient-to-r from-[#0B2545] to-[#00A676] rounded-2xl p-6 text-white">
          <FiBell className="text-3xl mx-auto mb-3" />
          <p className="text-lg font-semibold mb-2">¡Mantente al tanto!</p>
          <p className="text-sm opacity-90 mb-4">
            Déjanos tu correo y te avisamos cuando esté listo.
          </p>

          <form onSubmit={subscribe} className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl text-[#0B2545] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60"
            />
            <button
              type="submit"
              disabled={status==='loading'}
              className="px-5 py-3 rounded-xl bg-white text-[#0B2545] font-semibold hover:bg-gray-100 disabled:opacity-60"
            >
              {status==='loading' ? 'Enviando...' : 'Avisarme'}
            </button>
          </form>

          {status==='success' && (
            <p className="mt-3 text-sm text-white/90">¡Listo! Te avisaremos muy pronto.</p>
          )}
          {status==='error' && (
            <p className="mt-3 text-sm text-red-200">{error}</p>
          )}
        </div>
      </div>
    </main>
  )
}
