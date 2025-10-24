// app/admin/chat/page.tsx
'use client'
import { useEffect, useState } from 'react'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import { db } from '../../../lib/firebaseClient'
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'

export default function AdminChatPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')

  useEffect(() => {
    if (!db) return
    const q = query(collection(db as any, 'messages'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap: any) => {
      setMessages(snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) })))
    })
    return () => unsub()
  }, [])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    try {
      await addDoc(collection(db as any, 'messages'), {
        conversationId: 'admin-support',
        senderId: 'master_admin',
        senderName: 'Master Admin',
        receiverId: 'support',
        receiverName: 'Support',
        content: text.trim(),
        read: false,
        createdAt: serverTimestamp(),
      })
      setText('')
    } catch (e) {}
  }

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <h1 className="text-3xl font-bold text-[#0B2545] mb-6">Admin Chat & Support</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col h-[70vh]">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(m => (
                  <div key={m.id} className={`max-w-[80%] p-3 rounded-lg ${m.senderId === 'master_admin' ? 'bg-[#00A6A6] text-white ml-auto' : 'bg-gray-100 text-gray-800'}`}>
                    <div className="text-xs opacity-80 mb-1">{m.senderName || m.senderId}</div>
                    <div>{m.content}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="border-t p-3 flex gap-2">
                <input className="flex-1 px-3 py-2 border rounded" placeholder="Type a message…" value={text} onChange={e => setText(e.target.value)} />
                <button className="px-4 py-2 bg-[#0B2545] text-white rounded">Send</button>
              </form>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-[#0B2545] mb-3">Support Shortcuts</h3>
              <ul className="space-y-2 text-sm">
                <li><button className="text-[#004AAD] hover:underline">Invite new admin</button></li>
                <li><button className="text-[#004AAD] hover:underline">Export data</button></li>
                <li><button className="text-[#004AAD] hover:underline">Report a bug</button></li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}
