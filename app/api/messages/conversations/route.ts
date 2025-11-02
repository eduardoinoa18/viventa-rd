import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getConversationsForUser } from '@/lib/firestoreService'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const cookieStore = cookies()
    const uid = cookieStore.get('viventa_uid')?.value
    if (!uid) {
      return NextResponse.json({ conversations: [] })
    }
    const convos = await getConversationsForUser(uid)
    const conversations = convos.map((m: any) => ({
      id: m.conversationId,
      title: deriveTitleFromConversationId(m.conversationId, uid, m),
      lastMessage: m.content,
      createdAt: m.createdAt,
    }))
    return NextResponse.json({ conversations })
  } catch (e) {
    console.error('conversations GET error', e)
    return NextResponse.json({ conversations: [] })
  }
}

function deriveTitleFromConversationId(convId: string, uid: string, m: any): string {
  if (!convId) return m?.receiverName || 'Conversación'
  if (convId.startsWith('support:')) return 'Soporte VIVENTA'
  if (convId.startsWith('user_agent:')) return 'Tu Agente'
  if (convId.startsWith('broker_team:')) return 'Equipo / Broker'
  // Fallback: other participant name
  if (m?.senderId === uid) return m?.receiverName || 'Chat'
  return m?.senderName || 'Chat'
}
