'use client'
import { useState } from 'react'
import { db, auth } from '../lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export default function SavedSearchModal({ query, filters, onClose }:{query:string, filters?:any, onClose:()=>void}) {
  const [name,setName] = useState('')

  async function save(){
    const user = auth.currentUser
    if(!user) return alert('Login required')
    await addDoc(collection(db, 'users', user.uid, 'saved_searches'), {
      name: name || query || 'Search',
      query, filters: filters ?? null, createdAt: serverTimestamp()
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded w-96">
        <h3 className="font-semibold">Save search</h3>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="mt-3 w-full px-3 py-2 border rounded"/>
        <div className="mt-4 flex justify-end space-x-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
          <button onClick={save} className="px-3 py-1 bg-[#00A6A6] text-white rounded">Save</button>
        </div>
      </div>
    </div>
  )
}
