import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function noStoreJson(body: any, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

function toIso(value: any): string | null {
  const date = value?.toDate?.() instanceof Date ? value.toDate() : value instanceof Date ? value : null
  return date ? date.toISOString() : null
}

function toMillis(value: any): number {
  const iso = toIso(value)
  if (!iso) return 0
  return new Date(iso).getTime()
}

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.uid) {
      return noStoreJson({ ok: false, error: 'Authentication required' }, { status: 401 })
    }

    const db = getAdminDb()
    if (!db) {
      return noStoreJson({ ok: false, error: 'Firebase Admin not configured' }, { status: 500 })
    }

    const [supportTicketsSnap, messagesSnap] = await Promise.all([
      db.collection('support_tickets').where('userId', '==', session.uid).limit(100).get(),
      db.collection('messages').orderBy('createdAt', 'desc').limit(1000).get(),
    ])

    const supportConversationIds = new Set<string>([
      `support:${session.uid}`,
      ...supportTicketsSnap.docs.map((doc) => `support:${doc.id}`),
    ])

    const conversations = new Map<string, {
      conversationId: string
      lastMessage: string
      lastAt: string | null
      unreadCount: number
    }>()

    for (const doc of messagesSnap.docs) {
      const data = doc.data() as Record<string, any>
      const conversationId = String(data.conversationId || '').trim()
      if (!conversationId) continue

      const isLeadConversation = conversationId.startsWith(`user_agent:${session.uid}:`)
      const isSupportConversation = supportConversationIds.has(conversationId)
      if (!isLeadConversation && !isSupportConversation) continue

      if (!conversations.has(conversationId)) {
        conversations.set(conversationId, {
          conversationId,
          lastMessage: String(data.content || ''),
          lastAt: toIso(data.createdAt),
          unreadCount: 0,
        })
      }

      if (!data.read && String(data.senderId || '') !== session.uid) {
        conversations.get(conversationId)!.unreadCount += 1
      }
    }

    const items = Array.from(conversations.values()).sort((a, b) => {
      return (new Date(b.lastAt || 0).getTime() || 0) - (new Date(a.lastAt || 0).getTime() || 0)
    })

    const unreadMessages = items.reduce((sum, item) => sum + Number(item.unreadCount || 0), 0)
    const latestConversationAt = items[0]?.lastAt || null

    return noStoreJson({
      ok: true,
      conversations: items,
      summary: {
        totalConversations: items.length,
        unreadMessages,
        latestConversationAt,
        scannedMessages: messagesSnap.size,
        scannedAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('[api/messages/conversations] GET error:', error)
    return noStoreJson({ ok: false, error: error?.message || 'Failed to load conversations' }, { status: 500 })
  }
}