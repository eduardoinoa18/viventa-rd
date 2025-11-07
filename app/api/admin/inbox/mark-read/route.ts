import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    const role = request.cookies.get('viventa_role')?.value
    const uid = request.cookies.get('viventa_uid')?.value

    if (role !== 'admin' || !uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
