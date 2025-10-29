export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import {
  getConversationsForUser,
  getMessagesByConversation,
  sendMessage,
  markMessageAsRead,
} from '@/lib/firestoreService'
import { db } from '@/lib/firebaseClient'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

function getCookie(req: NextRequest, name: string): string | null {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')
    const userId = searchParams.get('userId') || getCookie(req, 'viventa_uid')

    if (conversationId) {
      const messages = await getMessagesByConversation(conversationId)
      return NextResponse.json({ messages })
    }

    if (!userId) {
      return NextResponse.json({ conversations: [] })
    }

    // Fallback: return conversations derived from messages if called without /conversations path
    const conversations = await getConversationsForUser(userId)
    return NextResponse.json({ conversations })
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body || {}

    // Backward-compatible actions API
    if (action === 'send') {
      const id = await sendMessage(body)
      return NextResponse.json({ success: true, message: 'Message sent', id })
    } else if (action === 'markRead') {
      await markMessageAsRead(body.id)
      return NextResponse.json({ success: true, message: 'Message marked as read' })
    }

    // New simple API used by UI: { conversationId, text }
    const uid = getCookie(req, 'viventa_uid')
    const name = getCookie(req, 'viventa_name') || 'Usuario'
    const { conversationId, text } = body
    if (!uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    if (!conversationId || !text) return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })

    // Find conversation participants to determine receiver
    const convSnap = await getDoc(doc(db, 'conversations', conversationId))
    if (!convSnap.exists()) return NextResponse.json({ ok: false, error: 'Conversation not found' }, { status: 404 })
    const conv = convSnap.data() as any
    const participants: string[] = conv.participants || []
    const receiverId = participants.find((p) => p !== uid) || ''

    await sendMessage({
      conversationId,
      senderId: uid,
      senderName: name,
      receiverId,
      receiverName: '',
      content: text,
      read: false,
    })

    // Update conversation metadata
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: text,
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error managing message:', error)
    return NextResponse.json({ error: error.message || 'Failed to manage message' }, { status: 500 })
  }
}
