// app/api/user/export-data/route.ts
import { NextResponse } from 'next/server'
import { getAdminDb, getAdminAuth } from '../../../../lib/firebaseAdmin'

export async function POST(req: Request) {
  try {
    const { uid } = await req.json()
    
    if (!uid) {
      return NextResponse.json({ ok: false, error: 'Missing uid' }, { status: 400 })
    }

    const auth = getAdminAuth()
    const db = getAdminDb()
    
    if (!auth || !db) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    // Verify user exists
    const user = await auth.getUser(uid)
    
    // Collect all user data
    const userData: any = {
      profile: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        createdAt: user.metadata.creationTime,
        lastSignIn: user.metadata.lastSignInTime
      },
      favorites: [],
      inquiries: [],
      savedSearches: [],
      activityLog: [],
      notifications: []
    }

    // Fetch favorites
    const favSnap = await db.collection('favorites').where('userId', '==', uid).get()
    userData.favorites = favSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))

    // Fetch inquiries
    const inqSnap = await db.collection('inquiries').where('userId', '==', uid).get()
    userData.inquiries = inqSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))

    // Fetch saved searches
    const searchSnap = await db.collection('saved_searches').where('userId', '==', uid).get()
    userData.savedSearches = searchSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))

    // Fetch activity logs
    const activitySnap = await db.collection('analytics_events')
      .where('userId', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get()
    userData.activityLog = activitySnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))

    // Fetch notifications
    const notifSnap = await db.collection('notifications').where('userId', '==', uid).get()
    userData.notifications = notifSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))

    // Store export request
    await db.collection('data_export_requests').add({
      userId: uid,
      email: user.email,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      data: userData
    })

    // In production, send email with download link
    // For now, just mark as complete
    console.log(`Data export requested for user ${uid}`)

    return NextResponse.json({
      ok: true,
      message: 'Export initiated. You will receive an email with your data.'
    })
  } catch (error: any) {
    console.error('Error exporting data:', error)
    return NextResponse.json({
      ok: false,
      error: error.message || 'Failed to export data'
    }, { status: 500 })
  }
}
