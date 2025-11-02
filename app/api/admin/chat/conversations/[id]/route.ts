import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

// Update conversation meta, e.g., status open/closed
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const db = getAdminDb()
  if (!db) return NextResponse.json({ ok: false }, { status: 500 })
  try {
    const convId = decodeURIComponent(params.id)
    const { status } = await request.json()
    if (!['open', 'closed'].includes(status)) {
      return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
    }
    await db.collection('conversations_meta').doc(convId).set({ status, updatedAt: new Date() }, { merge: true })
    await db.collection('messages').add({
      conversationId: convId,
      senderId: 'system',
      senderName: 'Sistema',
      receiverId: 'conversation',
      receiverName: 'Conversation',
      content: status === 'closed' ? '[Conversación cerrada por soporte]' : '[Conversación reabierta por soporte]',
      read: false,
      createdAt: new Date(),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin conversations patch error', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
