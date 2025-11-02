import { NextResponse } from 'next/server'
import { getMessagesByConversation, sendMessage } from '@/lib/firestoreService'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId') || ''
    if (!conversationId) return NextResponse.json({ messages: [] })
    const list = await getMessagesByConversation(conversationId)
    const messages = list.map((m: any) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName,
      text: m.content,
      createdAt: m.createdAt,
    }))
    return NextResponse.json({ messages })
  } catch (e) {
    console.error('messages GET error', e)
    return NextResponse.json({ messages: [] })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const uid = cookieStore.get('viventa_uid')?.value
    const name = decodeURIComponent(cookieStore.get('viventa_name')?.value || '')
    if (!uid) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const { conversationId, text, receiverId, receiverName } = await request.json()
    if (!conversationId || !text?.trim()) {
      return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
    }

    // For this MVP, messages are stored in top-level 'messages' collection
    await sendMessage({
      conversationId,
      senderId: uid,
      senderName: name || 'Usuario',
      receiverId: receiverId || 'unknown',
      receiverName: receiverName || 'Chat',
      content: String(text).slice(0, 4000),
      read: false,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('messages POST error', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
