import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/messages/mark-read
 * Mark all messages in a conversation as read for a specific user
 * Body: { conversationId: string, userId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { conversationId, userId } = await req.json()

    if (!conversationId || !userId) {
      return NextResponse.json(
        { ok: false, error: 'conversationId and userId are required' },
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

    // Update conversation: reset unreadCount for this user
    const conversationRef = adminDb.collection('conversations').doc(conversationId)
    await conversationRef.update({
      [`unreadCount.${userId}`]: 0,
      updatedAt: new Date()
    })

    // Mark all messages in this conversation as read for this user
    const messagesSnap = await adminDb
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .where('read', '==', false)
      .get()

    const batch = adminDb.batch()
    messagesSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true })
    })

    if (!messagesSnap.empty) {
      await batch.commit()
    }

    return NextResponse.json({
      ok: true,
      message: 'Marked as read',
      messagesUpdated: messagesSnap.size
    })
  } catch (error) {
    console.error('mark-read error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}
