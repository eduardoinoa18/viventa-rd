'use client'
import { useEffect, useState } from 'react'
import { FiMessageSquare, FiUser, FiArrowRight } from 'react-icons/fi'
import Link from 'next/link'

export default function MessagesPreview() {
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<any[]>([])

  useEffect(() => {
    loadConversations()
  }, [])

  async function loadConversations() {
    setLoading(true)
    try {
      const res = await fetch('/api/messages/conversations', { cache: 'no-store' })
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiMessageSquare />
          <h3 className="font-semibold text-[#0B2545]">Mensajes recientes</h3>
        </div>
        <Link href="/messages" className="text-[#00A6A6] hover:underline text-sm inline-flex items-center gap-1">
          Abrir chat <FiArrowRight />
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-500">Cargando...</div>
      ) : conversations.length === 0 ? (
        <div className="text-gray-500">No tienes conversaciones</div>
      ) : (
        <div className="divide-y">
          {conversations.slice(0, 5).map((c: any) => (
            <Link key={c.id} href="/messages" className="flex items-center gap-3 py-3 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B2545] to-[#00A676] text-white flex items-center justify-center">
                <FiUser />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-800 truncate group-hover:text-[#0B2545]">
                  {c.title || 'Conversación'}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {c.lastMessage || 'Sin mensajes'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
