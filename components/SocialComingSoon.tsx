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
    <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-br from-viventa-sand/30 via-white to-viventa-turquoise/10">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-viventa-turquoise to-viventa-ocean rounded-full mb-8 shadow-xl animate-pulse">
          <FiStar className="text-5xl text-white" />
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-viventa-navy mb-4">
          Red Social Viventa
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-viventa-ocean mb-6">
          ¡Próximamente!
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto">
          Estamos construyendo una comunidad vibrante donde propietarios, agentes y compradores pueden 
          conectar, compartir y descubrir las mejores oportunidades inmobiliarias del Caribe.
        </p>

        {/* Features Coming */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-viventa-turquoise/20">
          <h3 className="text-xl font-bold text-viventa-navy mb-4">
            ¿Qué podrás hacer?
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-viventa-turquoise to-viventa-teal rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <p className="font-semibold text-viventa-navy">Videos de Propiedades</p>
                <p className="text-sm text-gray-600">Tours virtuales y contenido exclusivo</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-viventa-sunset to-viventa-coral rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <p className="font-semibold text-viventa-navy">Interacción con Agentes</p>
                <p className="text-sm text-gray-600">Comenta y da like a publicaciones</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-viventa-ocean to-viventa-navy rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <p className="font-semibold text-viventa-navy">Listados Destacados</p>
                <p className="text-sm text-gray-600">Las mejores propiedades en tu feed</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-viventa-palm to-viventa-teal rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <p className="font-semibold text-viventa-navy">Contenido Educativo</p>
                <p className="text-sm text-gray-600">Tips y consejos del mercado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification CTA + signup */}
        <div className="bg-gradient-to-r from-viventa-turquoise to-viventa-ocean rounded-2xl p-6 text-white shadow-2xl">
          <FiBell className="text-3xl mx-auto mb-3" />
          <p className="text-lg font-semibold mb-2">¡Mantente al tanto!</p>
          <p className="text-sm text-viventa-sand/90 mb-4">
            Déjanos tu correo y te avisamos cuando esté listo.
          </p>

          <form onSubmit={subscribe} className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl text-viventa-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-viventa-sunset"
            />
            <button
              type="submit"
              disabled={status==='loading'}
              className="px-5 py-3 rounded-xl bg-white text-viventa-ocean font-semibold hover:bg-viventa-sand hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100 shadow-lg"
            >
              {status==='loading' ? 'Enviando...' : 'Avisarme'}
            </button>
          </form>

          {status==='success' && (
            <p className="mt-3 text-sm text-viventa-sand">¡Listo! Te avisaremos muy pronto.</p>
          )}
          {status==='error' && (
            <p className="mt-3 text-sm text-viventa-sunset/90">{error}</p>
          )}
        </div>
      </div>
    </main>
  )
}
