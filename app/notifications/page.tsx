'use client'
import { useEffect, useMemo, useState } from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useRouter } from 'next/navigation'
import { getSession } from '../../lib/authSession'
import { FiBell, FiCheckCircle, FiFilter, FiRefreshCw } from 'react-icons/fi'

type Notification = {
  id: string
  type: string
  title: string
  body?: string
  icon?: string
  url?: string
  read: boolean
  createdAt?: string | null
}

type FilterType = 'all' | 'unread' | 'read'

export const dynamic = 'force-dynamic'

export default function NotificationsPage() {
  const router = useRouter()
  const session = typeof window !== 'undefined' ? getSession() : null
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    if (!session) { setLoading(false); return }
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await fetch(`/api/notifications/send?userId=${encodeURIComponent(session!.uid)}`)
      const json = await res.json()
      if (json.ok) setItems(json.data || [])
    } catch (e) {
      console.error('Failed to load notifications', e)
    } finally {
      setLoading(false)
    }
  }

  async function markAllAsRead() {
    if (!session) return
    try {
      await fetch('/api/notifications/send', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.uid, markAllAsRead: true })
      })
      setItems(prev => prev.map(n => ({ ...n, read: true })))
    } catch (e) {
      console.error('Failed to mark all read', e)
    }
  }

  async function markOne(id: string) {
    if (!session) return
    try {
      await fetch('/api/notifications/send', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, userId: session.uid })
      })
      setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (e) {
      console.error('Failed to mark read', e)
    }
  }

  const visible = useMemo(() => {
    if (filter === 'unread') return items.filter(i => !i.read)
    if (filter === 'read') return items.filter(i => i.read)
    return items
  }, [items, filter])

  const unreadCount = items.filter(i => !i.read).length

  const getRelativeTime = (dateString?: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return 'Justo ahora'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `Hace ${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Hace ${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `Hace ${days}d`
    return date.toLocaleDateString('es-DO')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0B2545] flex items-center gap-2"><FiBell /> Notificaciones</h1>
            <p className="text-gray-600 text-sm">Centro de notificaciones</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-2">
              <FiRefreshCw /> Actualizar
            </button>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="px-3 py-2 rounded-lg bg-[#00A676] text-white hover:bg-[#008F64] inline-flex items-center gap-2">
                <FiCheckCircle /> Marcar todas como leídas
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 bg-white border rounded-lg p-2 flex gap-2 items-center">
          <FiFilter className="text-gray-500" />
          <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded ${filter==='all' ? 'bg-[#00A676] text-white' : 'hover:bg-gray-100'}`}>Todas ({items.length})</button>
          <button onClick={() => setFilter('unread')} className={`px-3 py-1 rounded ${filter==='unread' ? 'bg-[#00A676] text-white' : 'hover:bg-gray-100'}`}>No leídas ({unreadCount})</button>
          <button onClick={() => setFilter('read')} className={`px-3 py-1 rounded ${filter==='read' ? 'bg-[#00A676] text-white' : 'hover:bg-gray-100'}`}>Leídas ({items.length - unreadCount})</button>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow border divide-y">
          {loading ? (
            <div className="p-6 text-gray-500">Cargando...</div>
          ) : visible.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No hay notificaciones</div>
          ) : (
            visible.map(n => (
              <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.read ? 'bg-blue-50/40' : ''}`}>
                <div className="text-2xl">
                  {n.icon ? (
                    <img src={n.icon} alt="" className="w-8 h-8 rounded" />
                  ) : (
                    <span>🔔</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900 truncate">{n.title}</div>
                    <div className="text-xs text-gray-500">{getRelativeTime(n.createdAt || undefined)}</div>
                  </div>
                  {n.body && <div className="text-sm text-gray-700 mt-1">{n.body}</div>}
                  <div className="mt-2 flex items-center gap-2">
                    {!n.read && (
                      <button onClick={() => markOne(n.id)} className="text-[#00A676] text-sm font-semibold hover:text-[#008F64]">Marcar como leída</button>
                    )}
                    <button
                      onClick={() => router.push(n.url || '/notifications')}
                      className="text-sm text-gray-700 hover:text-[#00A676] font-semibold"
                    >
                      Abrir
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
