'use client'
import { useState } from 'react'
import { db } from '../../lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useRequireRole } from '../../lib/useRequireRole'
import AdminCodeModal from '../../components/AdminCodeModal'

export default function AdminPage(){
  const [email,setEmail] = useState('')
  const [role,setRole] = useState('agent')
  const [brokerage,setBrokerage] = useState('')
  const { loading, ok, showModal, setShowModal } = useRequireRole(['admin','master_admin'])

  async function sendInvite(){
    const token = Math.random().toString(36).slice(2,10).toUpperCase()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7*24*60*60*1000) // 7 days from now
    await addDoc(collection(db,'invites'), {
      token,
      email,
      role,
      brokerage_id: brokerage,
      createdAt: serverTimestamp(),
      expiresAt,
      used: false
    })
    alert('Invite created: token saved in invites collection')
    setEmail(''); setBrokerage('')
  }

  if (loading) return <div>Loading...</div>
  if (showModal) return <AdminCodeModal onVerified={()=>setShowModal(false)} />
  if (!ok) return <div>Access denied</div>

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
