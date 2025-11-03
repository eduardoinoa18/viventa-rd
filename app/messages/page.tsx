'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import { getSession } from '@/lib/authSession'
import { FiSend, FiSearch, FiMessageSquare, FiUser, FiArrowLeft, FiHelpCircle, FiUserPlus, FiPlus, FiX } from 'react-icons/fi'
import ChatQuitModal from '@/components/ChatQuitModal'

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
  const [quitOpen, setQuitOpen] = useState(false)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [chatType, setChatType] = useState<'support' | 'agent' | null>(null)
  const [newChatMessage, setNewChatMessage] = useState('')
  const [newChatSubject, setNewChatSubject] = useState('')

  useEffect(() => {
    if (!session) {
      setLoadingConvos(false)
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

  async function createNewChat() {
    if (!chatType || !newChatMessage.trim()) return
    
    try {
      if (chatType === 'support') {
        // Create support ticket
        const res = await fetch('/api/support/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: newChatSubject || 'Solicitud de ayuda',
            message: newChatMessage,
            priority: 'normal'
          })
        })
        const data = await res.json()
        if (data.ok && data.conversationId) {
          setActiveId(data.conversationId)
          setShowNewChatModal(false)
          setNewChatMessage('')
          setNewChatSubject('')
          loadConversations()
        }
      } else if (chatType === 'agent') {
        // Create agent chat request (lead)
        const res = await fetch('/api/leads/chat-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: newChatMessage,
            subject: newChatSubject || 'Consulta sobre propiedades'
          })
        })
        const data = await res.json()
        if (data.ok && data.conversationId) {
          setActiveId(data.conversationId)
          setShowNewChatModal(false)
          setNewChatMessage('')
          setNewChatSubject('')
          loadConversations()
        }
      }
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }

  // Simple detector for user-agent conversation pattern
  const isAgentConversation = useMemo(() => {
    return (activeId || '').startsWith('user_agent:')
  }, [activeId])
  const agentIdFromConv = useMemo(() => {
    if (!isAgentConversation || !activeId) return undefined
    const parts = activeId.split(':')
    return parts[2]
  }, [activeId, isAgentConversation])

  const filteredConvos = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter((c: any) => (c.title || '').toLowerCase().includes(q))
  }, [conversations, search])

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      {!session ? (
        <main className="flex-1 flex items-center justify-center px-4 py-20 bg-gradient-to-br from-viventa-sand/30 via-white to-viventa-turquoise/10">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-viventa-turquoise/20">
            <div className="w-20 h-20 bg-gradient-to-br from-viventa-turquoise to-viventa-ocean rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiMessageSquare className="text-4xl text-white" />
            </div>
            <h2 className="text-3xl font-bold text-viventa-navy mb-4">Mensajes</h2>
            <p className="text-gray-600 mb-8">
              Inicia sesión para chatear con agentes, recibir soporte y gestionar tus conversaciones
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full px-8 py-4 bg-gradient-to-r from-viventa-turquoise to-viventa-ocean text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="w-full mt-3 px-8 py-4 border-2 border-viventa-ocean text-viventa-ocean rounded-xl font-semibold hover:bg-viventa-sand/30 transition-all"
            >
              Crear Cuenta
            </button>
          </div>
        </main>
      ) : (
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid md:grid-cols-3 gap-4">
        {/* Conversations List */}
        <div className="md:col-span-1 bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <FiMessageSquare />
              <h2 className="font-bold text-gray-800">Mensajes</h2>
            </div>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 rounded-lg bg-gradient-to-r from-viventa-turquoise to-viventa-teal text-white hover:shadow-lg transition-all"
              aria-label="Nuevo chat"
            >
              <FiPlus className="text-lg" />
            </button>
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
                <button key={c.id} onClick={()=>setActiveId(c.id)} className={`w-full text-left p-4 border-b hover:bg-viventa-sand/30 transition-colors ${activeId === c.id ? 'bg-viventa-turquoise/10 border-l-4 border-l-viventa-turquoise' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-viventa-turquoise to-viventa-ocean text-white flex items-center justify-center shadow-md">
                      <FiUser />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-viventa-navy truncate">{c.title || 'Conversación'}</div>
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
              <div className="p-4 border-b flex items-center gap-3 bg-gradient-to-r from-white to-viventa-sand/20">
                <button className="md:hidden p-2 rounded hover:bg-viventa-sand transition-colors" onClick={()=>setActiveId(null)} aria-label="Back to conversations list">
                  <FiArrowLeft className="text-viventa-ocean" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-viventa-turquoise to-viventa-ocean text-white flex items-center justify-center shadow-md"><FiUser /></div>
                <div className="font-semibold text-viventa-navy flex-1">Chat</div>
                {isAgentConversation && (
                  <button onClick={()=>setQuitOpen(true)} className="text-sm px-3 py-1.5 rounded border-2 text-viventa-sunset border-viventa-sunset hover:bg-viventa-sunset/10 transition-colors">Dejar a mi agente</button>
                )}
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
                      <div key={m.id} className={`max-w-[80%] rounded-lg px-4 py-3 shadow-sm ${mine ? 'ml-auto bg-gradient-to-r from-viventa-turquoise to-viventa-ocean text-white' : 'bg-viventa-sand text-viventa-navy'}`}>
                        <div className="whitespace-pre-wrap text-sm">{m.text ?? m.content}</div>
                        <div className={`text-[10px] mt-1 ${mine ? 'text-white/80' : 'text-gray-600'}`}>{new Date(m.createdAt?.toDate?.() || m.createdAt).toLocaleString()}</div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="p-3 border-t flex items-center gap-2 bg-gray-50">
                <input
                  value={text}
                  onChange={e=>setText(e.target.value)}
                  onKeyDown={(e:any)=>{ if(e.key==='Enter' && !e.shiftKey) sendMessage() }}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-viventa-turquoise focus:border-transparent transition-all"
                />
                <button onClick={sendMessage} disabled={!text.trim()} className="px-5 py-3 bg-gradient-to-r from-viventa-turquoise to-viventa-ocean text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Send message">
                  <FiSend />
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      )}
      <Footer />
      <BottomNav />
    </div>
    
    <ChatQuitModal open={quitOpen} onClose={()=>setQuitOpen(false)} agentId={agentIdFromConv} />
    
    {/* New Chat Modal */}
    {showNewChatModal && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-viventa-turquoise to-viventa-ocean text-white">
            <h3 className="text-xl font-bold">Nuevo Chat</h3>
            <button onClick={() => setShowNewChatModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors" aria-label="Close modal">
              <FiX className="text-xl" />
            </button>
          </div>
          
          {!chatType ? (
            <div className="p-6 space-y-4">
              <p className="text-gray-600 mb-6">¿Cómo podemos ayudarte?</p>
              
              <button
                onClick={() => setChatType('agent')}
                className="w-full p-6 border-2 border-viventa-ocean rounded-xl hover:bg-viventa-sand/30 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-viventa-turquoise to-viventa-teal flex items-center justify-center text-white flex-shrink-0">
                    <FiUserPlus className="text-xl" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-viventa-navy text-lg mb-1">Hablar con un Agente</h4>
                    <p className="text-sm text-gray-600">Conecta con un agente inmobiliario para consultas sobre propiedades, visitas o asesoría personalizada.</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setChatType('support')}
                className="w-full p-6 border-2 border-viventa-sunset rounded-xl hover:bg-viventa-sand/30 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-viventa-sunset to-viventa-coral flex items-center justify-center text-white flex-shrink-0">
                    <FiHelpCircle className="text-xl" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-viventa-navy text-lg mb-1">Soporte Técnico</h4>
                    <p className="text-sm text-gray-600">Crea un ticket de soporte para problemas con la plataforma, cuenta o cualquier asistencia técnica.</p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-4 max-h-[calc(90vh-80px)] overflow-y-auto">
              <button
                onClick={() => setChatType(null)}
                className="flex items-center gap-2 text-viventa-ocean hover:text-viventa-teal transition-colors mb-2"
              >
                <FiArrowLeft />
                <span className="text-sm">Volver</span>
              </button>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {chatType === 'agent' ? 'Asunto de la consulta' : 'Asunto del ticket'}
                </label>
                <input
                  type="text"
                  value={newChatSubject}
                  onChange={(e) => setNewChatSubject(e.target.value)}
                  placeholder={chatType === 'agent' ? 'Ej: Consulta sobre apartamento en Punta Cana' : 'Ej: Problema con mi cuenta'}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-viventa-turquoise focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {chatType === 'agent' ? 'Tu mensaje' : 'Describe el problema'}
                </label>
                <textarea
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  placeholder={chatType === 'agent' 
                    ? 'Cuéntale al agente qué estás buscando...' 
                    : 'Describe el problema con el mayor detalle posible...'
                  }
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-viventa-turquoise focus:border-transparent transition-all resize-none"
                />
              </div>
              
              <div className="bg-viventa-sand/30 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  {chatType === 'agent' ? (
                    <>
                      <strong>Nota:</strong> Un agente disponible responderá tu consulta lo antes posible. 
                      Recibirás una notificación cuando te respondan.
                    </>
                  ) : (
                    <>
                      <strong>Nota:</strong> Nuestro equipo de soporte revisará tu ticket y te responderá 
                      en un plazo de 24-48 horas.
                    </>
                  )}
                </p>
              </div>
              
              <button
                onClick={createNewChat}
                disabled={!newChatMessage.trim()}
                className="w-full px-6 py-4 bg-gradient-to-r from-viventa-turquoise to-viventa-ocean text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {chatType === 'agent' ? 'Solicitar Agente' : 'Crear Ticket de Soporte'}
              </button>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  )
}
