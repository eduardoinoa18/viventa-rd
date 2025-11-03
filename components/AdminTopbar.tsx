// components/AdminTopbar.tsx
'use client'
import React, { useState, useEffect, useRef } from 'react'
import { getCurrentUser, logout } from '../lib/authClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiBell, FiX, FiCheck } from 'react-icons/fi'
import { db } from '../lib/firebaseClient'
import { collection, query, where, orderBy, limit, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  createdAt: any
  readBy: string[]
  refId?: string
}

export default function AdminTopbar() {
  const router = useRouter()
  const u = getCurrentUser()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (u && showNotifications) {
      loadNotifications()
    }
  }, [u, showNotifications])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadNotifications() {
    if (!u) return
    setLoading(true)
    try {
      const q = query(
        collection(db, 'notifications'),
        where('audience', 'array-contains-any', [u.role || 'admin', 'all']),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
      const snap = await getDocs(q)
      const notifs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Notification))
      setNotifications(notifs)
    } catch (e) {
      console.error('Failed to load notifications', e)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(notifId: string) {
    if (!u) return
    try {
      await updateDoc(doc(db, 'notifications', notifId), {
        readBy: arrayUnion(u.uid)
      })
      setNotifications(prev => 
        prev.map(n => n.id === notifId ? { ...n, readBy: [...n.readBy, u.uid] } : n)
      )
    } catch (e) {
      console.error('Failed to mark as read', e)
    }
  }

  async function doLogout() {
    await logout()
    router.push('/')
  }

  const unreadCount = notifications.filter(n => !n.readBy.includes(u?.uid || '')).length

  return (
    <header className="sticky top-0 z-20 bg-white border-b shadow-sm">
      <div className="container mx-auto flex items-center justify-between p-3">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00A676] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <div className="text-lg font-semibold text-[#0B2545]">VIVENTA — Admin</div>
        </Link>
        <div className="flex items-center gap-4">
          {/* Notifications Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiBell className="text-xl text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[500px] overflow-hidden flex flex-col">
                <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <FiX />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1">
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <FiBell className="text-4xl mx-auto mb-2 opacity-50" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map(notif => {
                      const isRead = notif.readBy.includes(u?.uid || '')
                      return (
                        <div 
                          key={notif.id}
                          className={`p-4 border-b hover:bg-gray-50 ${!isRead ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 text-sm">{notif.title}</div>
                              <div className="text-sm text-gray-600 mt-1">{notif.message}</div>
                              <div className="text-xs text-gray-500 mt-2">
                                {notif.createdAt?.toDate?.().toLocaleString('es-DO') || ''}
                              </div>
                            </div>
                            {!isRead && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                                title="Mark as read"
                              >
                                <FiCheck />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                <div className="p-3 border-t bg-gray-50 text-center">
                  <Link 
                    href="/admin/notifications" 
                    className="text-sm text-[#00A676] hover:underline font-medium"
                    onClick={() => setShowNotifications(false)}
                  >
                    View All Notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="text-sm">
            {u ? (
              <div className="flex items-center gap-3">
                <div className="text-gray-700">{u.name} <span className="text-xs text-gray-500">({u.role})</span></div>
                <button onClick={doLogout} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Logout</button>
              </div>
            ) : (
              <div className="text-gray-500">Not signed in</div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
