import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminDb } from '@/lib/firebaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { subject?: string; message?: string; priority?: 'low' | 'normal' | 'high' }
    const subject = (body.subject || 'Ticket de soporte').toString().slice(0, 140)
    const message = (body.message || '').toString().slice(0, 4000)
    const priority = body.priority || 'normal'

    const cookieStore = cookies()
    const uid = cookieStore.get('viventa_uid')?.value
    const name = cookieStore.get('viventa_name')?.value

    if (!uid) {
      return NextResponse.json({ ok: false, error: 'not-authenticated' }, { status: 401 })
    }
    if (!message.trim()) {
      return NextResponse.json({ ok: false, error: 'missing-message' }, { status: 400 })
    }

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'admin-not-configured' }, { status: 501 })
    }

    const ticketRef = await db.collection('support_tickets').add({
      userId: uid,
      userName: name || 'Usuario',
      subject,
      message,
      priority,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const conversationId = `support:${ticketRef.id}`

    await db.collection('messages').add({
      conversationId,
      senderId: uid,
      senderName: name || 'Usuario',
      receiverId: 'support',
      receiverName: 'Soporte',
      content: message,
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json({ ok: true, conversationId })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'server-error' }, { status: 500 })
  }
}
