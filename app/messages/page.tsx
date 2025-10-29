'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getSession } from '@/lib/authSession'
import { FiSend, FiSearch, FiMessageSquare, FiUser, FiArrowLeft } from 'react-icons/fi'

export default function MessagesPage() {
  const router = useRouter()
  const session = typeof window !== 'undefined' ? getSession() : null
  const [conversations, setConversations] = useState<any[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!session) {
      router.replace('/login')
      return
    }
    loadConversations()
  }, [])

  async function loadConversations() {
    setLoadingConvos(true)
    try {
      const res = await fetch('/api/messages/conversations', { cache: 'no-store' })
      const data = await res.json()
      setConversations(data.conversations || [])
      if (!activeId && data.conversations?.[0]?.id) setActiveId(data.conversations[0].id)
    } catch {
      setConversations([])
    } finally {
      setLoadingConvos(false)
    }
  }

  useEffect(() => {
    if (!activeId) return
    loadMessages(activeId)
  }, [activeId])

  async function loadMessages(id: string) {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/messages?conversationId=${encodeURIComponent(id)}`, { cache: 'no-store' })
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  async function sendMessage() {
    const body = { conversationId: activeId, text }
    if (!text.trim() || !activeId) return
    setText('')
    const optimistic = { id: 'tmp_'+Date.now(), text, senderId: session?.uid, createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, optimistic])
    try {
      await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
      loadMessages(activeId)
      loadConversations()
    } catch {
      // revert optimistic if needed
    }
  }

  const filteredConvos = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter((c: any) => (c.title || '').toLowerCase().includes(q))
  }, [conversations, search])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid md:grid-cols-3 gap-4">
        {/* Conversations List */}
        <div className="md:col-span-1 bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2">
            <FiMessageSquare />
            <h2 className="font-bold text-gray-800">Mensajes</h2>
          </div>
          <div className="p-3 border-b">
            <div className="flex items-center gap-2 border rounded px-2">
              <FiSearch className="text-gray-400" />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar" className="w-full py-2 outline-none" />
            </div>
          </div>
          <div className="max-h-[60vh] overflow-auto">
            {loadingConvos ? (
              <div className="p-4 text-gray-500">Cargando...</div>
            ) : filteredConvos.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No tienes conversaciones</div>
            ) : (
              filteredConvos.map((c: any) => (
                <button key={c.id} onClick={()=>setActiveId(c.id)} className={`w-full text-left p-4 border-b hover:bg-gray-50 ${activeId === c.id ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B2545] to-[#00A676] text-white flex items-center justify-center">
                      <FiUser />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 truncate">{c.title || 'Conversación'}</div>
                      <div className="text-sm text-gray-600 truncate">{c.lastMessage || 'Sin mensajes'}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages Thread */}
        <div className="md:col-span-2 bg-white rounded-xl shadow border border-gray-200 flex flex-col">
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 p-6">
              Selecciona una conversación para empezar
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex items-center gap-3">
                <button className="md:hidden p-2 rounded hover:bg-gray-100" onClick={()=>setActiveId(null)}>
                  <FiArrowLeft />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B2545] to-[#00A676] text-white flex items-center justify-center"><FiUser /></div>
                <div className="font-semibold text-gray-800">Chat</div>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-2">
                {loadingMessages ? (
                  <div className="text-gray-500">Cargando mensajes...</div>
                ) : messages.length === 0 ? (
                  <div className="text-gray-500">No hay mensajes todavía</div>
                ) : (
                  messages.map(m => {
                    const mine = m.senderId === session?.uid
                    return (
                      <div key={m.id} className={`max-w-[80%] rounded-lg px-3 py-2 ${mine ? 'ml-auto bg-[#00A676] text-white' : 'bg-gray-100 text-gray-800'}`}>
                        <div className="whitespace-pre-wrap text-sm">{m.text}</div>
                        <div className={`text-[10px] mt-1 ${mine ? 'text-white/80' : 'text-gray-500'}`}>{new Date(m.createdAt?.toDate?.() || m.createdAt).toLocaleString()}</div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="p-3 border-t flex items-center gap-2">
                <input
                  value={text}
                  onChange={e=>setText(e.target.value)}
                  onKeyDown={(e:any)=>{ if(e.key==='Enter') sendMessage() }}
                  placeholder="Escribe un mensaje"
                  className="flex-1 border rounded px-3 py-2 outline-none"
                />
                <button onClick={sendMessage} className="px-4 py-2 bg-[#0B2545] text-white rounded-lg font-semibold hover:opacity-90">
                  <FiSend />
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
