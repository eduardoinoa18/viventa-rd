"use client"
import { useEffect, useState } from 'react'
import { auth, firestore } from '../../../lib/firebaseClient'
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

export default function InviteAcceptPage(){
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string| null>(null)
  const router = useRouter()

  useEffect(()=> {
    const unsub = auth.onAuthStateChanged((u: any)=> {
      if (u) setEmail(u.email || '')
    })
    return ()=> unsub()
  },[])

  async function redeem(){
    if (!code) return
    const q = query(collection(firestore, 'invites'), where('code','==',code))
    const snap = await getDocs(q)
    if (snap.empty) { setStatus('Código inválido'); return }
    const d = snap.docs[0]
    const inv = d.data() as any
    if (inv.status === 'used') { setStatus('Este código ya fue usado'); return }
    const u = auth.currentUser
    if (!u) { setStatus('Inicia sesión antes de canjear'); return }
    if (inv.email && inv.email !== u.email) { setStatus('Este código está asignado a otro correo'); return }

    await updateDoc(doc(firestore, 'invites', d.id), { status: 'used', usedBy: u.uid })
    await setDoc(doc(firestore, 'users', u.uid), { email: u.email, role: inv.role || 'agent' }, { merge: true })
    setStatus('Invitación aceptada. Tienes rol: ' + (inv.role || 'agent'))
    setTimeout(()=> router.replace('/agent'), 1200)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Canjear Invitación</h1>
      <p className="mt-2 text-gray-600">Ingresa tu código de invitación para obtener acceso como agente.</p>
      <div className="mt-4 max-w-md space-y-3">
        <input className="w-full px-3 py-2 border rounded" placeholder="Código" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} />
        <button onClick={redeem} className="px-4 py-2 bg-[#00A6A6] text-white rounded">Canjear</button>
        {status && <div className="text-sm text-gray-700">{status}</div>}
      </div>
    </div>
  )
}
