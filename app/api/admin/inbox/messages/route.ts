import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { withMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return withMasterAdmin(req, async () => {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')
    if (!conversationId) {
      return NextResponse.json({ ok: false, error: 'Missing conversationId' }, { status: 400 })
    }

    const limitParam = Number(searchParams.get('limit') || '200')
    const safeLimit = Math.min(Math.max(limitParam, 1), 500)

    const snap = await db
      .collection('messages')
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'asc')
      .limit(safeLimit)
      .get()

    const messages = snap.docs.map((doc: any) => {
      const data = doc.data() as any
      const createdAt = data.createdAt?.toDate?.() || null
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt ? createdAt.toISOString() : null,
      }
    })

    return NextResponse.json({ ok: true, messages })
  })
}

export async function POST(req: NextRequest) {
  return withMasterAdmin(req, async (admin) => {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({})) as {
      conversationId?: string
      content?: string
      receiverId?: string
      receiverName?: string
    }

    const conversationId = body.conversationId?.toString().trim()
    const content = body.content?.toString().trim()

    if (!conversationId) {
      return NextResponse.json({ ok: false, error: 'Missing conversationId' }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json({ ok: false, error: 'Missing content' }, { status: 400 })
    }

    const receiverId = body.receiverId?.toString().trim() || 'unknown'
    const receiverName = body.receiverName?.toString().trim() || 'Usuario'

    const messageRef = await db.collection('messages').add({
      conversationId,
      senderId: admin.uid,
      senderName: admin.email || 'Master Admin',
      receiverId,
      receiverName,
      content,
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json({ ok: true, id: messageRef.id })
  })
}
