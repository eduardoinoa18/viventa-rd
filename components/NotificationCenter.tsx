'use client'

import { useEffect, useState } from 'react'
import { FiBell, FiCheck, FiX, FiSettings, FiCheckCircle } from 'react-icons/fi'
import Link from 'next/link'

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

export default function NotificationCenter({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (userId) {
      loadNotifications()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [userId])

  const loadNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications/send?userId=${userId}`)
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
        body: JSON.stringify({ notificationId })
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

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-[#00A676] transition-colors"
        aria-label="Notificaciones"
      >
        <FiBell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
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
                    className="text-xs text-[#00A676] hover:text-[#008F64] font-semibold disabled:opacity-50"
                  >
                    Marcar todas leídas
                  </button>
                )}
                <Link
                  href="/dashboard/notifications"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiSettings size={18} />
                </Link>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FiBell className="mx-auto text-4xl text-gray-300 mb-2" />
                  <p>No tienes notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) markAsRead(notification.id)
                        if (notification.url) window.location.href = notification.url
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {notification.icon ? (
                            <img
                              src={notification.icon}
                              alt=""
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <span>{getNotificationIcon(notification.type)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm text-gray-900 line-clamp-2">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                                className="text-[#00A676] hover:text-[#008F64] flex-shrink-0"
                                title="Marcar como leída"
                              >
                                <FiCheckCircle size={16} />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.body}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {getRelativeTime(notification.createdAt)}
                          </p>
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
