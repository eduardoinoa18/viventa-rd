import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'
import { requireMasterSession } from '@/lib/auth/requireMasterSession'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN','ADMIN','SUPPORT'] })
  if (authResult instanceof Response) return authResult

  try {
    const uid = authResult.uid

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const body = await request.json()
    const { collection, documentId } = body

    if (!collection || !documentId) {
      return NextResponse.json({ error: 'Collection and documentId required' }, { status: 400 })
    }

    // Validate collection name
    const allowedCollections = [
      'notifications',
      'contact_submissions',
      'property_inquiries',
      'waitlist_social',
      'waitlist_platform'
    ]

    if (!allowedCollections.includes(collection)) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 })
    }

    await db.collection(collection).doc(documentId).update({
      readBy: FieldValue.arrayUnion(uid),
      status: 'read'
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Failed to mark as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark as read' },
      { status: 500 }
    )
  }
}
