// app/api/messages/typing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

/**
 * Update typing indicator for a conversation
 * Stores who is typing with timestamp (expires after 3 seconds)
 */
export async function POST(req: NextRequest) {
  try {
    const { conversationId, userId, userName, isTyping = true } = await req.json()

    if (!conversationId || !userId) {
      return NextResponse.json({ ok: false, error: 'Missing conversationId or userId' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Firebase Admin not initialized' }, { status: 500 })
    }

    const conversationRef = adminDb.collection('conversations').doc(conversationId)
    
    if (isTyping) {
      // Set typing indicator
      await conversationRef.update({
        [`typing.${userId}`]: {
          name: userName || 'Usuario',
          timestamp: new Date()
        }
      })
    } else {
      // Remove typing indicator
      const { FieldValue } = await import('firebase-admin/firestore')
      await conversationRef.update({
        [`typing.${userId}`]: FieldValue.delete()
      })
    }

    return NextResponse.json({ ok: true })

  } catch (error: any) {
    console.error('Typing indicator error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to update typing indicator' 
    }, { status: 500 })
  }
}
