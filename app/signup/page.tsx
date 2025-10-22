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

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
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
          role: 'agent',
          profileComplete: false,
          createdAt: serverTimestamp(),
        }, { merge: true })

        // Save session locally for client routing and middleware cookies
        saveSession({ uid: cred.user.uid, role: 'agent', profileComplete: false, name: form.name })
        setError('')
        router.push('/onboarding')
        toast.success('¡Cuenta creada exitosamente!')
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
