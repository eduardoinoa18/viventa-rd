import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { ActivityLogger } from '@/lib/activityLogger'
import { Timestamp } from 'firebase-admin/firestore'
import { normalizeLeadStage, stageSlaDueAt, stageToLegacyStatus } from '@/lib/leadLifecycle'

export const runtime = 'nodejs'

function extractOwnerAgentId(lead: any): string {
  const ownerFromCanonical = String(lead?.ownerAgentId || '').trim()
  if (ownerFromCanonical) return ownerFromCanonical
  if (typeof lead?.assignedTo === 'string') return String(lead.assignedTo || '').trim()
  return String(lead?.assignedTo?.uid || '').trim()
}

export async function POST(req: NextRequest) {
  try {
    const { leadId } = await req.json()
    if (!leadId) return NextResponse.json({ ok: false, error: 'leadId required' }, { status: 400 })

    const adminDb = getAdminDb()
    if (!adminDb) return NextResponse.json({ ok: false, error: 'Admin not configured' }, { status: 500 })

    const leadRef = adminDb.collection('leads').doc(leadId)
    const leadSnap = await leadRef.get()
    if (!leadSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Lead not found in canonical collection' }, { status: 404 })
    }

    const lead = leadSnap.data() as any
    const currentOwner = extractOwnerAgentId(lead)
    if (currentOwner) {
      return NextResponse.json({ ok: false, error: 'Lead already assigned' }, { status: 400 })
    }

    const usersSnap = await adminDb
      .collection('users')
      .where('status', '==', 'active')
      .where('role', 'in', ['agent', 'broker'])
      .get()

    const all = usersSnap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }))
    if (all.length === 0) return NextResponse.json({ ok: false, error: 'No candidates available' }, { status: 404 })

    const isPremium = (u: any) => String(u.plan || '').toLowerCase() === 'premium'
    const premium = all.filter(isPremium)
    const standard = all.filter((u) => !isPremium(u))
    const pool = premium.length > 0 ? premium : standard

    const countersRef = adminDb.collection('counters').doc('lead_assignment')
    const countersSnap = await countersRef.get()
    const data = (countersSnap.exists ? countersSnap.data() : {}) as any
    const lastUid: string | undefined = data.lastAssignedUid

    pool.sort((a: any, b: any) => String(a.name || a.company || '').localeCompare(String(b.name || b.company || '')))

    let index = 0
    if (lastUid) {
      const found = pool.findIndex((p) => p.id === lastUid)
      index = found >= 0 ? (found + 1) % pool.length : 0
    }

    const assignee = pool[index]
    const now = Timestamp.now()
    const nowDate = now.toDate()
    const currentStage = normalizeLeadStage(lead?.leadStage, lead?.status)
    const nextStage = currentStage === 'new' ? 'assigned' : currentStage
    const nextStatus = stageToLegacyStatus(nextStage)

    await leadRef.set(
      {
        leadStage: nextStage,
        status: nextStatus,
        legacyStatus: nextStatus,
        ownerAgentId: assignee.id,
        assignedTo: assignee.id,
        ownerAssignedAt: now,
        ownerAssignedBy: 'auto_assign_engine',
        ownerAssignmentReason: 'auto_assign',
        assignedAt: now,
        stageChangedAt: now,
        stageChangeReason: 'auto_assign',
        stageSlaDueAt: stageSlaDueAt(nextStage, nowDate),
        slaBreached: false,
        slaBreachedAt: null,
        updatedAt: now,
      },
      { merge: true }
    )

    await countersRef.set({ lastAssignedUid: assignee.id, updatedAt: now }, { merge: true })

    try {
      await adminDb.collection('lead_assignment_logs').add({
        leadId,
        previousOwnerAgentId: null,
        newOwnerAgentId: assignee.id,
        eventType: 'assigned',
        reason: 'auto_assign',
        actorUserId: 'system',
        actorEmail: 'system@viventa.local',
        createdAt: now,
      })
    } catch {}

    try {
      await ActivityLogger.log({
        type: 'lead',
        action: 'Lead Auto-Assigned',
        metadata: {
          leadId,
          assigneeId: assignee.id,
          assigneeName: assignee.name || assignee.company,
          premium: isPremium(assignee),
        },
      })
    } catch {}

    return NextResponse.json({
      ok: true,
      assignee: {
        uid: assignee.id,
        name: assignee.name || assignee.company,
        role: assignee.role,
        email: assignee.email,
      },
    })
  } catch (e: any) {
    console.error('auto-assign lead error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Internal error' }, { status: 500 })
  }
}
