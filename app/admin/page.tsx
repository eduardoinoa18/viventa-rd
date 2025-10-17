'use client'
import { useState } from 'react'
import { db } from '../../lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export default function AdminPage(){
  const [email,setEmail] = useState('')
  const [role,setRole] = useState('agent')
  const [brokerage,setBrokerage] = useState('')

  async function sendInvite(){
    const token = Math.random().toString(36).slice(2,10).toUpperCase()
    await addDoc(collection(db,'invites'), { token, email, role, brokerage_id: brokerage, createdAt: serverTimestamp(), expiresAt: null, used:false })
    alert('Invite created: token saved in invites collection')
    setEmail(''); setBrokerage('')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin — Invite Agent / Brokerage</h1>
      <div className="mt-4 p-4 bg-white rounded shadow">
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Agent email" className="w-full px-3 py-2 border rounded"/>
        <input value={brokerage} onChange={e=>setBrokerage(e.target.value)} placeholder="Brokerage ID" className="mt-2 w-full px-3 py-2 border rounded"/>
        <div className="mt-3 flex justify-end">
          <button onClick={sendInvite} className="px-3 py-2 bg-[#00A6A6] text-white rounded">Create Invite</button>
        </div>
      </div>
    </div>
  )
}
