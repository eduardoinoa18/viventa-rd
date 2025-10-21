"use client";
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveSession } from '../../lib/authSession'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: any) {
    e.preventDefault()
    // TODO: Integrate with Firebase Auth
    if (!email || !password) {
      setError('Completa todos los campos.')
      return
    }
    // Simulate API login returning role and token
    const role: any = email.includes('admin') ? 'master_admin' : email.includes('broker') ? 'broker' : email.includes('agent') ? 'agent' : 'user'
    const session = { uid: 'demo', role, token: 'demo-token', profileComplete: true, name: 'Eduardo' }
    saveSession(session)
    setError('')
    const dest = role === 'master_admin' ? '/admin' : role === 'broker' ? '/dashboard' : role === 'agent' ? '/dashboard' : '/'
    router.push(dest + '?welcome=1')
  }

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-md mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-[#0B2545]">Iniciar sesión en Viventa RD</h1>
        <form className="bg-white rounded-lg shadow p-6 flex flex-col gap-4" onSubmit={handleLogin}>
          <input placeholder="Email" className="px-3 py-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} />
          <input placeholder="Contraseña" type="password" className="px-3 py-2 border rounded" value={password} onChange={e=>setPassword(e.target.value)} />
          <button type="submit" className="px-6 py-2 bg-[#00A676] text-white rounded font-semibold">Entrar</button>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </form>
        <div className="mt-4 text-center text-sm text-gray-600">
          ¿No tienes cuenta? <a href="/signup" className="text-[#3BAFDA] font-semibold">Regístrate</a>
        </div>
        <div className="mt-2 text-center text-sm">
          <a href="/forgot-password" className="text-blue-600 underline">¿Olvidaste tu contraseña?</a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
