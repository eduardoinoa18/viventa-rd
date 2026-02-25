import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { Timestamp } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { leadId, agentId, note } = await req.json()
    if (!leadId || !agentId) {
      return NextResponse.json(
        { ok: false, error: 'leadId and agentId are required' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
    }

    // 1. Get lead from centralized leads collection
    const leadRef = adminDb.collection('leads').doc(leadId)
    const leadSnap = await leadRef.get()
    if (!leadSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 })
    }
    const lead = leadSnap.data() as any

    // 2. Get agent profile
    const agentSnap = await adminDb.collection('users').doc(agentId).get()
    if (!agentSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Agent not found' }, { status: 404 })
    }
    const agent = agentSnap.data() as any

    // 3. Create conversation document with both participants
    const conversationRef = adminDb.collection('conversations').doc()
    const conversationId = conversationRef.id

    const now = Timestamp.now()
    const systemMessage = `Lead "${lead.buyerName}" assigned to ${agent.name || agent.company || 'Agent'}${note ? `. Note: ${note}` : ''}`

    await conversationRef.set({
      participantIds: [agentId],
      messages: [
        {
          id: crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
          senderType: 'system',
          senderName: 'System',
          text: systemMessage,
          sentAt: now,
          readBy: [],
        },
      ],
      leadId: leadId,
      leadSource: 'crm',
      createdAt: now,
      updatedAt: now,
      lastMessage: systemMessage,
      lastMessageAt: now,
    })

    // 4. Update lead with assignment and conversation ID
    await leadRef.update({
      status: 'assigned',
      assignedTo: agentId,
      assignedAt: now,
      inboxConversationId: conversationId,
      updatedAt: now,
    })

    return NextResponse.json({
      ok: true,
      data: {
        leadId,
        agentId,
        conversationId,
        assignedAt: now,
      },
    })
  } catch (e: any) {
    console.error('assign lead error', e)
    return NextResponse.json(
      { ok: false, error: e.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
