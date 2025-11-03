import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminDb } from '@/lib/firebaseAdmin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId') || ''
    if (!conversationId) return NextResponse.json({ messages: [] })

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
    const cookieStore = cookies()
    const uid = cookieStore.get('viventa_uid')?.value
    const name = cookieStore.get('viventa_name')?.value || 'Usuario'
    if (!uid) return NextResponse.json({ ok: false, error: 'not-authenticated' }, { status: 401 })

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
 
