'use client'
import { useEffect, useMemo, useState } from 'react'
import { FiInbox, FiMessageSquare, FiRefreshCw, FiClock, FiUser, FiTag } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface ConversationSummary {
  conversationId: string
  type: 'lead_chat' | 'support' | 'message'
  refId?: string | null
  userId?: string | null
  agentId?: string | null
  lastMessage: string
  lastAt: string | null
  lastAtMs: number
  senderName: string
  receiverName: string
  unreadCount: number
}

interface MessageItem {
  id: string
  senderId: string
  senderName: string
  receiverId: string
  receiverName: string
  content: string
  read: boolean
  createdAt: string | null
}

export default function MasterInboxPage() {
  const [tab, setTab] = useState<'conversations' | 'leads'>('conversations')
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const [leads, setLeads] = useState<any[]>([])
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [leadFilter, setLeadFilter] = useState<'all' | 'property_inquiry' | 'contact_form' | 'social_waitlist'>('all')

  const selectedConversation = useMemo(
    () => conversations.find((conv) => conv.conversationId === selectedConversationId) || null,
    [conversations, selectedConversationId]
  )

  async function loadConversations() {
    try {
      setLoadingConversations(true)
      const res = await fetch('/api/admin/inbox/conversations?limit=200')
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to load conversations')
      setConversations(json.conversations || [])
      if (!selectedConversationId && (json.conversations || []).length > 0) {
        setSelectedConversationId(json.conversations[0].conversationId)
      }
    } catch (e: any) {
      toast.error(e?.message || 'No se pudieron cargar las conversaciones')
    } finally {
      setLoadingConversations(false)
    }
  }

  async function loadMessages(conversationId: string) {
    try {
      setLoadingMessages(true)
      const res = await fetch(`/api/admin/inbox/messages?conversationId=${encodeURIComponent(conversationId)}`)
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to load messages')
      setMessages(json.messages || [])
    } catch (e: any) {
      toast.error(e?.message || 'No se pudieron cargar los mensajes')
    } finally {
      setLoadingMessages(false)
    }
  }

  async function sendReply() {
    if (!selectedConversation || !reply.trim()) return
    const lastMessage = messages[messages.length - 1]
    const receiverId = selectedConversation.userId || selectedConversation.agentId || lastMessage?.senderId || 'unknown'
    const receiverName = lastMessage?.senderName || 'Usuario'

    try {
      setSending(true)
      const res = await fetch('/api/admin/inbox/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.conversationId,
          content: reply.trim(),
          receiverId,
          receiverName,
        })
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to send message')
      setReply('')
      await loadMessages(selectedConversation.conversationId)
      await loadConversations()
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  async function loadLeads() {
    try {
      setLoadingLeads(true)
      const res = await fetch('/api/admin/leads?limit=100')
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to load leads')
      const parsed = (json.leads || []).map((lead: any) => ({
        ...lead,
        createdAt: lead.createdAt ? new Date(lead.createdAt) : new Date(),
      }))
      setLeads(parsed)
    } catch (e: any) {
      toast.error(e?.message || 'No se pudieron cargar los leads')
      setLeads([])
    } finally {
      setLoadingLeads(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (!selectedConversationId) return
    loadMessages(selectedConversationId)
  }, [selectedConversationId])

  useEffect(() => {
    if (tab === 'leads') {
      loadLeads()
    }
  }, [tab])

  const filteredLeads = useMemo(() => {
    if (leadFilter === 'all') return leads
    return leads.filter((lead) => lead.source === leadFilter)
  }, [leads, leadFilter])

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0B2545] flex items-center gap-3">
              <FiInbox /> Inbox
            </h1>
            <p className="text-gray-600 mt-1">Consultas, mensajes y leads en un solo lugar</p>
          </div>
          <button
            onClick={() => (tab === 'conversations' ? loadConversations() : loadLeads())}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 text-sm"
          >
            <FiRefreshCw /> Actualizar
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setTab('conversations')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'conversations' ? 'bg-[#00A676] text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
          >
            Conversaciones
          </button>
          <button
            onClick={() => setTab('leads')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'leads' ? 'bg-[#00A676] text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
          >
            Leads y consultas
          </button>
        </div>

        {tab === 'conversations' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="font-semibold text-[#0B2545]">Conversaciones</div>
                <div className="text-xs text-gray-500">{conversations.length} total</div>
              </div>
              <div className="max-h-[640px] overflow-y-auto">
                {loadingConversations ? (
                  <div className="p-4 text-center text-gray-500">Cargando...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No hay conversaciones aún</div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.conversationId}
                      onClick={() => setSelectedConversationId(conv.conversationId)}
                      className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 ${selectedConversationId === conv.conversationId ? 'bg-gray-50' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-[#0B2545] truncate">
                          {conv.senderName || conv.receiverName || 'Sin nombre'}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="text-xs bg-[#FF6B35] text-white px-2 py-0.5 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <FiTag />
                        <span>{conv.type === 'lead_chat' ? 'Lead chat' : conv.type === 'support' ? 'Soporte' : 'Mensaje'}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">{conv.lastMessage}</div>
                      <div className="text-[11px] text-gray-400 mt-2 flex items-center gap-2">
                        <FiClock />
                        <span>{conv.lastAt ? new Date(conv.lastAt).toLocaleString('es-DO') : '—'}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#0B2545]">Detalle de conversación</div>
                  {selectedConversation && (
                    <div className="text-xs text-gray-500">{selectedConversation.conversationId}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <FiUser />
                  {selectedConversation?.senderName || selectedConversation?.receiverName || '—'}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {loadingMessages ? (
                  <div className="text-center text-gray-500">Cargando mensajes...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500">Selecciona una conversación para ver mensajes</div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <FiMessageSquare />
                        <span>{msg.senderName || 'Usuario'} → {msg.receiverName || 'Destino'}</span>
                        <span>•</span>
                        <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleString('es-DO') : '—'}</span>
                      </div>
                      <div className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t px-4 py-3">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A676]"
                  rows={3}
                  placeholder="Escribe una respuesta..."
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim() || !selectedConversation}
                    className="px-4 py-2 bg-[#00A676] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                  >
                    {sending ? 'Enviando...' : 'Enviar respuesta'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-[#0B2545]">Leads y consultas</div>
              <div className="flex items-center gap-2 text-sm">
                <label className="text-gray-600">Filtro:</label>
                <select
                  value={leadFilter}
                  onChange={(e) => setLeadFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  aria-label="Filtrar leads"
                >
                  <option value="all">Todos</option>
                  <option value="property_inquiry">Propiedades</option>
                  <option value="contact_form">Contacto</option>
                  <option value="social_waitlist">Waitlist</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3">Origen</th>
                    <th className="text-left p-3">Cliente</th>
                    <th className="text-left p-3">Detalle</th>
                    <th className="text-left p-3">Fecha</th>
                    <th className="text-left p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loadingLeads ? (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">Cargando...</td></tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">No hay leads en este filtro</td></tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            lead.source === 'property_inquiry' ? 'bg-green-100 text-green-800' :
                            lead.source === 'contact_form' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {lead.source === 'property_inquiry' ? 'Propiedad' : lead.source === 'contact_form' ? 'Contacto' : 'Waitlist'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-[#0B2545]">{lead.name}</div>
                          <div className="text-xs text-gray-500">{lead.email}</div>
                        </td>
                        <td className="p-3 text-gray-600 text-xs">
                          {lead.source === 'property_inquiry' ? (lead.propertyTitle || 'Consulta de propiedad') : (lead.message || 'Sin mensaje')}
                        </td>
                        <td className="p-3 text-xs text-gray-500">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleString('es-DO') : '—'}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs">
                            {lead.status || 'new'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
