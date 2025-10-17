'use client'
import { useEffect, useState } from 'react'
import { auth, firestore } from '../../lib/firebaseClient'
import { getDocs, collection, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { useRequireRole } from '../../lib/useRequireRole'

export default function AdminPage(){
  const guard = useRequireRole(['admin','brokerage_admin','master_admin'])
  if (guard.loading) return <div>Loading…</div>
  if (!guard.ok) return null
  const [user,setUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  useEffect(()=> {
    const unsub = auth.onAuthStateChanged((u: any)=> setUser(u))
    return ()=> unsub()
  },[])

  async function loadUsers(){
    const snap = await getDocs(collection(firestore,'users'))
  setUsers(snap.docs.map((d: any)=> ({id:d.id, ...d.data()})))
  }
  async function promote(uId:string, role:string){
    await updateDoc(doc(firestore,'users',uId), { role })
    loadUsers()
  }

  async function invite() {
    if (!inviteEmail) return
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    await addDoc(collection(firestore, 'invites'), {
      email: inviteEmail,
      code,
      role: 'agent',
      status: 'pending',
      createdAt: serverTimestamp(),
    })
    alert('Invite created with code: ' + code)
    setInviteEmail('')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <p className="mt-2 text-gray-600">Admin only area — use Firebase console for initial seeding.</p>
      <div className="mt-4">
        <div className="p-3 bg-white rounded shadow mb-4">
          <h3 className="font-semibold">Invite Agent</h3>
          <div className="mt-2 flex gap-2">
            <input className="flex-1 px-3 py-2 border rounded" placeholder="email@domain.com" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} />
            <button onClick={invite} className="px-3 py-2 bg-[#00A6A6] text-white rounded">Create Invite</button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Share the code with the agent; they can redeem it at /auth/invite</p>
        </div>
        <button onClick={loadUsers} className="px-3 py-2 border rounded">Load users</button>
        <div className="mt-3 space-y-2">
          {users.map(u=>(
            <div key={u.id} className="p-3 bg-white rounded shadow flex items-center justify-between">
              <div>
                <div className="font-medium">{u.displayName || u.email}</div>
                <div className="text-sm text-gray-600">{u.role || 'client'}</div>
              </div>
              <div className="space-x-2">
                <button onClick={()=>promote(u.id,'agent')} className="px-2 py-1 border rounded">Make Agent</button>
                <button onClick={()=>promote(u.id,'admin')} className="px-2 py-1 border rounded">Make Admin</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
