import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminDb } from '@/lib/firebaseAdmin'

export async function GET() {
  try {
    const cookieStore = cookies()
    const uid = cookieStore.get('viventa_uid')?.value
    if (!uid) {
      return NextResponse.json({ conversations: [] })
    }
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ conversations: [] })
    }

    // Fetch messages where user is sender or receiver
    const [sentSnap, recvSnap] = await Promise.all([
      db.collection('messages').where('senderId', '==', uid).orderBy('createdAt', 'desc').limit(200).get(),
      db.collection('messages').where('receiverId', '==', uid).orderBy('createdAt', 'desc').limit(200).get(),
    ])

    const byConv = new Map<string, any>()
    for (const doc of [...sentSnap.docs, ...recvSnap.docs]) {
      const msg = doc.data()
      const convId: string = msg.conversationId
      const lastTime = (msg.createdAt?.toMillis?.() || msg.createdAt?.getTime?.() || 0)
      const item = byConv.get(convId)
      if (!item || (lastTime > item._last)) {
        byConv.set(convId, {
          id: convId,
          title: deriveTitle(convId),
          lastMessage: msg.content || msg.text || '',
          _last: lastTime,
        })
      }
    }

    const conversations = Array.from(byConv.values()).sort((a, b) => b._last - a._last)
    conversations.forEach((c: any) => delete c._last)
    return NextResponse.json({ conversations })
  } catch (e) {
    return NextResponse.json({ conversations: [] })
  }
}

function deriveTitle(convId: string) {
  if (convId.startsWith('support:')) return 'Soporte'
  if (convId.startsWith('user_agent:')) return 'Agente'
  return 'Conversación'
}
 
