// app/admin/inbox/page.tsx
'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { FiMessageSquare, FiSearch, FiSend, FiRefreshCw, FiCheckCircle, FiXCircle, FiClock, FiUser, FiBell, FiMail, FiHome, FiUsers, FiCheck, FiX, FiUserPlus } from 'react-icons/fi'
import ProtectedClient from '@/app/auth/ProtectedClient'
import AdminSidebar from '@/components/AdminSidebar'
import AdminTopbar from '@/components/AdminTopbar'
import toast from 'react-hot-toast'
import { db } from '@/lib/firebaseClient'
import { collection, query, where, orderBy, limit, getDocs, updateDoc, doc, arrayUnion, addDoc, Timestamp, onSnapshot } from 'firebase/firestore'
import { getSession } from '@/lib/authSession'

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

type Notification = {
  id: string
  type: string
  title: string
  message: string
  refId?: string
  propertyId?: string
  createdAt: any
  audience: string[]
  readBy: string[]
}

type SearchUser = {
  id: string
  name: string
  email: string
  role: string
  photoURL?: string
}

type OnlinePro = {
  id: string
  name: string
  email: string
  role: 'agent' | 'broker'
  online?: boolean
  lastSeen?: any
}

function AdminInboxPageContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get('tab')
  const [mainTab, setMainTab] = useState<'chat' | 'notifications' | 'contacts' | 'inquiries' | 'waitlist'>(
    (tabParam as any) || 'chat'
  )

  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all')

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [contactSubmissions, setContactSubmissions] = useState<any[]>([])
  const [propertyInquiries, setPropertyInquiries] = useState<any[]>([])
  const [waitlist, setWaitlist] = useState<any[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  // User search state
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [onlinePros, setOnlinePros] = useState<OnlinePro[]>([])

  const currentUser = getSession()

  useEffect(() => { 
    loadConversations()
    const interval = setInterval(loadConversations, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!currentUser) return
    loadNotificationsData()
  }, [currentUser])

  useEffect(() => {
    if (activeId) loadMessages()
  }, [activeId])

  useEffect(() => {
    if (!currentUser) return
    const rostersRef = collection(db, 'online_roster')
    const rostersQuery = query(rostersRef, where('online', '==', true))
    const unsubRoster = onSnapshot(rostersQuery, (snapshot: any) => {
      const pros: OnlinePro[] = []
      snapshot.docs.forEach((d: any) => {
        const data = d.data()
        if (data.role === 'agent' || data.role === 'broker') {
          pros.push({ id: d.id, ...data } as OnlinePro)
        }
      })
      setOnlinePros(pros)
    })
    return () => unsubRoster()
  }, [currentUser])

  async function loadConversations() {
    setLoadingConvos(true)
    try {
      const convQuery = query(collection(db, 'conversations'), orderBy('lastMessageAt', 'desc'), limit(100))
      const convSnap = await getDocs(convQuery)
      const convs = convSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Conversation))
      setConversations(convs)
    } catch (e) {
      console.error('Failed to load conversations', e)
      toast.error('Failed to load conversations')
    } finally {
      setLoadingConvos(false)
    }
  }

  async function loadMessages() {
    if (!activeId) return
    setLoadingMessages(true)
    try {
      const msgQuery = query(collection(db, 'conversations', activeId, 'messages'), orderBy('createdAt', 'asc'), limit(200))
      const msgSnap = await getDocs(msgQuery)
      const msgs = msgSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Message))
      setMessages(msgs)
      const convRef = doc(db, 'conversations', activeId)
      await updateDoc(convRef, { unreadCount: 0 })
      setConversations(prev => prev.map(c => c.id === activeId ? { ...c, unreadCount: 0 } : c))
    } catch (e) {
      console.error('Failed to load messages', e)
      toast.error('Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  async function send() {
    if (!text.trim() || !activeId || !currentUser) return
    try {
      const messageRef = collection(db, 'conversations', activeId, 'messages')
      await addDoc(messageRef, {
        senderId: currentUser.uid,
        senderName: currentUser.name || 'Admin Support',
        content: text,
        createdAt: Timestamp.now()
      })
      await updateDoc(doc(db, 'conversations', activeId), {
        lastMessage: text,
        lastMessageAt: Timestamp.now()
      })
      setText('')
      loadMessages()
    } catch (e) {
      console.error('Failed to send message', e)
      toast.error('Failed to send message')
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

  async function loadNotificationsData() {
    if (!currentUser) return
    setLoadingNotifications(true)
    try {
      const notifQuery = query(
        collection(db, 'notifications'),
        where('audience', 'array-contains-any', [currentUser.role || 'admin', 'all']),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const notifSnap = await getDocs(notifQuery)
      const notifs = notifSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Notification))
      setNotifications(notifs)

      const contactQuery = query(collection(db, 'contact_submissions'), orderBy('createdAt', 'desc'), limit(50))
      const contactSnap = await getDocs(contactQuery)
      const contacts = contactSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
      setContactSubmissions(contacts)

      const inquiryQuery = query(collection(db, 'property_inquiries'), orderBy('createdAt', 'desc'), limit(50))
      const inquirySnap = await getDocs(inquiryQuery)
      const inquiries = inquirySnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
      setPropertyInquiries(inquiries)

      const waitlistSocialQuery = query(collection(db, 'waitlist_social'), orderBy('createdAt', 'desc'), limit(50))
      const waitlistPlatformQuery = query(collection(db, 'waitlist_platform'), orderBy('createdAt', 'desc'), limit(50))
      const [waitlistSocialSnap, waitlistPlatformSnap] = await Promise.all([
        getDocs(waitlistSocialQuery),
        getDocs(waitlistPlatformQuery)
      ])
      const socialWaitlist = waitlistSocialSnap.docs.map((d: any) => ({ id: d.id, ...d.data(), source: 'social' }))
      const platformWaitlist = waitlistPlatformSnap.docs.map((d: any) => ({ id: d.id, ...d.data(), source: 'platform' }))
      const combined = [...socialWaitlist, ...platformWaitlist].sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
      setWaitlist(combined)
    } catch (e) {
      console.error('Failed to load notifications', e)
      toast.error('Failed to load notifications')
    } finally {
      setLoadingNotifications(false)
    }
  }

  async function markNotificationAsRead(notificationId: string) {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        readBy: arrayUnion(currentUser.uid)
      })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, readBy: [...n.readBy, currentUser.uid] } : n)
      )
    } catch (e) {
      console.error('Failed to mark as read', e)
    }
  }

  async function markSubmissionAsRead(submissionId: string, type: 'contact' | 'inquiry' | 'waitlist', source?: 'social' | 'platform') {
    if (!currentUser) return
    try {
      let collectionName = type === 'contact' ? 'contact_submissions' : type === 'inquiry' ? 'property_inquiries' : 'waitlist_social'
      if (type === 'waitlist' && source) {
        collectionName = source === 'social' ? 'waitlist_social' : 'waitlist_platform'
      }
      await updateDoc(doc(db, collectionName, submissionId), {
        readBy: arrayUnion(currentUser.uid),
        status: 'read'
      })
      
      if (type === 'contact') {
        setContactSubmissions(prev => 
          prev.map(c => c.id === submissionId ? { ...c, readBy: [...(c.readBy || []), currentUser.uid], status: 'read' } : c)
        )
      } else if (type === 'inquiry') {
        setPropertyInquiries(prev => 
          prev.map(i => i.id === submissionId ? { ...i, readBy: [...(i.readBy || []), currentUser.uid], status: 'read' } : i)
        )
      } else if (type === 'waitlist') {
        setWaitlist(prev =>
          prev.map(w => w.id === submissionId ? { ...w, readBy: [...(w.readBy || []), currentUser.uid], status: 'read' } : w)
        )
      }
    } catch (e) {
      console.error('Failed to mark submission as read', e)
    }
  }

  async function searchUsers() {
    if (!userSearchQuery.trim()) {
      setSearchResults([])
      return
    }
    setSearchingUsers(true)
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearchQuery)}`)
      const data = await res.json()
      if (data.ok && data.data) {
        setSearchResults(data.data.map((u: any) => ({
          id: u.id,
          name: u.name || u.email,
          email: u.email,
          role: u.role || 'user',
          photoURL: u.photoURL
        })))
      }
    } catch (e) {
      console.error('Failed to search users', e)
      toast.error('Failed to search users')
    } finally {
      setSearchingUsers(false)
    }
  }

  async function startConversationWithUser(user: SearchUser) {
    try {
      const conversationRef = await addDoc(collection(db, 'conversations'), {
        title: `Chat with ${user.name}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        status: 'open',
        createdAt: Timestamp.now(),
        lastMessageAt: Timestamp.now(),
        unreadCount: 0
      })
      
      toast.success(`Conversation started with ${user.name}`)
      setShowUserSearch(false)
      setUserSearchQuery('')
      setSearchResults([])
      await loadConversations()
      setActiveId(conversationRef.id)
      setMainTab('chat')
    } catch (e) {
      console.error('Failed to start conversation', e)
      toast.error('Failed to start conversation')
    }
  }

  function formatLastSeen(ts: any) {
    if (!ts) return ''
    let date: Date | null = null
    if (typeof ts?.toDate === 'function') date = ts.toDate()
    else if (typeof ts === 'number') date = new Date(ts)
    else if (ts instanceof Date) date = ts
    if (!date) return ''
    const diffMs = Date.now() - date.getTime()
    const minutes = Math.floor(diffMs / 60000)
    if (minutes < 1) return 'hace un momento'
    if (minutes === 1) return 'hace 1 min'
    if (minutes < 60) return `hace ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours === 1) return 'hace 1 hora'
    if (hours < 24) return `hace ${hours} horas`
    const days = Math.floor(hours / 24)
    return days === 1 ? 'hace 1 día' : `hace ${days} días`
  }

  const filtered = useMemo(() => {
    let result = conversations
    
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter)
    }
    
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

  const unreadNotifications = notifications.filter(n => !n.readBy.includes(currentUser?.uid || '')).length
  const unreadContacts = contactSubmissions.filter(c => !(c.readBy || []).includes(currentUser?.uid || '')).length
  const unreadInquiries = propertyInquiries.filter(i => !(i.readBy || []).includes(currentUser?.uid || '')).length
  const unreadWaitlist = waitlist.filter(w => !(w.readBy || []).includes(currentUser?.uid || '')).length

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
                  <FiMessageSquare /> Communications Hub
                </h1>
                <p className="text-gray-600 mt-1">Manage conversations, notifications, contacts & inquiries</p>
              </div>
              <div className="flex gap-2">
                {mainTab === 'chat' && (
                  <button 
                    onClick={() => setShowUserSearch(!showUserSearch)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A676] text-white rounded-lg hover:bg-[#008F64] font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    <FiUserPlus /> New Message
                  </button>
                )}
                <button 
                  onClick={mainTab === 'chat' ? loadConversations : loadNotificationsData} 
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <FiRefreshCw className={loadingConvos || loadingNotifications ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {/* Main Tabs */}
            <div className="mt-6 flex gap-2 border-b overflow-x-auto bg-white rounded-t-lg px-2 pt-2">
              <button
                onClick={() => setMainTab('chat')}
                className={`px-6 py-3 font-semibold whitespace-nowrap transition-all ${
                  mainTab === 'chat'
                    ? 'border-b-2 border-[#00A676] text-[#00A676]'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FiMessageSquare className="inline mr-2" />
                Chat Support
              </button>
              <button
                onClick={() => setMainTab('notifications')}
                className={`px-6 py-3 font-semibold whitespace-nowrap transition-all relative ${
                  mainTab === 'notifications'
                    ? 'border-b-2 border-[#00A676] text-[#00A676]'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FiBell className="inline mr-2" />
                Notifications
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMainTab('contacts')}
                className={`px-6 py-3 font-semibold whitespace-nowrap transition-all relative ${
                  mainTab === 'contacts'
                    ? 'border-b-2 border-[#00A676] text-[#00A676]'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FiMail className="inline mr-2" />
                Contacts
                {unreadContacts > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {unreadContacts}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMainTab('inquiries')}
                className={`px-6 py-3 font-semibold whitespace-nowrap transition-all relative ${
                  mainTab === 'inquiries'
                    ? 'border-b-2 border-[#00A676] text-[#00A676]'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FiHome className="inline mr-2" />
                Property Inquiries
                {unreadInquiries > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {unreadInquiries}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMainTab('waitlist')}
                className={`px-6 py-3 font-semibold whitespace-nowrap transition-all relative ${
                  mainTab === 'waitlist'
                    ? 'border-b-2 border-[#00A676] text-[#00A676]'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FiUsers className="inline mr-2" />
                Platform Waitlist
                {unreadWaitlist > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {unreadWaitlist}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* User Search Modal */}
          {showUserSearch && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="p-6 border-b flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Start New Conversation</h2>
                  <button onClick={() => setShowUserSearch(false)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close" title="Close">
                    <FiX className="text-xl" />
                  </button>
                </div>
                <div className="p-6 border-b">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                        placeholder="Search by name, email, or role..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={searchUsers}
                      disabled={searchingUsers}
                      className="px-6 py-2 bg-[#00A676] text-white rounded-lg hover:bg-[#008F64] disabled:opacity-50 font-semibold"
                    >
                      Search
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {searchingUsers ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A676] mx-auto"></div>
                      <p className="text-gray-600 mt-4">Searching...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-12">
                      <FiUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {userSearchQuery ? 'No users found' : 'Enter a search query to find users'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map(user => (
                        <button
                          key={user.id}
                          onClick={() => startConversationWithUser(user)}
                          className="w-full p-4 border border-gray-200 rounded-lg hover:border-[#00A676] hover:bg-blue-50 transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">{user.name}</div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                            </div>
                            <div className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                              {user.role}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chat Tab Content */}
          {mainTab === 'chat' && (
            <>
              {/* Online Pros Roster */}
              <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow border p-4 mb-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-600"></span>
                    </span>
                    <h3 className="font-semibold text-gray-800">Pros Online</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{onlinePros.length}</span>
                  </div>
                </div>
                {onlinePros.length === 0 ? (
                  <div className="text-sm text-gray-500">No agents or brokers online</div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto py-1">
                    {onlinePros.map(p => (
                      <div key={p.id} className="flex items-center gap-3 px-3 py-2 border rounded-lg hover:bg-gray-50 transition-all shrink-0">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white flex items-center justify-center font-bold">
                            {(p.name || p.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="absolute -bottom-0 -right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white" title="Online"></span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#0B2545]">{p.name || p.email}</div>
                          <div className="text-[11px] text-gray-500 uppercase">{p.role}</div>
                        </div>
                        <button
                          onClick={() => startConversationWithUser({ id: p.id, name: p.name || p.email, email: p.email, role: p.role })}
                          className="ml-1 px-2 py-1 text-xs bg-[#00A676] text-white rounded hover:bg-[#008F64] transition-colors"
                        >
                          Chat
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-[#00A676] to-[#008F64] text-white rounded-lg shadow-lg p-4 border-l-4 border-green-400 transition-all hover:shadow-xl hover:-translate-y-0.5">
                  <div className="text-sm opacity-90">Total Conversations</div>
                  <div className="text-3xl font-bold mt-1">{stats.total}</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-4 border-l-4 border-green-300 transition-all hover:shadow-xl hover:-translate-y-0.5">
                  <div className="text-sm opacity-90">Open</div>
                  <div className="text-3xl font-bold mt-1">{stats.open}</div>
                </div>
                <div className="bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-lg shadow-lg p-4 border-l-4 border-gray-300 transition-all hover:shadow-xl hover:-translate-y-0.5">
                  <div className="text-sm opacity-90">Closed</div>
                  <div className="text-3xl font-bold mt-1">{stats.closed}</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-4 border-l-4 border-orange-300 transition-all hover:shadow-xl hover:-translate-y-0.5">
                  <div className="text-sm opacity-90">Unread Messages</div>
                  <div className="text-3xl font-bold mt-1">{stats.unread}</div>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-460px)]">
                {/* Conversations List */}
                <div className="bg-white rounded-xl shadow-lg border overflow-hidden flex flex-col">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <FiSearch className="text-gray-400" />
                      <input 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        placeholder="Search conversations..." 
                        className="w-full outline-none text-sm bg-transparent" 
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setStatusFilter('all')}
                        className={`flex-1 px-3 py-1.5 text-sm rounded transition-all ${statusFilter === 'all' ? 'bg-[#00A676] text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        All
                      </button>
                      <button 
                        onClick={() => setStatusFilter('open')}
                        className={`flex-1 px-3 py-1.5 text-sm rounded transition-all ${statusFilter === 'open' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        Open
                      </button>
                      <button 
                        onClick={() => setStatusFilter('closed')}
                        className={`flex-1 px-3 py-1.5 text-sm rounded transition-all ${statusFilter === 'closed' ? 'bg-gray-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        Closed
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {loadingConvos ? (
                      <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : filtered.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No conversations</div>
                    ) : (
                      filtered.map(c => (
                        <button 
                          key={c.id} 
                          onClick={() => setActiveId(c.id)} 
                          className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-all ${
                            activeId === c.id ? 'bg-blue-50 border-l-4 border-[#00A676]' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="font-semibold text-gray-800 flex items-center gap-2">
                              <FiUser className="text-gray-400" />
                              {c.userName || c.userEmail || c.title || 'User'}
                            </div>
                            {c.unreadCount && c.unreadCount > 0 && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                                {c.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 truncate">{c.lastMessage || 'No messages'}</div>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded transition-colors ${
                              c.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {c.status === 'open' ? 'Open' : 'Closed'}
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
                <div className="md:col-span-2 bg-white rounded-xl shadow-lg border flex flex-col">
                  {!activeId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                      <FiMessageSquare className="text-6xl mb-4 text-gray-300" />
                      <p>Select a conversation to start</p>
                    </div>
                  ) : (
                    <>
                      {/* Header */}
                      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                        <div>
                          <div className="font-semibold text-gray-800 flex items-center gap-2">
                            <FiUser />
                            {activeConversation?.userName || activeConversation?.userEmail || 'User'}
                          </div>
                          {activeConversation?.userEmail && (
                            <div className="text-sm text-gray-600">{activeConversation.userEmail}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {activeConversation?.status === 'closed' ? (
                            <button 
                              onClick={reopenConversation} 
                              className="px-3 py-1.5 rounded border text-green-700 border-green-300 hover:bg-green-50 flex items-center gap-1 text-sm font-medium transition-all"
                            >
                              <FiCheckCircle /> Reopen
                            </button>
                          ) : (
                            <button 
                              onClick={closeConversation} 
                              className="px-3 py-1.5 rounded border text-red-700 border-red-300 hover:bg-red-50 flex items-center gap-1 text-sm font-medium transition-all"
                            >
                              <FiXCircle /> Close
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
                        {loadingMessages ? (
                          <div className="text-center text-gray-500">Loading messages...</div>
                        ) : messages.length === 0 ? (
                          <div className="text-center text-gray-500">No messages</div>
                        ) : (
                          messages.map(m => (
                            <div 
                              key={m.id} 
                              className={`flex ${m.senderId === 'admin_support' || m.senderId.includes('admin') ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                            >
                              <div className={`max-w-[75%] rounded-lg px-4 py-2 transition-all hover:shadow-md ${
                                m.senderId === 'admin_support' || m.senderId.includes('admin')
                                  ? 'bg-gradient-to-r from-[#00A676] to-[#008F64] text-white' 
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
                            placeholder="Type your response..." 
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#00A676] focus:border-transparent transition-all" 
                            disabled={activeConversation?.status === 'closed'}
                          />
                          <button 
                            onClick={send} 
                            disabled={!text.trim() || activeConversation?.status === 'closed'}
                            className="px-6 py-2 bg-gradient-to-r from-[#00A676] to-[#008F64] text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                          >
                            <FiSend /> Send
                          </button>
                        </div>
                        {activeConversation?.status === 'closed' && (
                          <div className="mt-2 text-sm text-gray-500 text-center">
                            This conversation is closed. Reopen it to send messages.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notifications Tab Content */}
          {mainTab === 'notifications' && (
            <div className="space-y-4">
              {loadingNotifications ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A676] mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-12 text-center">
                  <FiBell className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No notifications</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const isRead = notif.readBy.includes(currentUser?.uid || '')
                  return (
                    <div
                      key={notif.id}
                      className={`bg-white rounded-xl shadow p-6 border-l-4 transition-all hover:shadow-lg ${
                        isRead ? 'border-gray-300' : 'border-[#00A676]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              notif.type === 'contact_submission' ? 'bg-blue-100 text-blue-800' :
                              notif.type === 'property_inquiry' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {notif.type}
                            </span>
                            {!isRead && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold animate-pulse">
                                New
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-gray-800 mb-1">{notif.title}</h3>
                          <p className="text-gray-600 text-sm mb-2">{notif.message}</p>
                          <p className="text-xs text-gray-500">
                            {notif.createdAt?.toDate?.().toLocaleString('es-DO') || 'Unknown date'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!isRead && (
                            <button
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Mark as read"
                            >
                              <FiCheck />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Contacts Tab Content */}
          {mainTab === 'contacts' && (
            <div className="space-y-4">
              {loadingNotifications ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A676] mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading...</p>
                </div>
              ) : contactSubmissions.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-12 text-center">
                  <FiMail className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No contact submissions</p>
                </div>
              ) : (
                contactSubmissions.map(contact => {
                  const isRead = (contact.readBy || []).includes(currentUser?.uid || '')
                  return (
                    <div
                      key={contact.id}
                      className={`bg-white rounded-xl shadow p-6 border-l-4 transition-all hover:shadow-lg ${
                        isRead ? 'border-gray-300' : 'border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                              {contact.type || 'general'}
                            </span>
                            {!isRead && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold animate-pulse">
                                New
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-gray-800 text-lg">{contact.name}</h3>
                          <p className="text-sm text-gray-600">
                            {contact.email} • {contact.phone}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {contact.createdAt?.toDate?.().toLocaleString('es-DO') || 'Unknown date'}
                          </p>
                        </div>
                        {!isRead && (
                          <button
                            onClick={() => markSubmissionAsRead(contact.id, 'contact')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Mark as read"
                          >
                            <FiCheck />
                          </button>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 shadow-inner">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.message}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Property Inquiries Tab Content */}
          {mainTab === 'inquiries' && (
            <div className="space-y-4">
              {loadingNotifications ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A676] mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading...</p>
                </div>
              ) : propertyInquiries.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-12 text-center">
                  <FiHome className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No property inquiries</p>
                </div>
              ) : (
                propertyInquiries.map(inquiry => {
                  const isRead = (inquiry.readBy || []).includes(currentUser?.uid || '')
                  return (
                    <div
                      key={inquiry.id}
                      className={`bg-white rounded-xl shadow p-6 border-l-4 transition-all hover:shadow-lg ${
                        isRead ? 'border-gray-300' : 'border-green-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                              Property
                            </span>
                            {!isRead && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold animate-pulse">
                                New
                              </span>
                            )}
                            {inquiry.visitDate && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                📅 Visit: {new Date(inquiry.visitDate).toLocaleDateString('es-DO')}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-[#0B2545] text-lg mb-2">{inquiry.propertyTitle}</h3>
                          <p className="text-sm text-gray-600 font-semibold">{inquiry.name}</p>
                          <p className="text-sm text-gray-600">
                            {inquiry.email} • {inquiry.phone}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Preferred contact: {inquiry.preferredContact === 'email' ? 'Email' : inquiry.preferredContact === 'phone' ? 'Phone' : 'WhatsApp'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {inquiry.createdAt?.toDate?.().toLocaleString('es-DO') || 'Unknown date'}
                          </p>
                        </div>
                        {!isRead && (
                          <button
                            onClick={() => markSubmissionAsRead(inquiry.id, 'inquiry')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Mark as read"
                          >
                            <FiCheck />
                          </button>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 shadow-inner">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{inquiry.message}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Waitlist Tab Content */}
          {mainTab === 'waitlist' && (
            <div className="space-y-4">
              {loadingNotifications ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A676] mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading...</p>
                </div>
              ) : waitlist.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-12 text-center">
                  <FiUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No waitlist entries</p>
                </div>
              ) : (
                waitlist.map(wl => {
                  const isRead = (wl.readBy || []).includes(currentUser?.uid || '')
                  const isSocial = wl.source === 'social'
                  return (
                    <div
                      key={wl.id}
                      className={`bg-white rounded-xl shadow p-6 border-l-4 transition-all hover:shadow-lg ${
                        isRead ? 'border-gray-300' : isSocial ? 'border-purple-500' : 'border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              isSocial ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isSocial ? 'Social Network' : 'Platform Access'}
                            </span>
                            {!isRead && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold animate-pulse">
                                New
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-gray-800 text-lg mb-2">{wl.email}</h3>
                          <p className="text-xs text-gray-500">
                            {wl.createdAt?.toDate?.().toLocaleString('es-DO') || 'Unknown date'}
                          </p>
                        </div>
                        {!isRead && (
                          <button
                            onClick={() => markSubmissionAsRead(wl.id, 'waitlist', wl.source)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
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
          )}
        </main>
      </div>
    </ProtectedClient>
  )
}

export default function AdminInboxPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminTopbar />
          <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A676] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </main>
        </div>
      </div>
    }>
      <AdminInboxPageContent />
    </Suspense>
  )
}
