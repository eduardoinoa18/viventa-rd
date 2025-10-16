'use client'
import { useEffect, useState } from 'react'
import { auth, firestore } from '../../lib/firebaseClient'
import { getDocs, collection, doc, updateDoc } from 'firebase/firestore'

export default function AdminPage(){
  const [user,setUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
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

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <p className="mt-2 text-gray-600">Admin only area — use Firebase console for initial seeding.</p>
      <div className="mt-4">
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
