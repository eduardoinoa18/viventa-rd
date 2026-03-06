'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'

type SessionData = {
  uid: string
  role: string
  name?: string
}

type ChatMessage = {
  id: string
  senderId?: string
  senderName?: string
  content?: string
  createdAt?: string
}

function getDefaultConversationId(session: SessionData | null) {
  if (!session?.uid) return ''
  return `support:${session.uid}`
}

export default function MessagesPage() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [conversationId, setConversationId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!active) return
        if (!res.ok || !json?.ok || !json?.session) {
          setSession(null)
          return
        }
        setSession(json.session)
        setConversationId(getDefaultConversationId(json.session))
      } finally {
        if (active) setLoadingSession(false)
      }
    }

    loadSession()
    return () => {
      active = false
    }
  }, [])

  const canChat = useMemo(() => !!session?.uid && !!conversationId, [session?.uid, conversationId])

  useEffect(() => {
    if (!canChat) return
    let active = true

    const loadMessages = async () => {
      try {
        setLoadingMessages(true)
        setError('')
        const res = await fetch(`/api/messages?conversationId=${encodeURIComponent(conversationId)}`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!active) return
        const rows = Array.isArray(json?.messages) ? json.messages : []
        setMessages(rows)
      } catch {
        if (active) setError('No se pudieron cargar los mensajes.')
      } finally {
        if (active) setLoadingMessages(false)
      }
    }

    loadMessages()
    const id = setInterval(loadMessages, 7000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [canChat, conversationId])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!canChat || !text.trim()) return

    try {
      setError('')
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, text: text.trim() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo enviar el mensaje')
      }
      setText('')
      const refresh = await fetch(`/api/messages?conversationId=${encodeURIComponent(conversationId)}`, { cache: 'no-store' })
      const refreshJson = await refresh.json().catch(() => ({}))
      setMessages(Array.isArray(refreshJson?.messages) ? refreshJson.messages : [])
    } catch (sendError: any) {
      setError(sendError?.message || 'No se pudo enviar el mensaje')
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Mensajes</h1>
                <p className="text-sm text-gray-600 mt-1">Chat directo para coordinar información de propiedades y seguimiento de leads.</p>
              </div>
              <Link href="/dashboard" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">
                Volver al dashboard
              </Link>
            </div>
          </section>

          {loadingSession ? (
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm text-gray-600">Cargando sesión...</section>
          ) : !session?.uid ? (
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm text-gray-700">
              Debes iniciar sesión para usar el chat.{' '}
              <Link href="/login?redirect=/messages" className="text-[#00A676] font-medium">Iniciar sesión</Link>.
            </section>
          ) : (
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                <input
                  value={conversationId}
                  onChange={(e) => setConversationId(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="ID de conversación (ej: support:uid o user_agent:buyer:agent)"
                />
                <button
                  type="button"
                  onClick={() => setConversationId(getDefaultConversationId(session))}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]"
                >
                  Chat con soporte
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 h-[420px] overflow-y-auto space-y-2">
                {loadingMessages ? (
                  <p className="text-sm text-gray-500">Cargando mensajes...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay mensajes todavía en esta conversación.</p>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderId === session.uid
                    return (
                      <div key={message.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${mine ? 'ml-auto bg-[#0B2545] text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                        <div className="font-semibold text-[11px] opacity-80">{message.senderName || 'Usuario'}</div>
                        <div>{message.content || ''}</div>
                      </div>
                    )
                  })
                )}
              </div>

              <form onSubmit={sendMessage} className="space-y-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="Escribe tu mensaje..."
                />
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <div className="flex items-center gap-2">
                  <button type="submit" className="px-4 py-2 rounded-lg bg-[#00A676] text-white text-sm font-medium">Enviar</button>
                  <p className="text-xs text-gray-500">Disponible para profesionales y usuarios autenticados.</p>
                </div>
              </form>
            </section>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
