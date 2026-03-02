import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { Timestamp } from 'firebase-admin/firestore'
import crypto from 'crypto'
import { requireMasterAdmin } from '@/lib/requireMasterAdmin'
import { isLeadTerminalStage, normalizeLeadStage, stageSlaDueAt, stageToLegacyStatus } from '@/lib/leadLifecycle'

export const dynamic = 'force-dynamic'

function extractOwnerAgentId(lead: any): string {
  const ownerFromCanonical = String(lead?.ownerAgentId || '').trim()
  if (ownerFromCanonical) return ownerFromCanonical

  if (typeof lead?.assignedTo === 'string') {
    const ownerFromLegacy = String(lead.assignedTo || '').trim()
    if (ownerFromLegacy) return ownerFromLegacy
  }

  const ownerFromLegacyObject = String(lead?.assignedTo?.uid || '').trim()
  if (ownerFromLegacyObject) return ownerFromLegacyObject

  return ''
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireMasterAdmin(req)

    const { leadId, agentId, note } = await req.json()
    if (!leadId || !agentId) {
      return NextResponse.json({ ok: false, error: 'leadId and agentId are required' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
    }

    const leadRef = adminDb.collection('leads').doc(leadId)
    const leadSnap = await leadRef.get()
    if (!leadSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 })
    }

    const lead = leadSnap.data() as any
    const previousOwner = extractOwnerAgentId(lead)
    const currentStage = normalizeLeadStage(lead?.leadStage, lead?.status)

    if (isLeadTerminalStage(currentStage)) {
      return NextResponse.json({ ok: false, error: `Cannot assign a terminal-stage lead (${currentStage})` }, { status: 409 })
    }

    if (previousOwner && previousOwner !== agentId && !String(note || '').trim()) {
      return NextResponse.json({ ok: false, error: 'Reassignment reason is required in note' }, { status: 400 })
    }

    const agentSnap = await adminDb.collection('users').doc(agentId).get()
    if (!agentSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Agent not found' }, { status: 404 })
    }
    const agent = agentSnap.data() as any

    const conversationRef = adminDb.collection('conversations').doc()
    const conversationId = conversationRef.id

    const now = Timestamp.now()
    const requestId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
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
      leadId,
      leadSource: 'crm',
      createdAt: now,
      updatedAt: now,
      lastMessage: systemMessage,
      lastMessageAt: now,
    })

    const nowDate = now.toDate()
    const nextStage = currentStage === 'new' ? 'assigned' : currentStage
    const nextStatus = stageToLegacyStatus(nextStage)

    await leadRef.update({
      leadStage: nextStage,
      status: nextStatus,
      legacyStatus: nextStatus,
      ownerAgentId: agentId,
      assignedTo: agentId,
      ownerAssignedAt: now,
      ownerAssignedBy: admin.uid,
      ownerAssignmentReason: previousOwner && previousOwner !== agentId ? String(note || '').trim() : 'assigned',
      assignedAt: now,
      inboxConversationId: conversationId,
      previousStage: currentStage,
      stageChangedAt: now,
      stageChangedBy: admin.uid,
      stageChangeReason: previousOwner && previousOwner !== agentId ? 'reassigned' : 'assigned',
      stageSlaDueAt: stageSlaDueAt(nextStage, nowDate),
      slaBreached: false,
      slaBreachedAt: null,
      slaResetAt: previousOwner && previousOwner !== agentId ? now : null,
      reassignmentReason: previousOwner && previousOwner !== agentId ? String(note || '').trim() : null,
      updatedAt: now,
    })

    await adminDb.collection('lead_stage_events').add({
      leadId,
      previousStage: currentStage,
      newStage: nextStage,
      actorUserId: admin.uid,
      actorEmail: admin.email,
      reason: previousOwner && previousOwner !== agentId ? String(note || '').trim() : 'assigned',
      requestId,
      createdAt: now,
    })

    await adminDb.collection('lead_assignment_logs').add({
      leadId,
      previousOwnerAgentId: previousOwner || null,
      newOwnerAgentId: agentId,
      previousAssignedTo: previousOwner || null,
      newAssignedTo: agentId,
      eventType: previousOwner && previousOwner !== agentId ? 'reassigned' : 'assigned',
      reason: String(note || '').trim(),
      note: String(note || '').trim(),
      actorUserId: admin.uid,
      actorEmail: admin.email,
      leadStageFrom: currentStage,
      leadStageTo: nextStage,
      requestId,
      createdAt: now,
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
    return NextResponse.json({ ok: false, error: e.message || 'Internal server error' }, { status: 500 })
  }
}
