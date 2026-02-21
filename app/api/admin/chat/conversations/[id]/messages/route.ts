import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { requireMasterSession } from '@/lib/auth/requireMasterSession'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN','ADMIN','SUPPORT'] })
  if (authResult instanceof Response) return authResult

  const db = getAdminDb()
  if (!db) return NextResponse.json({ messages: [] })
  try {
    const convId = decodeURIComponent(params.id)
    const snap = await db.collection('messages').where('conversationId', '==', convId).orderBy('createdAt', 'asc').get()
    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ messages })
  } catch (e) {
    console.error('admin messages get error', e)
    return NextResponse.json({ messages: [] })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN','ADMIN','SUPPORT'] })
  if (authResult instanceof Response) return authResult

  const db = getAdminDb()
  if (!db) return NextResponse.json({ ok: false }, { status: 500 })
  try {
    const convId = decodeURIComponent(params.id)
    const { text } = await request.json()
    if (!text?.trim()) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
    await db.collection('messages').add({
      conversationId: convId,
      senderId: 'admin_support',
      senderName: 'Soporte VIVENTA',
      receiverId: 'conversation',
      receiverName: 'Conversation',
      content: String(text).slice(0, 4000),
      read: false,
      createdAt: new Date(),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin messages post error', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
