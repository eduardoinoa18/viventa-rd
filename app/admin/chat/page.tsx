'use client'
import { useEffect, useMemo, useState } from 'react'
import { FiMessageSquare, FiSearch, FiSend, FiRefreshCw, FiCheckCircle, FiXCircle, FiClock, FiUser } from 'react-icons/fi'
import ProtectedClient from '@/app/auth/ProtectedClient'
import AdminSidebar from '@/components/AdminSidebar'
import AdminTopbar from '@/components/AdminTopbar'
import toast from 'react-hot-toast'

type Conversation = {
  id: string
  title: string
  userId: string
  userName?: string
  userEmail?: string
  lastMessage?: string
  lastMessageAt?: any
  status: 'open' | 'closed'
  unreadCount?: number
  createdAt: any
}

type Message = {
  id: string
  senderId: string
  senderName: string
  content: string
  createdAt: any
  readAt?: any
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all')

  useEffect(() => { 
    loadConversations()
    const interval = setInterval(loadConversations, 10000)
    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => { 
    if (activeId) { 
      loadMessages(activeId)
      const interval = setInterval(() => loadMessages(activeId), 5000)
      return () => clearInterval(interval)
    } 
  }, [activeId])

  async function loadConversations() {
    setLoadingConvos(true)
    try {
      const res = await fetch('/api/admin/chat/conversations?limit=200', { cache: 'no-store' })
      const data = await res.json()
      if (data.conversations) {
        setConversations(data.conversations)
        if (!activeId && data.conversations[0]?.id) {
          setActiveId(data.conversations[0].id)
        }
      }
    } catch (e) {
      console.error('Failed to load conversations', e)
      toast.error('Failed to load conversations')
    } finally { 
      setLoadingConvos(false) 
    }
  }

  async function loadMessages(id: string) {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/admin/chat/conversations/${encodeURIComponent(id)}/messages`, { cache: 'no-store' })
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (e) {
      console.error('Failed to load messages', e)
    } finally { 
      setLoadingMessages(false) 
    }
  }

  async function send() {
    if (!text.trim() || !activeId) return
    const messageText = text
    setText('')
    try {
      await fetch(`/api/admin/chat/conversations/${encodeURIComponent(activeId)}/messages`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ text: messageText }) 
      })
      loadMessages(activeId)
      loadConversations()
    } catch (e) {
      console.error('Failed to send message', e)
      toast.error('Failed to send message')
      setText(messageText) // Restore text on error
    }
  }

  async function closeConversation() {
    if (!activeId) return
    try {
      await fetch(`/api/admin/chat/conversations/${encodeURIComponent(activeId)}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ status: 'closed' }) 
      })
      toast.success('Conversation closed')
      loadConversations()
    } catch (e) {
      console.error('Failed to close conversation', e)
      toast.error('Failed to close conversation')
    }
  }

  async function reopenConversation() {
    if (!activeId) return
    try {
      await fetch(`/api/admin/chat/conversations/${encodeURIComponent(activeId)}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ status: 'open' }) 
      })
      toast.success('Conversation reopened')
      loadConversations()
    } catch (e) {
      console.error('Failed to reopen conversation', e)
      toast.error('Failed to reopen conversation')
    }
  }

  const filtered = useMemo(() => {
    let result = conversations
    
    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter)
    }
    
    // Filter by search
    const q = search.toLowerCase().trim()
    if (q) {
      result = result.filter(c => 
        (c.title || '').toLowerCase().includes(q) || 
        (c.lastMessage || '').toLowerCase().includes(q) ||
        (c.userName || '').toLowerCase().includes(q) ||
        (c.userEmail || '').toLowerCase().includes(q)
      )
    }
    
    return result
  }, [conversations, search, statusFilter])

  const activeConversation = conversations.find(c => c.id === activeId)

  const stats = useMemo(() => ({
    total: conversations.length,
    open: conversations.filter(c => c.status === 'open').length,
    closed: conversations.filter(c => c.status === 'closed').length,
    unread: conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
  }), [conversations])

  return (
    <ProtectedClient allowed={['master_admin', 'admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50 min-h-screen">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-[#0B2545] flex items-center gap-2">
                  <FiMessageSquare /> Chat & Support
                </h1>
                <p className="text-gray-600 mt-1">Gestiona conversaciones y soporte con usuarios</p>
              </div>
              <button 
                onClick={loadConversations} 
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FiRefreshCw className={loadingConvos ? 'animate-spin' : ''} /> Actualizar
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-[#00A676]">
                <div className="text-sm text-gray-600">Total Conversaciones</div>
                <div className="text-2xl font-bold text-[#0B2545]">{stats.total}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                <div className="text-sm text-gray-600">Abiertas</div>
                <div className="text-2xl font-bold text-green-600">{stats.open}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-400">
                <div className="text-sm text-gray-600">Cerradas</div>
                <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                <div className="text-sm text-gray-600">Mensajes sin leer</div>
                <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-280px)]">
            {/* Conversations List */}
            <div className="bg-white rounded-xl shadow border overflow-hidden flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-3">
                  <FiSearch className="text-gray-400" />
                  <input 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    placeholder="Buscar conversaciones..." 
                    className="w-full outline-none text-sm" 
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className={`flex-1 px-3 py-1.5 text-sm rounded ${statusFilter === 'all' ? 'bg-[#00A676] text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Todas
                  </button>
                  <button 
                    onClick={() => setStatusFilter('open')}
                    className={`flex-1 px-3 py-1.5 text-sm rounded ${statusFilter === 'open' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Abiertas
                  </button>
                  <button 
                    onClick={() => setStatusFilter('closed')}
                    className={`flex-1 px-3 py-1.5 text-sm rounded ${statusFilter === 'closed' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Cerradas
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {loadingConvos ? (
                  <div className="p-4 text-center text-gray-500">Cargando...</div>
                ) : filtered.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No hay conversaciones</div>
                ) : (
                  filtered.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => setActiveId(c.id)} 
                      className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                        activeId === c.id ? 'bg-blue-50 border-l-4 border-[#00A676]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          <FiUser className="text-gray-400" />
                          {c.userName || c.userEmail || c.title || 'Usuario'}
                        </div>
                        {c.unreadCount && c.unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 truncate">{c.lastMessage || 'Sin mensajes'}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          c.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {c.status === 'open' ? 'Abierta' : 'Cerrada'}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FiClock />
                          {c.lastMessageAt ? new Date(c.lastMessageAt.toDate?.() || c.lastMessageAt).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Messages Panel */}
            <div className="md:col-span-2 bg-white rounded-xl shadow border flex flex-col">
              {!activeId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <FiMessageSquare className="text-6xl mb-4" />
                  <p>Selecciona una conversación para comenzar</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                    <div>
                      <div className="font-semibold text-gray-800 flex items-center gap-2">
                        <FiUser />
                        {activeConversation?.userName || activeConversation?.userEmail || 'Usuario'}
                      </div>
                      {activeConversation?.userEmail && (
                        <div className="text-sm text-gray-600">{activeConversation.userEmail}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {activeConversation?.status === 'closed' ? (
                        <button 
                          onClick={reopenConversation} 
                          className="px-3 py-1.5 rounded border text-green-700 border-green-300 hover:bg-green-50 flex items-center gap-1 text-sm font-medium"
                        >
                          <FiCheckCircle /> Reabrir
                        </button>
                      ) : (
                        <button 
                          onClick={closeConversation} 
                          className="px-3 py-1.5 rounded border text-red-700 border-red-300 hover:bg-red-50 flex items-center gap-1 text-sm font-medium"
                        >
                          <FiXCircle /> Cerrar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
                    {loadingMessages ? (
                      <div className="text-center text-gray-500">Cargando mensajes...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500">No hay mensajes</div>
                    ) : (
                      messages.map(m => (
                        <div 
                          key={m.id} 
                          className={`flex ${m.senderId === 'admin_support' || m.senderId.includes('admin') ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] rounded-lg px-4 py-2 ${
                            m.senderId === 'admin_support' || m.senderId.includes('admin')
                              ? 'bg-[#00A676] text-white' 
                              : 'bg-white text-gray-800 shadow'
                          }`}>
                            <div className={`text-xs font-medium mb-1 ${
                              m.senderId === 'admin_support' || m.senderId.includes('admin') 
                                ? 'text-white/80' 
                                : 'text-gray-600'
                            }`}>
                              {m.senderName || m.senderId}
                            </div>
                            <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                            <div className={`text-[10px] mt-1 ${
                              m.senderId === 'admin_support' || m.senderId.includes('admin')
                                ? 'text-white/70' 
                                : 'text-gray-500'
                            }`}>
                              {new Date(m.createdAt?.toDate?.() || m.createdAt).toLocaleString('es-DO', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t bg-white">
                    <div className="flex items-center gap-2">
                      <input 
                        value={text} 
                        onChange={e => setText(e.target.value)} 
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} 
                        placeholder="Escribe tu respuesta..." 
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#00A676] focus:border-transparent" 
                        disabled={activeConversation?.status === 'closed'}
                      />
                      <button 
                        onClick={send} 
                        disabled={!text.trim() || activeConversation?.status === 'closed'}
                        className="px-6 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <FiSend /> Enviar
                      </button>
                    </div>
                    {activeConversation?.status === 'closed' && (
                      <div className="mt-2 text-sm text-gray-500 text-center">
                        Esta conversación está cerrada. Reábrela para enviar mensajes.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}
