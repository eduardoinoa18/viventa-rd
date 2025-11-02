"use client";
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useRouter } from 'next/navigation'
import { getSession, saveSession } from '../../lib/authSession'
import { auth, db } from '../../lib/firebaseClient'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useState } from 'react'

export default function OnboardingPage(){
  const router = useRouter()
  const [form, setForm] = useState({
    license:'', brokerage:'', phone:'', languages:'', bio:'', areas:'', website:'', instagram:'', linkedin:''
  })
  const [saving, setSaving] = useState(false)
  async function complete(){
    const s = getSession();
    try {
      setSaving(true)
      const uid = auth?.currentUser?.uid || s?.uid
      if (uid) {
        await setDoc(doc(db, 'users', uid), {
          onboarding: { ...form },
          profileComplete: true,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }
      if(s){ s.profileComplete = true; saveSession(s) }
    } finally {
      setSaving(false)
    }
    router.replace('/dashboard')
  }
  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Completa tu Perfil</h1>
        <div className="bg-white rounded shadow p-6 space-y-3">
          <input className="w-full border p-2 rounded" placeholder="Número de licencia" value={form.license} onChange={e=>setForm({...form, license: e.target.value})} />
          <input className="w-full border p-2 rounded" placeholder="Nombre de agencia" value={form.brokerage} onChange={e=>setForm({...form, brokerage: e.target.value})} />
          <input className="w-full border p-2 rounded" placeholder="Teléfono" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} />
          <input className="w-full border p-2 rounded" placeholder="Idiomas (Español, Inglés, ...)" value={form.languages} onChange={e=>setForm({...form, languages: e.target.value})} />
          <input className="w-full border p-2 rounded" placeholder="Áreas que cubres (Santo Domingo, Punta Cana, ...)" value={form.areas} onChange={e=>setForm({...form, areas: e.target.value})} />
          <textarea className="w-full border p-2 rounded" placeholder="Biografía corta" rows={4} value={form.bio} onChange={e=>setForm({...form, bio: e.target.value})} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="w-full border p-2 rounded" placeholder="Sitio web" value={form.website} onChange={e=>setForm({...form, website: e.target.value})} />
            <input className="w-full border p-2 rounded" placeholder="Instagram" value={form.instagram} onChange={e=>setForm({...form, instagram: e.target.value})} />
            <input className="w-full border p-2 rounded" placeholder="LinkedIn" value={form.linkedin} onChange={e=>setForm({...form, linkedin: e.target.value})} />
          </div>
          <button onClick={complete} disabled={saving} className="px-4 py-2 bg-[#00A676] text-white rounded disabled:opacity-60">{saving ? 'Guardando...' : 'Finalizar'}</button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
