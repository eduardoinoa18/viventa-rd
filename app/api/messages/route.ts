import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.uid) {
      return NextResponse.json({ messages: [] }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId') || ''
    if (!conversationId) return NextResponse.json({ messages: [] })

    const isAdminLike = ['admin', 'master_admin', 'broker', 'agent'].includes(session.role)
    if (!isAdminLike) {
      if (conversationId.startsWith('user_agent:')) {
        const parts = conversationId.split(':')
        const ownerUid = String(parts[1] || '').trim()
        if (ownerUid && ownerUid !== session.uid) {
          return NextResponse.json({ messages: [] }, { status: 403 })
        }
      }

      if (conversationId.startsWith('support:')) {
        const ticketId = conversationId.split(':')[1]
        if (!ticketId) {
          return NextResponse.json({ messages: [] }, { status: 400 })
        }

        const dbForTicket = getAdminDb()
        if (!dbForTicket) return NextResponse.json({ messages: [] })
        const ticket = await dbForTicket.collection('support_tickets').doc(ticketId).get()
        const ticketUserId = String(ticket.data()?.userId || '')
        if (!ticket.exists || ticketUserId !== session.uid) {
          return NextResponse.json({ messages: [] }, { status: 403 })
        }
      }
    }

    const db = getAdminDb()
    if (!db) return NextResponse.json({ messages: [] })

    const snap = await db
      .collection('messages')
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'asc')
      .limit(500)
      .get()

    const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ messages })
  } catch (e) {
    return NextResponse.json({ messages: [] })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'not-authenticated' }, { status: 401 })

    const uid = session.uid
    const name = session.email || 'Usuario'

    const body = await req.json().catch(() => ({})) as { conversationId?: string; text?: string }
    const conversationId = (body.conversationId || '').toString()
    const text = (body.text || '').toString().slice(0, 4000)
    if (!conversationId || !text.trim()) {
      return NextResponse.json({ ok: false, error: 'missing-fields' }, { status: 400 })
    }

    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'admin-not-configured' }, { status: 501 })

    // Heuristic receiver based on conversationId prefix
    let receiverId = 'support'
    let receiverName = 'Soporte'
    if (conversationId.startsWith('user_agent:')) {
      const parts = conversationId.split(':')
      const agentId = parts[2] && parts[2] !== 'unassigned' ? parts[2] : 'agent_pool'
      receiverId = agentId
      receiverName = agentId === 'agent_pool' ? 'Agentes' : 'Agente'
    }

    await db.collection('messages').add({
      conversationId,
      senderId: uid,
      senderName: name,
      receiverId,
      receiverName,
      content: text,
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'server-error' }, { status: 500 })
  }
}
 
