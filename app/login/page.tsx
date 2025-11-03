"use client";
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveSession } from '../../lib/authSession'
import { auth, db } from '@/lib/firebaseClient'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: any) {
    e.preventDefault()
    if (!email || !password) {
      setError('Completa todos los campos.')
      return
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const uid = cred.user.uid
      // Fetch role and profile from Firestore
      let role: any = 'agent'
      let name: string | undefined = cred.user.displayName || undefined
      let profileComplete = true
      try {
        const userRef = doc(db, 'users', uid)
        const snap = await getDoc(userRef)
        if (snap.exists()) {
          const data = snap.data() as any
          role = data?.role || role
          name = data?.name || name
          profileComplete = !!data?.profileComplete
          // Update lastLoginAt
          await setDoc(userRef, { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true })
        } else {
          // Upsert a minimal user profile so Admin can manage this user
          await setDoc(userRef, {
            uid,
            email: cred.user.email?.toLowerCase() || '',
            name: name || cred.user.email?.split('@')[0] || '',
            role: 'user',
            status: 'active',
            profileComplete: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          }, { merge: true })
          role = 'user'
          profileComplete = true
        }
      } catch {}
      // Save session for client and middleware
      saveSession({ uid, role, profileComplete, name })
      setError('')
      if (!profileComplete && (role === 'agent' || role === 'broker')) {
        router.push('/onboarding')
        return
      }
  let dest = '/dashboard'
  if (role === 'master_admin') dest = '/admin'
  else if (role === 'broker') dest = '/broker'
  else if (role === 'agent') dest = '/agent'
  router.push(dest + '?welcome=1')
      toast.success('¡Bienvenido de vuelta!')
    } catch (err: any) {
      const msg = err?.message || 'No se pudo iniciar sesión.'
      setError(msg)
      toast.error(msg)
    }
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
