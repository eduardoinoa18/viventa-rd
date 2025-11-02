"use client"
export const dynamic = 'force-dynamic'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function AdminVerifyForm() {
  const params = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(true)

  useEffect(() => {
    const e = params.get('email') || ''
    setEmail(e)
  }, [params])

  async function submit(e: React.FormEvent) {
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
        setError(json.error || 'Invalid code')
        return
      }
      router.push('/admin')
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-master-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const json = await res.json()
      if (!json.ok) {
        setError(json.error || 'No se pudo reenviar el código')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#0B2545] mb-1">Verificación 2FA</h1>
        <p className="text-gray-600 mb-4">Hemos enviado un código a <span className="font-semibold">{email}</span></p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Código de 6 dígitos"
          value={code}
          onChange={e=>setCode(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
        />
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        <div className="mt-3 flex items-center gap-2">
          <input id="remember" type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="h-4 w-4" />
          <label htmlFor="remember" className="text-sm text-gray-700">Confiar en este dispositivo por 30 días</label>
        </div>
        <button type="submit" disabled={loading} className="mt-3 w-full py-3 rounded-lg bg-[#00A676] text-white font-semibold disabled:opacity-50">
          {loading ? 'Verificando…' : 'Verificar'}
        </button>
        <button type="button" onClick={resend} disabled={loading} className="mt-2 w-full py-3 rounded-lg border border-gray-300 font-semibold disabled:opacity-50">
          Reenviar código
        </button>
      </form>
    </div>
  )
}

export default function AdminVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando…</div>}>
      <AdminVerifyForm />
    </Suspense>
  )
}
