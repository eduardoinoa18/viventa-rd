import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const role = request.cookies.get('viventa_role')?.value
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const tab = searchParams.get('tab') || 'chat'

    if (tab === 'chat') {
      // Fetch conversations
      const conversationsSnap = await db
        .collection('conversations')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get()

      const conversations = conversationsSnap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        lastMessageAt: doc.data().lastMessageAt?.toDate?.()?.toISOString() || null
      }))

      return NextResponse.json({ conversations })
    }

    if (tab === 'notifications') {
      // Fetch all admin-relevant notifications
      const notificationsSnap = await db
        .collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get()

      const notifications = notificationsSnap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
      }))

      return NextResponse.json({ notifications })
    }

    if (tab === 'contacts') {
      // Fetch contact submissions
      const contactsSnap = await db
        .collection('contact_submissions')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get()

      const contacts = contactsSnap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
      }))

      return NextResponse.json({ contacts })
    }

    if (tab === 'inquiries') {
      // Fetch property inquiries
      const inquiriesSnap = await db
        .collection('property_inquiries')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get()

      const inquiries = inquiriesSnap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
      }))

      return NextResponse.json({ inquiries })
    }

    if (tab === 'waitlist') {
      // Fetch both waitlist collections
      const [socialSnap, platformSnap] = await Promise.all([
        db
          .collection('waitlist_social')
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get(),
        db
          .collection('waitlist_platform')
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get()
      ])

      const socialWaitlist = socialSnap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        source: 'social',
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
      }))

      const platformWaitlist = platformSnap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        source: 'platform',
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
      }))

      const waitlist = [...socialWaitlist, ...platformWaitlist].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })

      return NextResponse.json({ waitlist })
    }

    // Default: return all data
    const [conversationsSnap, notificationsSnap, contactsSnap, inquiriesSnap, socialSnap, platformSnap] = await Promise.all([
      db.collection('conversations').orderBy('createdAt', 'desc').limit(100).get(),
      db.collection('notifications').orderBy('createdAt', 'desc').limit(50).get(),
      db.collection('contact_submissions').orderBy('createdAt', 'desc').limit(50).get(),
      db.collection('property_inquiries').orderBy('createdAt', 'desc').limit(50).get(),
      db.collection('waitlist_social').orderBy('createdAt', 'desc').limit(50).get(),
      db.collection('waitlist_platform').orderBy('createdAt', 'desc').limit(50).get()
    ])

    const conversations = conversationsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      lastMessageAt: doc.data().lastMessageAt?.toDate?.()?.toISOString() || null
    }))

    const notifications = notificationsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }))

    const contacts = contactsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }))

    const inquiries = inquiriesSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }))

    const socialWaitlist = socialSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      source: 'social',
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }))

    const platformWaitlist = platformSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      source: 'platform',
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }))

    const waitlist = [...socialWaitlist, ...platformWaitlist].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })

    return NextResponse.json({
      conversations,
      notifications,
      contacts,
      inquiries,
      waitlist
    })

  } catch (error) {
    console.error('Admin inbox error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inbox data' },
      { status: 500 }
    )
  }
}
