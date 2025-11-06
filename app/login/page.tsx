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
import { usePageViewTracking } from '@/hooks/useAnalytics'
import { trackLogin } from '@/lib/analyticsService'

export default function LoginPage() {
  usePageViewTracking()
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
      // Track login event
      trackLogin(uid, role)
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
      <main className="flex-1 max-w-md mx-auto px-4 py-8 sm:py-12 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-[#0B2545]">Iniciar sesión en Viventa RD</h1>
        <form className="bg-white rounded-lg shadow p-4 sm:p-6 flex flex-col gap-4" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input 
              id="email"
              type="email"
              placeholder="tu@email.com" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all text-base"
              value={email} 
              onChange={e=>setEmail(e.target.value)}
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input 
              id="password"
              type="password" 
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all text-base"
              value={password} 
              onChange={e=>setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button 
            type="submit" 
            className="w-full px-6 py-3 min-h-[48px] bg-[#00A676] text-white rounded-lg font-semibold text-base hover:bg-[#008c5f] active:scale-[0.98] transition-all shadow-sm touch-manipulation"
          >
            Entrar
          </button>
          {error && <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-200">{error}</div>}
        </form>
        <div className="mt-6 text-center text-sm sm:text-base text-gray-600">
          ¿No tienes cuenta? <a href="/signup" className="text-[#3BAFDA] font-semibold hover:underline">Regístrate</a>
        </div>
        <div className="mt-3 text-center text-sm sm:text-base">
          <a href="/forgot-password" className="text-blue-600 hover:underline">¿Olvidaste tu contraseña?</a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
