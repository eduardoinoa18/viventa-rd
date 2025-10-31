import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const db = getAdminDb()
  if (!db) return NextResponse.json({ ok: false }, { status: 500 })
  try {
    const cookieStore = cookies()
    const uid = cookieStore.get('viventa_uid')?.value
    const name = decodeURIComponent(cookieStore.get('viventa_name')?.value || '')
    if (!uid) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const { reason, details, agentId } = await request.json()
    const payload = {
      userId: uid,
      userName: name || 'Usuario',
      agentId: agentId || null,
      reason: String(reason || '').slice(0, 200),
      details: String(details || '').slice(0, 2000),
      status: 'new',
      createdAt: new Date(),
    }
    await db.collection('reassignment_requests').add(payload)

    // Mark existing user-agent conversation as closed if present
    const convId = `user_agent:${uid}:${agentId || 'unknown'}`
    await db.collection('conversations_meta').doc(convId).set({ status: 'closed', updatedAt: new Date() }, { merge: true })
    await db.collection('messages').add({
      conversationId: convId,
      senderId: 'system',
      senderName: 'Sistema',
      receiverId: 'conversation',
      receiverName: 'Conversation',
      content: '[Usuario solicitó reasignación de agente]'
        + (payload.reason ? ` Motivo: ${payload.reason}` : ''),
      read: false,
      createdAt: new Date(),
    })

    // Notify support via support conversation
    const supportConv = `support:${uid}`
    await db.collection('messages').add({
      conversationId: supportConv,
      senderId: uid,
      senderName: name || 'Usuario',
      receiverId: 'admin_support',
      receiverName: 'Soporte VIVENTA',
      content: 'He solicitado cambiar de agente. Por favor, ayúdenme a reasignar.'
        + (payload.reason ? ` Motivo: ${payload.reason}` : ''),
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('quit POST error', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
