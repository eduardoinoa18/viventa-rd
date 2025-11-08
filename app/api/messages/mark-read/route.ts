// app/api/messages/mark-read/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { conversationId, userId } = await req.json()

    if (!conversationId || !userId) {
      return NextResponse.json({ ok: false, error: 'Missing conversationId or userId' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Firebase Admin not initialized' }, { status: 500 })
    }

    // Update conversation to mark as read for this user
    const conversationRef = adminDb.collection('conversations').doc(conversationId)
    
    await conversationRef.update({
      [`unreadCount.${userId}`]: 0,
      [`lastReadAt.${userId}`]: new Date()
    })

    // Update all messages in this conversation to mark as read
    const messagesSnapshot = await adminDb
      .collection('messages')
      .where('conversationId', '==', conversationId)
      .where('senderId', '!=', userId)
      .get()

    const batch = adminDb.batch()
    messagesSnapshot.docs.forEach((doc: any) => {
      batch.update(doc.ref, { 
        read: true,
        readAt: new Date()
      })
    })

    if (!messagesSnapshot.empty) {
      await batch.commit()
    }

    return NextResponse.json({ ok: true, message: 'Marked as read' })

  } catch (error: any) {
    console.error('Mark as read error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to mark as read' 
    }, { status: 500 })
  }
}
