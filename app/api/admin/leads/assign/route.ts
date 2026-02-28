import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { Timestamp } from 'firebase-admin/firestore'
import crypto from 'crypto'
import { requireMasterAdmin } from '@/lib/requireMasterAdmin'
import { normalizeLeadStage, stageSlaDueAt, stageToLegacyStatus } from '@/lib/leadLifecycle'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const admin = await requireMasterAdmin(req)

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
    const previousAssignedTo = String(lead?.assignedTo || '')
    const currentStage = normalizeLeadStage(lead?.leadStage, lead?.status)

    if (['won', 'lost', 'archived'].includes(currentStage)) {
      return NextResponse.json(
        { ok: false, error: `Cannot assign a terminal-stage lead (${currentStage})` },
        { status: 409 }
      )
    }

    if (previousAssignedTo && previousAssignedTo !== agentId && !String(note || '').trim()) {
      return NextResponse.json(
        { ok: false, error: 'Reassignment reason is required in note' },
        { status: 400 }
      )
    }

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
    const nowDate = now.toDate()
    const nextStage = currentStage === 'new' ? 'assigned' : currentStage

    await leadRef.update({
      leadStage: nextStage,
      status: stageToLegacyStatus(nextStage),
      assignedTo: agentId,
      assignedAt: now,
      inboxConversationId: conversationId,
      previousStage: currentStage,
      stageChangedAt: now,
      stageChangedBy: admin.uid,
      stageChangeReason: previousAssignedTo && previousAssignedTo !== agentId ? 'reassigned' : 'assigned',
      stageSlaDueAt: stageSlaDueAt(nextStage, nowDate),
      slaResetAt: previousAssignedTo && previousAssignedTo !== agentId ? now : null,
      reassignmentReason: previousAssignedTo && previousAssignedTo !== agentId ? String(note || '').trim() : null,
      updatedAt: now,
    })

    // Assignment / reassignment log entry
    try {
      await adminDb.collection('lead_assignment_logs').add({
        leadId,
        previousAssignedTo: previousAssignedTo || null,
        newAssignedTo: agentId,
        eventType: previousAssignedTo && previousAssignedTo !== agentId ? 'reassigned' : 'assigned',
        note: note || '',
        actorUserId: admin.uid,
        actorEmail: admin.email,
        leadStageFrom: currentStage,
        leadStageTo: nextStage,
        createdAt: now,
      })
    } catch (logError) {
      console.warn('Failed to write lead assignment log:', logError)
    }

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
