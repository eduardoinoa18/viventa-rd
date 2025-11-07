import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

interface Params {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const role = request.cookies.get('viventa_role')?.value
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const conversationId = params.id

    // Fetch messages for this conversation
    const messagesSnap = await db
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .limit(200)
      .get()

    const messages = messagesSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }))

    // Mark conversation as read
    await db
      .collection('conversations')
      .doc(conversationId)
      .update({ unreadCount: 0 })

    return NextResponse.json({ messages })

  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: Params) {
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

    const conversationId = params.id
    const body = await request.json()
    const { content, senderName } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 })
    }

    const now = new Date()

    // Add message to subcollection
    await db
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .add({
        senderId: uid,
        senderName: senderName || 'Admin Support',
        content: content.trim(),
        createdAt: now
      })

    // Update conversation metadata
    await db
      .collection('conversations')
      .doc(conversationId)
      .update({
        lastMessage: content.trim(),
        lastMessageAt: now
      })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
