"use client"
import { useState } from 'react'

export default function AdminGatePage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const json = await res.json()
      if (!json.ok) {
        setError(json.error || 'Invalid code')
        return
      }
      window.location.href = '/admin/login'
    } catch (e: any) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-sm p-8">
        <h1 className="sr-only">Admin Gate</h1>
        <input
          type="password"
          placeholder="Enter access code"
          value={code}
          onChange={e=>setCode(e.target.value)}
          autoFocus
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
        />
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full py-3 rounded-lg bg-[#0B2545] text-white font-semibold disabled:opacity-50"
        >
          {loading ? 'Verifying…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
