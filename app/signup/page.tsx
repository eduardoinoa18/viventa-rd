"use client";
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveSession } from '../../lib/authSession'
import { auth, db } from '@/lib/firebaseClient'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { usePageViewTracking } from '@/hooks/useAnalytics'
import { trackSignup } from '@/lib/analyticsService'

export default function SignupPage() {
  usePageViewTracking()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSignup(e: any) {
    e.preventDefault()
    if (!form.email || !form.password || !form.name) {
      setError('Completa todos los campos.')
      return
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
      if (cred.user) {
        await updateProfile(cred.user, { displayName: form.name })
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          email: form.email,
          name: form.name,
          phone: form.phone || '',
          role: 'buyer',
          profileComplete: true,
          createdAt: serverTimestamp(),
        }, { merge: true })

        // Send welcome email
        try {
          await fetch('/api/users/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: form.email,
              name: form.name,
              userType: 'user'
            })
          })
        } catch (emailErr) {
          console.error('Welcome email failed:', emailErr)
          // Don't block registration if email fails
        }

        // Save session locally for client routing and middleware cookies
        saveSession({ uid: cred.user.uid, role: 'buyer', profileComplete: true, name: form.name })
        // Track signup event
        trackSignup(cred.user.uid, 'buyer')
        setError('')
        router.push('/search')
        toast.success('¡Cuenta creada exitosamente! Revisa tu email.')
      }
    } catch (err: any) {
      const msg = err?.message || 'No se pudo crear la cuenta.'
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-md mx-auto px-4 py-8 sm:py-12 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-[#0B2545]">Crear cuenta en Viventa RD</h1>
        <form className="bg-white rounded-lg shadow p-4 sm:p-6 flex flex-col gap-4" onSubmit={handleSignup}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <input 
              id="name"
              type="text"
              placeholder="Juan Pérez" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all text-base"
              value={form.name} 
              onChange={e=>setForm({...form, name: e.target.value})}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input 
              id="email"
              type="email"
              placeholder="tu@email.com" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all text-base"
              value={form.email} 
              onChange={e=>setForm({...form, email: e.target.value})}
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono <span className="text-gray-400">(opcional)</span>
            </label>
            <input 
              id="phone"
              type="tel"
              placeholder="809-555-0123" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all text-base"
              value={form.phone} 
              onChange={e=>setForm({...form, phone: e.target.value})}
              autoComplete="tel"
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
              value={form.password} 
              onChange={e=>setForm({...form, password: e.target.value})}
              autoComplete="new-password"
            />
          </div>
          <button 
            type="submit" 
            className="w-full px-6 py-3 min-h-[48px] bg-[#00A676] text-white rounded-lg font-semibold text-base hover:bg-[#008c5f] active:scale-[0.98] transition-all shadow-sm touch-manipulation"
          >
            Registrarse
          </button>
          {error && <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-200">{error}</div>}
        </form>
        <div className="mt-6 text-center text-sm sm:text-base text-gray-600">
          ¿Ya tienes cuenta? <a href="/login" className="text-[#3BAFDA] font-semibold hover:underline">Inicia sesión</a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
