import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { withMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type ConversationMeta = {
  type: 'lead_chat' | 'support' | 'message'
  refId?: string | null
  userId?: string | null
  agentId?: string | null
}

function parseConversationMeta(conversationId: string): ConversationMeta {
  if (conversationId.startsWith('support:')) {
    const [, ticketId] = conversationId.split(':')
    return { type: 'support', refId: ticketId || null }
  }

  if (conversationId.startsWith('user_agent:')) {
    const parts = conversationId.split(':')
    const userId = parts[1] || null
    const agentId = parts[2] || null
    const refId = parts[3] || null
    return { type: 'lead_chat', userId, agentId, refId }
  }

  return { type: 'message' }
}

export async function GET(req: NextRequest) {
  return withMasterAdmin(req, async () => {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const limitParam = Number(searchParams.get('limit') || '200')
    const safeLimit = Math.min(Math.max(limitParam, 1), 500)

    const snap = await db.collection('messages').orderBy('createdAt', 'desc').limit(safeLimit).get()
    const conversations = new Map<string, any>()

    for (const doc of snap.docs) {
      const data = doc.data() as any
      const conversationId = (data.conversationId || 'unknown') as string
      const createdAt = data.createdAt?.toDate?.() || null
      const createdAtMs = createdAt ? createdAt.getTime() : 0
      const createdAtIso = createdAt ? createdAt.toISOString() : null

      if (!conversations.has(conversationId)) {
        const meta = parseConversationMeta(conversationId)
        conversations.set(conversationId, {
          conversationId,
          type: meta.type,
          refId: meta.refId || null,
          userId: meta.userId || null,
          agentId: meta.agentId || null,
          lastMessage: data.content || '',
          lastAt: createdAtIso,
          lastAtMs: createdAtMs,
          senderName: data.senderName || '',
          receiverName: data.receiverName || '',
          unreadCount: data.read ? 0 : 1,
        })
      } else if (!data.read) {
        conversations.get(conversationId).unreadCount += 1
      }
    }

    const items = Array.from(conversations.values()).sort((a, b) => (b.lastAtMs || 0) - (a.lastAtMs || 0))

    return NextResponse.json({ ok: true, conversations: items })
  })
}
