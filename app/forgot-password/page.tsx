"use client";
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const router = useRouter()

  async function handleReset(e: any) {
    e.preventDefault()
    // TODO: Integrate with Firebase Auth password reset
    if (!email) {
      setStatus('Ingresa tu email.')
      return
    }
    // Simulate success
    setStatus('Si existe una cuenta, recibirás un correo para restablecer la contraseña.')
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-md mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-[#0B2545]">¿Olvidaste tu contraseña?</h1>
        <form className="bg-white rounded-lg shadow p-6 flex flex-col gap-4" onSubmit={handleReset}>
          <input placeholder="Email" className="px-3 py-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} />
          <button type="submit" className="px-6 py-2 bg-[#00A676] text-white rounded font-semibold">Restablecer contraseña</button>
          {status && <div className="text-blue-600 text-sm mt-2">{status}</div>}
        </form>
        <div className="mt-4 text-center text-sm text-gray-600">
          <a href="/login" className="text-[#3BAFDA] font-semibold">Volver a iniciar sesión</a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
