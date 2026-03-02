import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'
import { isLeadTerminalStage, isSlaBreached, normalizeLeadStage } from '@/lib/leadLifecycle'

export const dynamic = 'force-dynamic'

function toDate(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === 'function') {
    const parsed = value.toDate()
    return parsed instanceof Date ? parsed : null
  }
  if (typeof value?.seconds === 'number') {
    return new Date(value.seconds * 1000)
  }

  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const body = await req.json().catch(() => ({}))
    const limit = Math.min(Math.max(Number(body?.limit || 150), 1), 300)

    let docs: any[] = []
    try {
      const snap = await adminDb.collection('leads').orderBy('updatedAt', 'desc').limit(limit).get()
      docs = snap.docs
    } catch {
      const snap = await adminDb.collection('leads').get()
      docs = snap.docs.slice(0, limit)
    }

    const candidates = docs.filter((doc) => {
      const data = doc.data() || {}
      const stage = normalizeLeadStage(data.leadStage, data.status)
      if (isLeadTerminalStage(stage)) return false

      const alreadyEscalated = String(data.escalationStatus || '') === 'open'
      if (alreadyEscalated) return false

      const dueAt = toDate(data.stageSlaDueAt)
      return isSlaBreached(stage, dueAt)
    })

    if (candidates.length === 0) {
      return NextResponse.json({
        ok: true,
        data: {
          scanned: docs.length,
          escalated: 0,
          escalatedLeadIds: [],
        },
        message: 'No SLA-breached leads required escalation',
      })
    }

    const now = Timestamp.now()
    const batch = adminDb.batch()
    const escalatedLeadIds: string[] = []

    for (const doc of candidates) {
      const lead = doc.data() || {}
      const currentLevel = Number(lead.escalationLevel || 0)
      const reason = 'sla_breach'

      batch.update(doc.ref, {
        escalationStatus: 'open',
        escalationLevel: currentLevel + 1,
        escalatedAt: now,
        escalatedBy: admin.uid,
        escalationReason: reason,
        escalationOwnerAgentId: lead.ownerAgentId || lead.assignedTo || null,
        escalationResolvedAt: null,
        escalationResolvedBy: null,
        updatedAt: now,
      })

      const eventRef = adminDb.collection('lead_escalation_events').doc()
      batch.set(eventRef, {
        leadId: doc.id,
        eventType: 'escalated',
        reason,
        previousLevel: currentLevel,
        newLevel: currentLevel + 1,
        actorUserId: admin.uid,
        actorEmail: admin.email,
        createdAt: now,
      })

      escalatedLeadIds.push(doc.id)
    }

    await batch.commit()

    return NextResponse.json({
      ok: true,
      data: {
        scanned: docs.length,
        escalated: escalatedLeadIds.length,
        escalatedLeadIds,
      },
      message: 'SLA escalation run completed',
    })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[admin/leads/escalate] Error:', error?.message)
    return NextResponse.json({ ok: false, error: 'Failed to run SLA escalation' }, { status: 500 })
  }
}
