"use client"
import { useEffect, useState } from 'react'
import { auth, db } from '../../../lib/firebaseClient'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../../lib/firebaseClient'
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
    const u = auth.currentUser
    if (!u) { setStatus('Inicia sesión antes de canjear'); return }
    if (!functions) { setStatus('Firebase Functions no disponible'); return }
    try {
      const acceptInvite = httpsCallable(functions, 'acceptInvite')
      const res: any = await acceptInvite({ token: code, uid: u.uid, email: u.email })
      setStatus('Invitación aceptada. Estado: ' + res.status)
      setTimeout(()=> router.replace('/agent'), 1200)
    } catch (err: any) {
      setStatus(err.message || 'Error al aceptar invitación')
    }
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
