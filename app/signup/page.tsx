"use client";
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveSession } from '../../lib/authSession'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSignup(e: any) {
    e.preventDefault()
    // TODO: Integrate with Firebase Auth
    if (!form.email || !form.password || !form.name) {
      setError('Completa todos los campos.')
      return
    }
    // Simulate success with onboarding pending
    const session = { uid: 'demo', role: 'agent', token: 'demo-token', profileComplete: false, name: form.name }
    saveSession(session as any)
    setError('')
    router.push('/onboarding')
  }

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-md mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-[#0B2545]">Crear cuenta en Viventa RD</h1>
        <form className="bg-white rounded-lg shadow p-6 flex flex-col gap-4" onSubmit={handleSignup}>
          <input placeholder="Nombre completo" className="px-3 py-2 border rounded" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
          <input placeholder="Email" className="px-3 py-2 border rounded" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
          <input placeholder="Contraseña" type="password" className="px-3 py-2 border rounded" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} />
          <button type="submit" className="px-6 py-2 bg-[#00A676] text-white rounded font-semibold">Registrarse</button>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </form>
        <div className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta? <a href="/auth" className="text-[#3BAFDA] font-semibold">Inicia sesión</a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
