'use client'
import { useEffect, useMemo, useState } from 'react'
import { FiMessageSquare, FiSearch, FiSend, FiRefreshCw, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { loadConversations(); const t = setInterval(loadConversations, 8000); return () => clearInterval(t) }, [])
  useEffect(() => { if (activeId) { loadMessages(activeId); const t = setInterval(()=>loadMessages(activeId), 5000); return () => clearInterval(t) } }, [activeId])

  async function loadConversations() {
    setLoadingConvos(true)
    try {
      const res = await fetch('/api/admin/chat/conversations?limit=200', { cache: 'no-store' })
      const data = await res.json()
      setConversations(data.conversations || [])
      if (!activeId && data.conversations?.[0]?.id) setActiveId(data.conversations[0].id)
    } finally { setLoadingConvos(false) }
  }
  async function loadMessages(id: string) {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/admin/chat/conversations/${encodeURIComponent(id)}/messages`, { cache: 'no-store' })
      const data = await res.json()
      setMessages(data.messages || [])
    } finally { setLoadingMessages(false) }
  }
  async function send() {
    if (!text.trim() || !activeId) return
    const body = { text }
    setText('')
    await fetch(`/api/admin/chat/conversations/${encodeURIComponent(activeId)}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    loadMessages(activeId)
    loadConversations()
  }
  async function closeConversation() {
    if (!activeId) return
    await fetch(`/api/admin/chat/conversations/${encodeURIComponent(activeId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'closed' }) })
    loadConversations()
  }
  async function reopenConversation() {
    if (!activeId) return
    await fetch(`/api/admin/chat/conversations/${encodeURIComponent(activeId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'open' }) })
    loadConversations()
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return conversations
    return conversations.filter((c:any)=> (c.title||'').toLowerCase().includes(q) || (c.lastMessage||'').toLowerCase().includes(q))
  }, [conversations, search])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1 bg-white rounded-xl shadow border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2"><FiMessageSquare /><h2 className="font-bold text-gray-800">Soporte y Chats</h2></div>
            <button onClick={loadConversations} title="Refrescar" className="p-2 rounded hover:bg-gray-100"><FiRefreshCw /></button>
          </div>
          <div className="p-3 border-b flex items-center gap-2">
            <FiSearch className="text-gray-400" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar" className="w-full py-2 outline-none" />
          </div>
          <div className="max-h-[65vh] overflow-auto">
            {loadingConvos ? <div className="p-4 text-gray-500">Cargando...</div> : filtered.map((c:any)=> (
              <button key={c.id} onClick={()=>setActiveId(c.id)} className={`w-full text-left p-4 border-b hover:bg-gray-50 ${activeId===c.id?'bg-blue-50':''}`}>
                <div className="font-semibold text-gray-800">{c.title||'Conversación'}</div>
                <div className="text-sm text-gray-600 truncate">{c.lastMessage||''}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2 bg-white rounded-xl shadow border flex flex-col">
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">Selecciona una conversación</div>
          ) : (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <div className="font-semibold text-gray-800">{activeId}</div>
                <div className="flex items-center gap-2">
                  <button onClick={reopenConversation} className="px-3 py-1.5 rounded border text-green-700 border-green-300 hover:bg-green-50 flex items-center gap-1"><FiCheckCircle />Reabrir</button>
                  <button onClick={closeConversation} className="px-3 py-1.5 rounded border text-red-700 border-red-300 hover:bg-red-50 flex items-center gap-1"><FiXCircle />Cerrar</button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-2">
                {loadingMessages ? <div className="text-gray-500">Cargando mensajes...</div> : messages.map((m:any)=> (
                  <div key={m.id} className={`max-w-[80%] rounded-lg px-3 py-2 ${m.senderId==='admin_support'?'ml-auto bg-[#00A676] text-white':'bg-gray-100 text-gray-800'}`}>
                    <div className="text-xs opacity-70 mb-1">{m.senderName||m.senderId}</div>
                    <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                    <div className={`text-[10px] mt-1 ${m.senderId==='admin_support'?'text-white/80':'text-gray-500'}`}>{new Date(m.createdAt?.toDate?.() || m.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t flex items-center gap-2">
                <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={(e:any)=>{if(e.key==='Enter') send()}} placeholder="Responder..." className="flex-1 border rounded px-3 py-2 outline-none" />
                <button onClick={send} className="px-4 py-2 bg-[#0B2545] text-white rounded-lg font-semibold hover:opacity-90">Enviar</button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
