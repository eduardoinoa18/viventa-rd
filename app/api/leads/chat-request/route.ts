import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { ingestLead } from '@/lib/leadIngestion'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { subject?: string; message?: string }
    const subject = (body.subject || 'Consulta con agente').toString().slice(0, 140)
    const message = (body.message || '').toString().slice(0, 4000)

    const cookieStore = cookies()
    const uid = cookieStore.get('viventa_uid')?.value
    const name = cookieStore.get('viventa_name')?.value
    const phone = cookieStore.get('viventa_phone')?.value

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

    // Create lead via centralized ingestion
    const lead = await ingestLead({
      type: 'request-info',
      source: 'agent',
      sourceId: 'chat-request',
      buyerName: name || 'Usuario',
      buyerEmail: `${uid}@viventa.local`,
      buyerPhone: phone || '',
      message,
      payload: {
        userId: uid,
        subject,
        channel: 'chat',
      },
    })

    // Create a new conversation id for user-agent assignment (unassigned agent initially)
    const conversationId = `user_agent:${uid}:unassigned:${lead.id}`

    // Seed first message in conversation
    await db.collection('messages').add({
      conversationId,
      senderId: uid,
      senderName: name || 'Usuario',
      receiverId: 'agent_pool',
      receiverName: 'Agentes',
      content: message,
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json({ ok: true, conversationId })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'server-error' }, { status: 500 })
  }
}
