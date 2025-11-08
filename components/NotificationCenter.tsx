'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiBell, FiCheck, FiX, FiSettings, FiCheckCircle, FiFilter } from 'react-icons/fi'
import Link from 'next/link'
import { db } from '@/lib/firebaseClient'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { getSession } from '@/lib/authSession'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  icon?: string
  url?: string
  read: boolean
  createdAt: string
}

type FilterType = 'all' | 'unread' | 'read'

export default function NotificationCenter({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [personalLive, setPersonalLive] = useState<Notification[]>([])
  const [broadcastLive, setBroadcastLive] = useState<Notification[]>([])
  const [liveActive, setLiveActive] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const router = useRouter()

  useEffect(() => {
    if (!userId) return
    let unsubPersonal: any = null
    let unsubBroadcast: any = null
    let pollInterval: any = null

    const session = getSession()
    const role = session?.role || 'user'
    try {
      // Listen to personal notifications
      const personalQ = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      unsubPersonal = onSnapshot(personalQ, (snap: any) => {
        const items: Notification[] = snap.docs.map((d: any) => {
          const data = d.data() || {}
          return {
            id: d.id,
            type: data.type,
            title: data.title,
            body: data.body || data.message || '',
            icon: data.icon,
            url: data.url,
            read: !!data.read,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
          }
        })
        setPersonalLive(items)
      })

      // Build audiences for broadcast
      const audSet = new Set<string>(['all'])
      if (role) {
        audSet.add(role)
        if (role === 'admin' || role === 'master_admin') {
          audSet.add('admin')
          audSet.add('master_admin')
        }
      }
      const audiences = Array.from(audSet)

      const broadcastQ = query(
        collection(db, 'notifications'),
        where('audience', 'array-contains-any', audiences),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      unsubBroadcast = onSnapshot(broadcastQ, (snap: any) => {
        const items: Notification[] = snap.docs.map((d: any) => {
          const data = d.data() || {}
          const readBy: string[] = Array.isArray(data.readBy) ? data.readBy : []
          const computedRead = readBy.includes(userId)
          return {
            id: d.id,
            type: data.type,
            title: data.title,
            body: data.body || data.message || '',
            icon: data.icon,
            url: data.url,
          import { useRouter } from 'next/navigation'
            read: computedRead,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
          }
        })
        setBroadcastLive(items)
      })

      setLiveActive(true)
    } catch (e) {
      // Fallback to polling if Firestore listener fails
      setLiveActive(false)
      loadNotifications()
      pollInterval = setInterval(loadNotifications, 30000)
    }

    return () => {
      if (unsubPersonal) unsubPersonal()
      if (unsubBroadcast) unsubBroadcast()
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [userId])

  // Merge live results when active
            const router = useRouter()
  useEffect(() => {
    if (!liveActive) return
    const merged = [...personalLive, ...broadcastLive]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 50)
    setNotifications(merged)
    setUnreadCount(merged.filter(n => !n.read).length)
  }, [personalLive, broadcastLive, liveActive])

  const loadNotifications = async (unreadOnly = false, limit = 50) => {
    try {
      const params = new URLSearchParams({ userId })
      if (unreadOnly) params.append('unreadOnly', 'true')
      if (limit) params.append('limit', limit.toString())
      
      const res = await fetch(`/api/notifications/send?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.ok) {
          setNotifications(data.data)
          setUnreadCount(data.data.filter((n: Notification) => !n.read).length)
        }
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, userId })
      })

      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications/send', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, markAllAsRead: true })
      })

      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      new_message: '💬',
      property_view: '👁️',
      lead_inquiry: '📧',
      application_approved: '✅',
      application_rejected: '❌',
      badge_earned: '🏆',
      level_up: '⬆️',
      new_property: '🏠',
      price_alert: '💰',
      saved_search: '🔍'
    }
    return icons[type] || '🔔'
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Justo ahora'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `Hace ${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Hace ${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `Hace ${days}d`
    return date.toLocaleDateString('es-DO')
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'read') return n.read
    return true
  })

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-[#00A676] transition-colors rounded-full hover:bg-gray-100"
        aria-label="Notificaciones"
      >
        <FiBell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FiBell className="text-[#00A676]" />
                  <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      disabled={loading}
                      className="text-xs text-[#00A676] hover:text-[#008F64] font-semibold disabled:opacity-50 flex items-center gap-1"
                      title="Marcar todas como leídas"
                    >
                      <FiCheckCircle size={14} />
                      Todas
                    </button>
                  )}
                  {!liveActive && (
                    <button
                      onClick={() => loadNotifications(filter === 'unread', 50)}
                      disabled={loading}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
                      title="Refrescar notificaciones"
                    >
                      ↻
                    </button>
                  )}
                  <Link
                    href="/dashboard/notifications"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Configuración"
                  >
                    <FiSettings size={18} />
                  </Link>
                </div>
              </div>
              
              {/* Filter Tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    filter === 'all'
                      ? 'bg-white text-[#00A676] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Todas ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    filter === 'unread'
                      ? 'bg-white text-[#00A676] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  No leídas ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    filter === 'read'
                      ? 'bg-white text-[#00A676] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Leídas ({notifications.length - unreadCount})
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FiBell className="mx-auto text-4xl text-gray-300 mb-2" />
                  <p className="text-sm">
                    {filter === 'unread' && 'No tienes notificaciones sin leer'}
                    {filter === 'read' && 'No tienes notificaciones leídas'}
                    {filter === 'all' && 'No tienes notificaciones'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-all cursor-pointer border-l-4 ${
                        !notification.read 
                          ? 'bg-blue-50/50 border-l-[#00A676]' 
                          : 'border-l-transparent'
                      }`}
                      onClick={() => {
                        if (!notification.read) markAsRead(notification.id)
                        setIsOpen(false)
                        const session = getSession()
                        const role = session?.role || 'user'
                        // Use provided url or route to role-appropriate notifications page
                        const fallback = (role === 'admin' || role === 'master_admin') ? '/admin/notifications' : '/notifications'
                        const target = notification.url || fallback
                        router.push(target)
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {notification.icon ? (
                            <img
                              src={notification.icon}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm line-clamp-2 ${
                              !notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                                className="text-[#00A676] hover:text-[#008F64] flex-shrink-0 transition-colors"
                                title="Marcar como leída"
                              >
                                <FiCheckCircle size={16} />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.body}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-gray-400">
                              {getRelativeTime(notification.createdAt)}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-[#00A676] rounded-full animate-pulse"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <Link
                  href="/dashboard/notifications"
                  className="text-sm text-[#00A676] hover:text-[#008F64] font-semibold"
                  onClick={() => setIsOpen(false)}
                >
                  Ver todas las notificaciones →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
