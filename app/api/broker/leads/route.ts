import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'
import { emitActivityEvent } from '@/lib/activityEvents'
import {
  normalizeLeadStage,
  ownerRequiredForStage,
  secondsToSlaDue,
  isSlaBreached,
  stageSlaDueAt,
  stageToLegacyStatus,
  validateLeadStageTransition,
} from '@/lib/leadLifecycle'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function toMillis(value: any): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return date instanceof Date ? date.getTime() : 0
  }
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0
}

function toDate(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return date instanceof Date ? date : null
  }
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function toIso(value: any): string | null {
  const parsed = toDate(value)
  return parsed ? parsed.toISOString() : null
}

function extractOwnerAgentId(lead: Record<string, any>): string {
  return safeText(lead.ownerAgentId || lead.assignedTo || lead.assignedTo?.uid)
}

function normalizePriority(value: unknown): 'low' | 'normal' | 'high' {
  const text = safeText(value).toLowerCase()
  if (text === 'low') return 'low'
  if (text === 'high') return 'high'
  return 'normal'
}

async function getOfficeAgentIds(db: FirebaseFirestore.Firestore, officeId: string, currentUid: string) {
  const [byBrokerId, byBrokerageId] = await Promise.all([
    db.collection('users').where('brokerId', '==', officeId).limit(400).get(),
    db.collection('users').where('brokerageId', '==', officeId).limit(400).get(),
  ])

  const officeAgentIds = new Set<string>()
  for (const snapshot of [byBrokerId, byBrokerageId]) {
    for (const doc of snapshot.docs) {
      const data = doc.data() as Record<string, any>
      const role = safeText(data.role).toLowerCase()
      if (role === 'agent' || role === 'broker') {
        officeAgentIds.add(doc.id)
      }
    }
  }
  officeAgentIds.add(currentUid)
  return officeAgentIds
}

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'broker' && context.role !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
    if (!context.officeId) {
      return NextResponse.json({ ok: false, error: 'Broker office assignment required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 30), 1), 100)

    const officeAgentIds = await getOfficeAgentIds(db, context.officeId, context.uid)

    const snap = await db.collection('leads').limit(2500).get()
    const leads = snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, any>) }) as Record<string, any>)
      .filter((lead) => {
        const owner = extractOwnerAgentId(lead)
        const leadOffice = safeText(lead.brokerId || lead.brokerageId)
        if (leadOffice && leadOffice === context.officeId) return true
        if (owner && officeAgentIds.has(owner)) return true
        return false
      })
      .map((lead) => {
        const stage = normalizeLeadStage(lead.leadStage, lead.status)
        const stageSlaDueAtValue = toDate(lead.stageSlaDueAt)
        const followUpAtValue = toDate(lead.followUpAt || lead.nextFollowUpAt)
        const createdAt = toIso(lead.createdAt)
        const updatedAt = toIso(lead.updatedAt)
        const assignedAt = toIso(lead.assignedAt || lead.ownerAssignedAt)
        const stageChangedAt = toIso(lead.stageChangedAt)
        const slaBreached = isSlaBreached(stage, stageSlaDueAtValue)
        const secondsToBreach = secondsToSlaDue(stageSlaDueAtValue)
        const slaStatus = slaBreached ? 'breached' : (secondsToBreach !== null && secondsToBreach <= 24 * 60 * 60 ? 'due_soon' : 'healthy')
        return {
          id: lead.id,
          buyerName: safeText(lead.buyerName || lead.name || lead.fullName || 'Lead'),
          buyerEmail: safeText(lead.buyerEmail || lead.email),
          buyerPhone: safeText(lead.buyerPhone || lead.phone),
          leadStage: stage,
          status: stageToLegacyStatus(stage),
          ownerAgentId: extractOwnerAgentId(lead) || null,
          source: safeText(lead.source || 'property'),
          createdAt,
          updatedAt,
          assignedAt,
          stageChangedAt,
          stageSlaDueAt: stageSlaDueAtValue ? stageSlaDueAtValue.toISOString() : null,
          slaBreached,
          slaStatus,
          secondsToBreach,
          followUpAt: followUpAtValue ? followUpAtValue.toISOString() : null,
          nextActionNote: safeText(lead.nextActionNote || lead.followUpNote),
          priority: normalizePriority(lead.priority),
          lastActivityAt: updatedAt || stageChangedAt || assignedAt || createdAt,
        }
      })
      .sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt) || toMillis(b.createdAt) - toMillis(a.createdAt))
      .slice(0, limit)

    return NextResponse.json({ ok: true, leads })
  } catch (error: any) {
    console.error('[api/broker/leads] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load broker leads' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'broker' && context.role !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
    if (!context.officeId) {
      return NextResponse.json({ ok: false, error: 'Broker office assignment required' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const buyerName = safeText(body.buyerName || body.name || body.fullName)
    const buyerEmail = safeText(body.buyerEmail || body.email)
    const buyerPhone = safeText(body.buyerPhone || body.phone)
    const source = safeText(body.source || 'direct') || 'direct'
    const type = safeText(body.type || 'request-info') || 'request-info'
    const requestedOwner = safeText(body.ownerAgentId)
    const officeAgentIds = await getOfficeAgentIds(db, context.officeId, context.uid)

    if (!buyerName) {
      return NextResponse.json({ ok: false, error: 'buyerName is required' }, { status: 400 })
    }

    if (requestedOwner && !officeAgentIds.has(requestedOwner)) {
      return NextResponse.json({ ok: false, error: 'ownerAgentId is not in your office' }, { status: 400 })
    }

    const ownerAgentId = requestedOwner || context.uid
    const leadStage = normalizeLeadStage(body.leadStage, ownerAgentId ? 'assigned' : 'new')
    const now = new Date()

    const created = await db.collection('leads').add({
      type,
      source,
      sourceId: safeText(body.sourceId) || null,
      buyerName,
      buyerEmail: buyerEmail || null,
      buyerPhone: buyerPhone || null,
      message: safeText(body.message) || null,
      budget: Number.isFinite(Number(body.budget)) ? Number(body.budget) : 0,
      priority: normalizePriority(body.priority),
      leadStage,
      status: stageToLegacyStatus(leadStage),
      legacyStatus: stageToLegacyStatus(leadStage),
      ownerAgentId: ownerAgentId || null,
      assignedTo: ownerAgentId || null,
      assignedAt: ownerAgentId ? now : null,
      ownerAssignedAt: ownerAgentId ? now : null,
      ownerAssignedBy: ownerAgentId ? context.uid : null,
      brokerId: context.officeId,
      brokerageId: context.officeId,
      stageChangedAt: now,
      stageChangedBy: context.uid,
      stageChangeReason: 'manual_crm_create',
      stageSlaDueAt: stageSlaDueAt(leadStage, now),
      slaBreached: false,
      createdAt: now,
      updatedAt: now,
      createdBy: context.uid,
      updatedBy: context.uid,
    })

    await emitActivityEvent(db, {
      type: 'lead_contacted',
      actorId: context.uid,
      actorRole: context.role,
      entityType: 'lead',
      entityId: created.id,
      agentId: ownerAgentId || null,
      brokerId: context.officeId,
      officeId: context.officeId,
      metadata: {
        buyerName,
        source,
        leadStage,
      },
    })

    const saved = await created.get()
    return NextResponse.json({ ok: true, lead: { id: created.id, ...(saved.data() as Record<string, any>) } }, { status: 201 })
  } catch (error: any) {
    console.error('[api/broker/leads] POST error', error)
    return NextResponse.json({ ok: false, error: 'Failed to create broker lead' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'broker' && context.role !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
    if (!context.officeId) {
      return NextResponse.json({ ok: false, error: 'Broker office assignment required' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const action = safeText(body.action).toLowerCase()
    const leadId = safeText(body.leadId)
    const reason = safeText(body.reason || 'broker_manual_update')

    if (!leadId) {
      return NextResponse.json({ ok: false, error: 'leadId is required' }, { status: 400 })
    }
    if (action !== 'assign' && action !== 'stage' && action !== 'followup') {
      return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 })
    }

    const leadRef = db.collection('leads').doc(leadId)
    const leadSnap = await leadRef.get()
    if (!leadSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 })
    }

    const lead = (leadSnap.data() || {}) as Record<string, any>
    const officeAgentIds = await getOfficeAgentIds(db, context.officeId, context.uid)

    const currentOwner = extractOwnerAgentId(lead)
    const leadOffice = safeText(lead.brokerId || lead.brokerageId)
    const leadBelongsToOffice = (leadOffice && leadOffice === context.officeId) || (currentOwner && officeAgentIds.has(currentOwner))
    if (!leadBelongsToOffice) {
      return NextResponse.json({ ok: false, error: 'Lead is not in your office scope' }, { status: 403 })
    }

    const currentStage = normalizeLeadStage(lead.leadStage, lead.status)
    const now = new Date()

    if (action === 'assign') {
      if (context.role !== 'broker') {
        return NextResponse.json({ ok: false, error: 'Only brokers can reassign leads' }, { status: 403 })
      }

      const nextOwner = safeText(body.ownerAgentId)
      if (!nextOwner) {
        return NextResponse.json({ ok: false, error: 'ownerAgentId is required' }, { status: 400 })
      }
      if (!officeAgentIds.has(nextOwner)) {
        return NextResponse.json({ ok: false, error: 'ownerAgentId is not in your office' }, { status: 400 })
      }

      const nextStage = currentStage === 'new' ? 'assigned' : currentStage
      const updateData = {
        ownerAgentId: nextOwner,
        assignedTo: nextOwner,
        assignedAt: now,
        ownerAssignedAt: now,
        ownerAssignedBy: context.uid,
        ownerAssignmentReason: reason,
        leadStage: nextStage,
        status: stageToLegacyStatus(nextStage),
        legacyStatus: stageToLegacyStatus(nextStage),
        stageSlaDueAt: stageSlaDueAt(nextStage, now),
        slaBreached: false,
        updatedAt: now,
      }

      await leadRef.set(updateData, { merge: true })
      return NextResponse.json({ ok: true, action: 'assign', leadId, ownerAgentId: nextOwner, leadStage: nextStage })
    }

    if (action === 'followup') {
      if (context.role === 'agent' && (!currentOwner || currentOwner !== context.uid)) {
        return NextResponse.json({ ok: false, error: 'Agents can only update their own leads' }, { status: 403 })
      }

      const followUpAtInput = safeText(body.followUpAt)
      const nextActionNote = safeText(body.nextActionNote)
      const priority = normalizePriority(body.priority)

      let followUpAt: Date | null = null
      if (followUpAtInput) {
        const parsed = new Date(followUpAtInput)
        if (!Number.isFinite(parsed.getTime())) {
          return NextResponse.json({ ok: false, error: 'followUpAt is invalid' }, { status: 400 })
        }
        followUpAt = parsed
      }

      await leadRef.set(
        {
          followUpAt,
          nextFollowUpAt: followUpAt,
          nextActionNote,
          followUpNote: nextActionNote,
          priority,
          followUpUpdatedAt: now,
          followUpUpdatedBy: context.uid,
          updatedAt: now,
        },
        { merge: true }
      )

      return NextResponse.json({
        ok: true,
        action: 'followup',
        leadId,
        followUpAt: followUpAt ? followUpAt.toISOString() : null,
        priority,
      })
    }

    const requestedStageRaw = safeText(body.leadStage)
    const transition = validateLeadStageTransition({
      currentStage,
      nextStage: requestedStageRaw,
    })

    if (!transition.ok) {
      return NextResponse.json({ ok: false, error: transition.error, code: transition.code }, { status: 400 })
    }

    const ownerForNextStage = currentOwner || safeText(body.ownerAgentId)
    if (ownerRequiredForStage(transition.nextStage) && !ownerForNextStage) {
      return NextResponse.json({ ok: false, error: 'ownerAgentId is required for this stage' }, { status: 400 })
    }

    if (context.role === 'agent') {
      if (!currentOwner || currentOwner !== context.uid) {
        return NextResponse.json({ ok: false, error: 'Agents can only update their own leads' }, { status: 403 })
      }
    }

    const updateData = {
      leadStage: transition.nextStage,
      status: stageToLegacyStatus(transition.nextStage),
      legacyStatus: stageToLegacyStatus(transition.nextStage),
      previousStage: transition.currentStage,
      stageChangedAt: now,
      stageChangedBy: context.uid,
      stageChangeReason: reason,
      stageSlaDueAt: stageSlaDueAt(transition.nextStage, now),
      slaBreached: false,
      updatedAt: now,
    }

    await leadRef.set(updateData, { merge: true })
    return NextResponse.json({ ok: true, action: 'stage', leadId, leadStage: transition.nextStage })
  } catch (error: any) {
    console.error('[api/broker/leads] PATCH error', error)
    return NextResponse.json({ ok: false, error: 'Failed to update broker lead' }, { status: 500 })
  }
}
