'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebaseClient'
import { doc, getDoc } from 'firebase/firestore'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function BrokerLoginMock() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: any) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      const role = snap.exists() ? (snap.data() as any).role : 'user'
      if (role !== 'broker') {
        setError('Esta cuenta no es de Bróker')
        await signOut(auth)
        return
      }
      router.push('/brokers')
    } catch (err: any) {
      setError(err?.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-4">
          <h1 className="text-2xl font-bold text-[#0B2545]">Login Brókers (Mock)</h1>
          <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full border rounded px-3 py-2" placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button disabled={loading} className="w-full py-2 bg-[#00A676] text-white rounded font-semibold">{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </main>
      <Footer />
    </div>
  )
}
