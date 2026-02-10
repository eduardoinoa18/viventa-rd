import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { requireMasterAdmin } from '@/lib/adminApiAuth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const guard = requireMasterAdmin(req)
    if (guard) return guard

    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DB_CLEANUP !== 'true') {
      return NextResponse.json({ ok: false, error: 'Database cleanup disabled in production' }, { status: 403 })
    }

    const body = await req.json()
    const confirmEmail = (body?.confirmEmail || '').toString().trim().toLowerCase()
    if (!confirmEmail) {
      return NextResponse.json({ ok: false, error: 'Email confirmation required' }, { status: 400 })
    }

    const adminEmail = req.cookies.get('viventa_admin_email')?.value?.toLowerCase() || ''
    if (!adminEmail || adminEmail !== confirmEmail) {
      return NextResponse.json({ ok: false, error: 'Email verification failed' }, { status: 403 })
    }

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 500 })
    }

    const results: Record<string, number> = {
      users: 0,
      properties: 0,
      conversations: 0,
      applications: 0,
      contacts: 0,
      inquiries: 0,
      waitlist: 0,
      notifications: 0
    }

    // Delete all users EXCEPT master admin email
    const usersSnap = await db.collection('users').get()
    let userBatch = db.batch()
    let userBatchCount = 0
    for (const doc of usersSnap.docs) {
      const data = doc.data() as any
      if (data?.email?.toLowerCase() === adminEmail) continue
      userBatch.delete(doc.ref)
      userBatchCount++
      results.users++
      if (userBatchCount >= 500) {
        await userBatch.commit()
        userBatch = db.batch()
        userBatchCount = 0
      }
    }
    if (userBatchCount > 0) await userBatch.commit()

    // Delete all properties
    const propertiesSnap = await db.collection('properties').get()
    let propsBatch = db.batch()
    let propsBatchCount = 0
    for (const doc of propertiesSnap.docs) {
      propsBatch.delete(doc.ref)
      propsBatchCount++
      results.properties++
      if (propsBatchCount >= 500) {
        await propsBatch.commit()
        propsBatch = db.batch()
        propsBatchCount = 0
      }
    }
    if (propsBatchCount > 0) await propsBatch.commit()

    // Delete conversations + messages subcollection
    const conversationsSnap = await db.collection('conversations').get()
    for (const doc of conversationsSnap.docs) {
      const messagesSnap = await doc.ref.collection('messages').get()
      if (messagesSnap.size > 0) {
        const messagesBatch = db.batch()
        messagesSnap.docs.forEach((msgDoc) => messagesBatch.delete(msgDoc.ref))
        await messagesBatch.commit()
      }
      await doc.ref.delete()
      results.conversations++
    }

    // Delete applications
    const applicationsSnap = await db.collection('applications').get()
    if (applicationsSnap.size > 0) {
      const appsBatch = db.batch()
      applicationsSnap.docs.forEach((doc) => {
        appsBatch.delete(doc.ref)
        results.applications++
      })
      await appsBatch.commit()
    }

    // Delete contact submissions
    const contactsSnap = await db.collection('contact_submissions').get()
    if (contactsSnap.size > 0) {
      const contactsBatch = db.batch()
      contactsSnap.docs.forEach((doc) => {
        contactsBatch.delete(doc.ref)
        results.contacts++
      })
      await contactsBatch.commit()
    }

    // Delete property inquiries
    const inquiriesSnap = await db.collection('property_inquiries').get()
    if (inquiriesSnap.size > 0) {
      const inquiriesBatch = db.batch()
      inquiriesSnap.docs.forEach((doc) => {
        inquiriesBatch.delete(doc.ref)
        results.inquiries++
      })
      await inquiriesBatch.commit()
    }

    // Delete waitlist
    const waitlistSocialSnap = await db.collection('waitlist_social').get()
    const waitlistPlatformSnap = await db.collection('waitlist_platform').get()
    if (waitlistSocialSnap.size + waitlistPlatformSnap.size > 0) {
      const waitlistBatch = db.batch()
      waitlistSocialSnap.docs.forEach((doc) => {
        waitlistBatch.delete(doc.ref)
        results.waitlist++
      })
      waitlistPlatformSnap.docs.forEach((doc) => {
        waitlistBatch.delete(doc.ref)
        results.waitlist++
      })
      await waitlistBatch.commit()
    }

    // Delete notifications (except master admin)
    const notificationsSnap = await db.collection('notifications').get()
    if (notificationsSnap.size > 0) {
      const notificationsBatch = db.batch()
      notificationsSnap.docs.forEach((doc) => {
        const data = doc.data() as any
        if (data?.userId === 'master_admin' || data?.email === adminEmail) return
        notificationsBatch.delete(doc.ref)
        results.notifications++
      })
      await notificationsBatch.commit()
    }

    await db.collection('audit_logs').add({
      actorId: adminEmail,
      actorRole: 'master_admin',
      action: 'cleanup_test_data',
      target: 'database',
      metadata: {
        results,
        confirmEmail,
        userAgent: req.headers.get('user-agent') || null
      },
      createdAt: new Date()
    })

    return NextResponse.json({
      ok: true,
      message: 'Test data cleaned successfully',
      results
    })
  } catch (error: any) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ ok: false, error: error.message || 'Failed to clean test data' }, { status: 500 })
  }
}
