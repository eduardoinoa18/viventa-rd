// app/api/notifications/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { ActivityLogger } from '@/lib/activityLogger'

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

    let query: any = adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)

    if (unreadOnly) {
      query = query.where('read', '==', false)
    }

    const snapshot = await query.get()
    const notifications = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }))

    return NextResponse.json({
      ok: true,
      data: notifications
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
      const snapshot = await adminDb
        .collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get()

      const batch = adminDb.batch()
      snapshot.docs.forEach((doc: any) => {
        batch.update(doc.ref, { read: true, readAt: new Date() })
      })

      await batch.commit()

      return NextResponse.json({
        ok: true,
        message: `Marked ${snapshot.docs.length} notifications as read`
      })
    }

    if (!notificationId) {
      return NextResponse.json(
        { ok: false, error: 'Missing notificationId' },
        { status: 400 }
      )
    }

    // Mark single notification as read
    await adminDb.collection('notifications').doc(notificationId).update({
      read: true,
      readAt: new Date()
    })

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
