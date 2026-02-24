import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { ActivityLogger } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

/**
 * Send push notification to a user via FCM
 * POST /api/notifications/send
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, notification } = await req.json()

    if (!userId || !notification) {
      return NextResponse.json(
        { ok: false, error: 'Missing userId or notification' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Firebase Admin not configured' },
        { status: 500 }
      )
    }

    // Get user's FCM token
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()

    if (!userData || !userData.fcmToken || !userData.notificationsEnabled) {
      return NextResponse.json(
        { ok: false, error: 'User does not have notifications enabled' },
        { status: 404 }
      )
    }

    // For now, store notification in Firestore (FCM integration requires separate setup)
    // In production, use admin.messaging().send()
    await adminDb.collection('notifications').add({
      userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.png',
      url: notification.url,
      data: notification.data || {},
      read: false,
      createdAt: new Date(),
      sentAt: null
    })

    // Log notification activity
    await ActivityLogger.log({
      type: 'system',
      action: 'Notification Sent',
      userId,
      userName: userData.name,
      userEmail: userData.email,
      metadata: {
        notificationType: notification.type,
        title: notification.title
      }
    })

    return NextResponse.json({
      ok: true,
      message: 'Notification queued successfully'
    })
  } catch (error: any) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to send notification' },
      { status: 500 }
    )
  }
}

/**
 * Get user's notifications
 * GET /api/notifications/send?userId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'Missing userId' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Firebase Admin not configured' },
        { status: 500 }
      )
    }

    // Fetch the user's role to include broadcast notifications
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data() || {}
    const role = userData.role || 'user'

    // Fetch personal notifications
    let personalQuery: any = adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)

    if (unreadOnly) {
      personalQuery = personalQuery.where('read', '==', false)
    }

    // Build broadcast audience filters
    const broadcastAudiences = new Set<string>(['all'])
    if (role) {
      broadcastAudiences.add(role)
      if (role === 'master_admin') {
        broadcastAudiences.add('admin')
        broadcastAudiences.add('master_admin')
      }
    }

    const [personalSnap, broadcastSnap] = await Promise.all([
      personalQuery.get(),
      adminDb
        .collection('notifications')
        .where('audience', 'array-contains-any', Array.from(broadcastAudiences))
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get()
    ])

    const personal = personalSnap.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        body: data.body || data.message || '',
        read: !!data.read,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null
      }
    })

    let broadcast = broadcastSnap.docs.map((doc: any) => {
      const data = doc.data()
      const readBy = Array.isArray(data.readBy) ? data.readBy : []
      const computedRead = readBy.includes(userId)
      return {
        id: doc.id,
        ...data,
        body: data.body || data.message || '',
        read: computedRead,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null
      }
    })

    if (unreadOnly) {
      broadcast = broadcast.filter((n: any) => !n.read)
    }

    // Default URL mapping by type
    const defaultUrlByType = (type: string, role: string) => {
      const isAdmin = role === 'master_admin'
      const base = isAdmin ? '/master' : ''
      switch (type) {
        case 'new_message': return isAdmin ? `${base}/leads` : '/contact'
        case 'lead_inquiry': return isAdmin ? `${base}/leads` : '/contact'
        case 'application_approved': return isAdmin ? `${base}/applications` : '/contact'
        case 'application_rejected': return isAdmin ? `${base}/applications` : '/contact'
        case 'new_property': return isAdmin ? `${base}/properties` : '/search'
        case 'price_alert': return '/search'
        case 'saved_search': return '/search'
        default: return isAdmin ? `${base}` : '/search'
      }
    }

    // Merge, add default url when missing, and sort by createdAt desc
    const merged = [...personal, ...broadcast]
      .map((n: any) => ({
        ...n,
        url: n.url || defaultUrlByType(n.type, role)
      }))
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 50)

    return NextResponse.json({
      ok: true,
      data: merged
    })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

/**
 * Mark notification as read
 * PATCH /api/notifications/send
 */
export async function PATCH(req: NextRequest) {
  try {
    const { notificationId, userId, markAllAsRead } = await req.json()

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Firebase Admin not configured' },
        { status: 500 }
      )
    }

    if (markAllAsRead && userId) {
      // Mark all notifications as read for user
      const userDoc = await adminDb.collection('users').doc(userId).get()
      const role = userDoc.data()?.role || 'user'

      const [personalSnap, broadcastSnap] = await Promise.all([
        adminDb
          .collection('notifications')
          .where('userId', '==', userId)
          .where('read', '==', false)
          .get(),
        adminDb
          .collection('notifications')
          .where('audience', 'array-contains-any', [role, 'all', role === 'master_admin' ? 'master_admin' : null].filter(Boolean))
          .get()
      ])

      const batch = adminDb.batch()
      personalSnap.docs.forEach((doc: any) => {
        batch.update(doc.ref, { read: true, readAt: new Date() })
      })
      // For broadcast, add to readBy if not present
      broadcastSnap.docs.forEach((doc: any) => {
        const data = doc.data()
        const readBy: string[] = Array.isArray(data.readBy) ? data.readBy : []
        if (!readBy.includes(userId)) {
          batch.update(doc.ref, { readBy: [...readBy, userId] })
        }
      })

      await batch.commit()

      return NextResponse.json({
        ok: true,
        message: 'Marked notifications as read'
      })
    }

    if (!notificationId) {
      return NextResponse.json(
        { ok: false, error: 'Missing notificationId' },
        { status: 400 }
      )
    }

    // Mark single notification as read
    const docRef = adminDb.collection('notifications').doc(notificationId)
    const snap = await docRef.get()
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: 'Notification not found' }, { status: 404 })
    }
    const data = snap.data() || {}
    if (Array.isArray(data.audience)) {
      // Broadcast notification: require userId to mark per-user read
      if (!userId) {
        return NextResponse.json({ ok: false, error: 'Missing userId for broadcast notification' }, { status: 400 })
      }
      const readBy: string[] = Array.isArray(data.readBy) ? data.readBy : []
      if (!readBy.includes(userId)) {
        await docRef.update({ readBy: [...readBy, userId] })
      }
    } else {
      await docRef.update({ read: true, readAt: new Date() })
    }

    return NextResponse.json({
      ok: true,
      message: 'Notification marked as read'
    })
  } catch (error: any) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to update notification' },
      { status: 500 }
    )
  }
}
