import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, message: 'Firebase admin not configured' }, { status: 500 })
    }

    const cookieStore = await cookies()
    const uid = cookieStore.get('viventa_uid')?.value
    const role = cookieStore.get('viventa_role')?.value

    if (!uid || role !== 'agent') {
      return NextResponse.json({ ok: false, message: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { listingId, listingTitle, listingAgentId, listingAgentName } = body

    if (!listingAgentId || !listingId) {
      return NextResponse.json({ ok: false, message: 'Faltan datos requeridos' }, { status: 400 })
    }

    if (listingAgentId === uid) {
      return NextResponse.json({ ok: false, message: 'No puedes contactarte a ti mismo' }, { status: 400 })
    }

    // Check if conversation already exists between these two agents for this listing
    const existingQuery = await db.collection('conversations')
      .where('participants', 'array-contains', uid)
      .where('type', '==', 'agent-to-agent')
      .where('listingId', '==', listingId)
      .limit(1)
      .get()

    let conversationId: string

    if (!existingQuery.empty) {
      // Found existing conversation
      const existing = existingQuery.docs[0]
      const data = existing.data()
      // Verify the other participant is the listing agent
      if (data.participants.includes(listingAgentId)) {
        conversationId = existing.id
      } else {
        // Create new conversation if participants don't match
        const newConv = await db.collection('conversations').add({
          type: 'agent-to-agent',
          participants: [uid, listingAgentId],
          listingId,
          listingTitle: listingTitle || 'Listado',
          listingAgentId,
          listingAgentName: listingAgentName || 'Agente',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessage: null,
          unreadCount: { [uid]: 0, [listingAgentId]: 0 }
        })
        conversationId = newConv.id
      }
    } else {
      // Create new conversation
      const newConv = await db.collection('conversations').add({
        type: 'agent-to-agent',
        participants: [uid, listingAgentId],
        listingId,
        listingTitle: listingTitle || 'Listado',
        listingAgentId,
        listingAgentName: listingAgentName || 'Agente',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: null,
        unreadCount: { [uid]: 0, [listingAgentId]: 0 }
      })
      conversationId = newConv.id

      // Create welcome message
      await db.collection('conversations').doc(conversationId).collection('messages').add({
        text: `Iniciaste una consulta sobre el listado: ${listingTitle || 'Listado'} (ID: ${listingId})`,
        senderId: 'system',
        createdAt: new Date(),
        type: 'system'
      })

      // Update conversation with last message
      await db.collection('conversations').doc(conversationId).update({
        lastMessage: `Consulta sobre listado iniciada`,
        updatedAt: new Date()
      })
    }

    return NextResponse.json({ ok: true, conversationId })
  } catch (error: any) {
    console.error('agent-chat POST error:', error)
    return NextResponse.json({ ok: false, message: error.message || 'Error interno' }, { status: 500 })
  }
}
