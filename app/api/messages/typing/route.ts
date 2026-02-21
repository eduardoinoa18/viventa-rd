import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'

/**
 * POST /api/messages/typing
 * Update typing indicator for a user in a conversation
 * Body: { conversationId: string, userId: string, userName: string, isTyping: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const { conversationId, userId, userName, isTyping } = await req.json()

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

    const conversationRef = adminDb.collection('conversations').doc(conversationId)

    if (isTyping) {
      // Set typing indicator with timestamp
      await conversationRef.update({
        [`typing.${userId}`]: {
          name: userName || 'Usuario',
          timestamp: new Date()
        },
        updatedAt: new Date()
      })
    } else {
      // Remove typing indicator
      await conversationRef.update({
        [`typing.${userId}`]: FieldValue.delete(),
        updatedAt: new Date()
      })
    }

    return NextResponse.json({
      ok: true,
      isTyping,
      userId
    })
  } catch (error) {
    console.error('typing indicator error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to update typing indicator' },
      { status: 500 }
    )
  }
}
