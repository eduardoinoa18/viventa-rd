import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  // Admin: list latest conversations by grouping messages by conversationId
  const db = getAdminDb()
  if (!db) return NextResponse.json({ conversations: [] })
  try {
    const url = new URL(request.url)
    const limitParam = parseInt(url.searchParams.get('limit') || '200', 10)
    const limit = Math.max(20, Math.min(500, limitParam))
    const messagesSnap = await db.collection('messages').orderBy('createdAt', 'desc').limit(limit * 5).get()
    const seen = new Set<string>()
    const conversations: any[] = []
    for (const doc of messagesSnap.docs) {
      const d = doc.data() as any
      const convId = d.conversationId
      if (!convId || seen.has(convId)) continue
      seen.add(convId)
      conversations.push({
        id: convId,
        title: inferAdminTitle(d),
        lastMessage: d.content,
        lastAt: d.createdAt,
      })
      if (conversations.length >= limit) break
    }
    return NextResponse.json({ conversations })
  } catch (e) {
    console.error('admin conversations error', e)
    return NextResponse.json({ conversations: [] })
  }
}

function inferAdminTitle(m: any): string {
  const id = m?.conversationId || ''
  if (id.startsWith('support:')) return `Soporte: ${id.split(':')[1] || ''}`
  if (id.startsWith('user_agent:')) return `Cliente-Agente: ${id.split(':').slice(1).join(':')}`
  if (id.startsWith('broker_team:')) return `Equipo Broker: ${id.split(':')[1] || ''}`
  return 'Conversación'
}
