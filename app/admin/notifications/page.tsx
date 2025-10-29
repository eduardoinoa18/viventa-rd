'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/authSession'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { db } from '@/lib/firebaseClient'
import { collection, query, where, orderBy, limit, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore'
import { FiBell, FiMail, FiHome, FiMessageSquare, FiCheck, FiX, FiEye, FiTrash2 } from 'react-icons/fi'

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

export default function NotificationsPage() {
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [contactSubmissions, setContactSubmissions] = useState<any[]>([])
  const [propertyInquiries, setPropertyInquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'notifications' | 'contacts' | 'inquiries'>('notifications')
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    if (!s || !['admin', 'master', 'master-admin'].includes(s.role || '')) {
      router.replace('/login')
      return
    }
    setUser(s)
    loadData(s.uid, s.role)
  }, [])

  async function loadData(uid: string, role: string) {
    setLoading(true)
    try {
      // Load notifications
      const notifQuery = query(
        collection(db, 'notifications'),
        where('audience', 'array-contains-any', [role, 'all']),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const notifSnap = await getDocs(notifQuery)
      const notifs = notifSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Notification))
      setNotifications(notifs)

      // Load contact submissions
      const contactQuery = query(
        collection(db, 'contact_submissions'),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const contactSnap = await getDocs(contactQuery)
      const contacts = contactSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
      setContactSubmissions(contacts)

      // Load property inquiries
      const inquiryQuery = query(
        collection(db, 'property_inquiries'),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const inquirySnap = await getDocs(inquiryQuery)
      const inquiries = inquirySnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
      setPropertyInquiries(inquiries)
    } catch (e) {
      console.error('Failed to load notifications', e)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(notificationId: string) {
    if (!user) return
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        readBy: arrayUnion(user.uid)
      })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, readBy: [...n.readBy, user.uid] } : n)
      )
    } catch (e) {
      console.error('Failed to mark as read', e)
    }
  }

  async function markSubmissionAsRead(submissionId: string, type: 'contact' | 'inquiry') {
    if (!user) return
    try {
      const collectionName = type === 'contact' ? 'contact_submissions' : 'property_inquiries'
      await updateDoc(doc(db, collectionName, submissionId), {
        readBy: arrayUnion(user.uid),
        status: 'read'
      })
      
      if (type === 'contact') {
        setContactSubmissions(prev => 
          prev.map(c => c.id === submissionId ? { ...c, readBy: [...(c.readBy || []), user.uid], status: 'read' } : c)
        )
      } else {
        setPropertyInquiries(prev => 
          prev.map(i => i.id === submissionId ? { ...i, readBy: [...(i.readBy || []), user.uid], status: 'read' } : i)
        )
      }
    } catch (e) {
      console.error('Failed to mark submission as read', e)
    }
  }

  if (!user) return null

  const unreadNotifications = notifications.filter(n => !n.readBy.includes(user.uid)).length
  const unreadContacts = contactSubmissions.filter(c => !(c.readBy || []).includes(user.uid)).length
  const unreadInquiries = propertyInquiries.filter(i => !(i.readBy || []).includes(user.uid)).length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FiBell className="text-[#00A676]" />
            Centro de Notificaciones
          </h1>
          <p className="text-gray-600">Gestiona tus notificaciones, contactos y consultas</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex gap-2 p-2 border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors relative ${
                activeTab === 'notifications' ? 'bg-[#0B2545] text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FiBell className="inline mr-2" />
              Notificaciones
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors relative ${
                activeTab === 'contacts' ? 'bg-[#0B2545] text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FiMail className="inline mr-2" />
              Contactos
              {unreadContacts > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadContacts}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors relative ${
                activeTab === 'inquiries' ? 'bg-[#0B2545] text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FiHome className="inline mr-2" />
              Consultas Propiedades
              {unreadInquiries > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadInquiries}
                </span>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando...</p>
          </div>
        ) : (
          <>
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="bg-white rounded-xl shadow p-12 text-center">
                    <FiBell className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No hay notificaciones</p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const isRead = notif.readBy.includes(user.uid)
                    return (
                      <div
                        key={notif.id}
                        className={`bg-white rounded-xl shadow p-6 border-l-4 ${
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
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                                  Nueva
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-gray-800 mb-1">{notif.title}</h3>
                            <p className="text-gray-600 text-sm mb-2">{notif.message}</p>
                            <p className="text-xs text-gray-500">
                              {notif.createdAt?.toDate?.().toLocaleString('es-DO') || 'Fecha desconocida'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {!isRead && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded"
                                title="Marcar como leída"
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

            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              <div className="space-y-4">
                {contactSubmissions.length === 0 ? (
                  <div className="bg-white rounded-xl shadow p-12 text-center">
                    <FiMail className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No hay contactos</p>
                  </div>
                ) : (
                  contactSubmissions.map(contact => {
                    const isRead = (contact.readBy || []).includes(user.uid)
                    return (
                      <div
                        key={contact.id}
                        className={`bg-white rounded-xl shadow p-6 border-l-4 ${
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
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                                  Nuevo
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-gray-800 text-lg">{contact.name}</h3>
                            <p className="text-sm text-gray-600">
                              {contact.email} • {contact.phone}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {contact.createdAt?.toDate?.().toLocaleString('es-DO') || 'Fecha desconocida'}
                            </p>
                          </div>
                          {!isRead && (
                            <button
                              onClick={() => markSubmissionAsRead(contact.id, 'contact')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Marcar como leído"
                            >
                              <FiCheck />
                            </button>
                          )}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.message}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* Property Inquiries Tab */}
            {activeTab === 'inquiries' && (
              <div className="space-y-4">
                {propertyInquiries.length === 0 ? (
                  <div className="bg-white rounded-xl shadow p-12 text-center">
                    <FiHome className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No hay consultas de propiedades</p>
                  </div>
                ) : (
                  propertyInquiries.map(inquiry => {
                    const isRead = (inquiry.readBy || []).includes(user.uid)
                    return (
                      <div
                        key={inquiry.id}
                        className={`bg-white rounded-xl shadow p-6 border-l-4 ${
                          isRead ? 'border-gray-300' : 'border-green-500'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                Propiedad
                              </span>
                              {!isRead && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                                  Nuevo
                                </span>
                              )}
                              {inquiry.visitDate && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                  📅 Visita: {new Date(inquiry.visitDate).toLocaleDateString('es-DO')}
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-[#0B2545] text-lg mb-2">{inquiry.propertyTitle}</h3>
                            <p className="text-sm text-gray-600 font-semibold">{inquiry.name}</p>
                            <p className="text-sm text-gray-600">
                              {inquiry.email} • {inquiry.phone}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Contacto preferido: {inquiry.preferredContact === 'email' ? 'Email' : inquiry.preferredContact === 'phone' ? 'Teléfono' : 'WhatsApp'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {inquiry.createdAt?.toDate?.().toLocaleString('es-DO') || 'Fecha desconocida'}
                            </p>
                          </div>
                          {!isRead && (
                            <button
                              onClick={() => markSubmissionAsRead(inquiry.id, 'inquiry')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Marcar como leído"
                            >
                              <FiCheck />
                            </button>
                          )}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{inquiry.message}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
