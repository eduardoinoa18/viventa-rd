import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { requireMasterSession } from '@/lib/auth/requireMasterSession'

export const dynamic = 'force-dynamic'

/**
 * DANGER: This endpoint deletes ALL test data from Firebase
 * Preserves master admin credentials only
 * Use with extreme caution!
 */
export async function POST(req: NextRequest) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  if (authResult instanceof Response) return authResult

  try {
    const uid = authResult.uid

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const body = await req.json()
    const { confirmEmail } = body

    if (!confirmEmail) {
      return NextResponse.json({ error: 'Email confirmation required' }, { status: 400 })
    }

    // Verify master admin email
    const masterAdminDoc = await db.collection('users').doc(uid).get()
    if (!masterAdminDoc.exists || masterAdminDoc.data()?.email !== confirmEmail) {
      return NextResponse.json({ error: 'Email verification failed' }, { status: 403 })
    }

    const results = {
      users: 0,
      properties: 0,
      conversations: 0,
      applications: 0,
      contacts: 0,
      inquiries: 0,
      waitlist: 0,
      notifications: 0
    }

    // Delete all users EXCEPT master admin
    const usersSnap = await db.collection('users').get()
    const deleteUsersBatch = db.batch()
    let userBatchCount = 0
    
    for (const doc of usersSnap.docs) {
      if (doc.id !== uid) { // Preserve master admin
        deleteUsersBatch.delete(doc.ref)
        userBatchCount++
        results.users++

        if (userBatchCount >= 500) {
          await deleteUsersBatch.commit()
          userBatchCount = 0
        }
      }
    }
    if (userBatchCount > 0) await deleteUsersBatch.commit()

    // Delete all properties
    const propertiesSnap = await db.collection('properties').get()
    const deletePropsBatch = db.batch()
    let propBatchCount = 0
    
    for (const doc of propertiesSnap.docs) {
      deletePropsBatch.delete(doc.ref)
      propBatchCount++
      results.properties++

      if (propBatchCount >= 500) {
        await deletePropsBatch.commit()
        propBatchCount = 0
      }
    }
    if (propBatchCount > 0) await deletePropsBatch.commit()

    // Delete conversations
    const conversationsSnap = await db.collection('conversations').get()
    for (const doc of conversationsSnap.docs) {
      // Delete messages subcollection first
      const messagesSnap = await doc.ref.collection('messages').get()
      const messagesBatch = db.batch()
      messagesSnap.docs.forEach(msgDoc => messagesBatch.delete(msgDoc.ref))
      if (messagesSnap.size > 0) await messagesBatch.commit()
      
      await doc.ref.delete()
      results.conversations++
    }

    // Delete applications
    const applicationsSnap = await db.collection('applications').get()
    const deleteAppsBatch = db.batch()
    applicationsSnap.docs.forEach(doc => {
      deleteAppsBatch.delete(doc.ref)
      results.applications++
    })
    if (applicationsSnap.size > 0) await deleteAppsBatch.commit()

    // Delete contact submissions
    const contactsSnap = await db.collection('contact_submissions').get()
    const deleteContactsBatch = db.batch()
    contactsSnap.docs.forEach(doc => {
      deleteContactsBatch.delete(doc.ref)
      results.contacts++
    })
    if (contactsSnap.size > 0) await deleteContactsBatch.commit()

    // Delete property inquiries
    const inquiriesSnap = await db.collection('property_inquiries').get()
    const deleteInquiriesBatch = db.batch()
    inquiriesSnap.docs.forEach(doc => {
      deleteInquiriesBatch.delete(doc.ref)
      results.inquiries++
    })
    if (inquiriesSnap.size > 0) await deleteInquiriesBatch.commit()

    // Delete waitlist
    const waitlistSocialSnap = await db.collection('waitlist_social').get()
    const waitlistPlatformSnap = await db.collection('waitlist_platform').get()
    const deleteWaitlistBatch = db.batch()
    
    waitlistSocialSnap.docs.forEach(doc => {
      deleteWaitlistBatch.delete(doc.ref)
      results.waitlist++
    })
    waitlistPlatformSnap.docs.forEach(doc => {
      deleteWaitlistBatch.delete(doc.ref)
      results.waitlist++
    })
    if (results.waitlist > 0) await deleteWaitlistBatch.commit()

    // Delete notifications (except master admin's)
    const notificationsSnap = await db.collection('notifications').get()
    const deleteNotificationsBatch = db.batch()
    notificationsSnap.docs.forEach(doc => {
      const data = doc.data()
      if (data.userId !== uid && !data.audience?.includes('master_admin')) {
        deleteNotificationsBatch.delete(doc.ref)
        results.notifications++
      }
    })
    if (results.notifications > 0) await deleteNotificationsBatch.commit()

    return NextResponse.json({ 
      success: true, 
      message: 'Test data cleaned successfully',
      results 
    })

  } catch (error: any) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to clean test data' },
      { status: 500 }
    )
  }
}
