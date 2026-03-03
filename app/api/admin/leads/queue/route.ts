import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'
import { FieldPath, Timestamp } from 'firebase-admin/firestore'
import {
  isLeadStage,
  isLeadTerminalStage,
  isSlaBreached,
  normalizeLeadStage,
  ownerRequiredForStage,
  secondsToSlaDue,
  stageSlaDueAt,
  stageToLegacyStatus,
  validateLeadStageTransition,
} from '@/lib/leadLifecycle'

export const dynamic = 'force-dynamic'

interface LeadData {
  type: 'request-info' | 'request-call' | 'whatsapp' | 'showing'
  source: 'property' | 'project' | 'agent'
  sourceId: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  message?: string
}

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

function toIso(value: any): string | null {
  const parsed = toDate(value)
  return parsed ? parsed.toISOString() : null
}

function toMillis(value: any): number {
  const parsed = toDate(value)
  return parsed ? parsed.getTime() : 0
}

function parseCsv(input: string | null): string[] {
  if (!input) return []
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Number(((numerator / denominator) * 100).toFixed(1))
}

function avg(values: number[]): number {
  if (!values.length) return 0
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
}

function mapOperationalCount(value: unknown): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

async function loadUsersByIds(adminDb: any, userIds: string[]) {
  const users = new Map<string, any>()
  const chunks: string[][] = []
  for (let i = 0; i < userIds.length; i += 10) {
    chunks.push(userIds.slice(i, i + 10))
  }

  for (const chunk of chunks) {
    if (chunk.length === 0) continue
    const snap = await adminDb.collection('users').where(FieldPath.documentId(), 'in', chunk).get()
    for (const doc of snap.docs) {
      users.set(doc.id, doc.data() || {})
    }
  }

  return users
}

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

function mapLeadForResponse(doc: any) {
  const data = doc.data() || {}
  const leadStage = normalizeLeadStage(data.leadStage, data.status)
  const ownerAgentId = extractOwnerAgentId(data)
  const createdAt = toIso(data.createdAt)
  const updatedAt = toIso(data.updatedAt)
  const assignedAt = toIso(data.assignedAt || data.ownerAssignedAt)
  const stageChangedAt = toIso(data.stageChangedAt)
  const stageSlaDueAtValue = toDate(data.stageSlaDueAt)
  const breached = isSlaBreached(leadStage, stageSlaDueAtValue)
  const secondsToBreach = secondsToSlaDue(stageSlaDueAtValue)

  return {
    id: doc.id,
    ...data,
    leadStage,
    status: stageToLegacyStatus(leadStage),
    ownerAgentId: ownerAgentId || null,
    assignedTo: ownerAgentId || null,
    createdAt,
    updatedAt,
    assignedAt,
    stageChangedAt,
    lastActivityAt: updatedAt || stageChangedAt || createdAt,
    stageSlaDueAt: stageSlaDueAtValue ? stageSlaDueAtValue.toISOString() : null,
    slaBreached: breached,
    secondsToBreach,
  }
}

// GET /api/admin/leads/queue
export async function GET(req: NextRequest) {
  try {
    await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')?.trim()
    const stage = searchParams.get('stage')?.trim()
    const stages = parseCsv(searchParams.get('stages')).filter(isLeadStage)
    const type = searchParams.get('type')?.trim()
    const source = searchParams.get('source')?.trim()
    const ownerAgentId = searchParams.get('ownerAgentId')?.trim()
    const sla = searchParams.get('sla')?.trim()
    const q = searchParams.get('q')?.trim().toLowerCase()
    const from = searchParams.get('from')?.trim()
    const to = searchParams.get('to')?.trim()
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 200)

    let ref: any = adminDb.collection('leads')

    if (status) ref = ref.where('status', '==', status)
    if (stage && isLeadStage(stage) && stages.length === 0) ref = ref.where('leadStage', '==', stage)
    if (type) ref = ref.where('type', '==', type)
    if (source) ref = ref.where('source', '==', source)

    let leads: any[] = []
    try {
      const snap = await ref.orderBy('createdAt', 'desc').limit(limit).get()
      leads = snap.docs.map(mapLeadForResponse)
    } catch {
      const snap = await ref.get()
      leads = snap.docs.map(mapLeadForResponse).slice(0, limit)
    }

    if (stages.length > 0) {
      const stageSet = new Set(stages)
      leads = leads.filter((lead) => stageSet.has(lead.leadStage))
    }

    if (ownerAgentId === 'unassigned') {
      leads = leads.filter((lead) => !lead.ownerAgentId)
    } else if (ownerAgentId) {
      leads = leads.filter((lead) => String(lead.ownerAgentId || '') === ownerAgentId)
    }

    if (sla === 'overdue') {
      leads = leads.filter((lead) => lead.slaBreached)
    }

    if (from) {
      const fromMillis = new Date(from).setHours(0, 0, 0, 0)
      if (Number.isFinite(fromMillis)) {
        leads = leads.filter((lead) => {
          const createdAtMs = toMillis(lead.createdAt)
          return createdAtMs ? createdAtMs >= fromMillis : false
        })
      }
    }

    if (to) {
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)
      const toMillisValue = toDate.getTime()
      if (Number.isFinite(toMillisValue)) {
        leads = leads.filter((lead) => {
          const createdAtMs = toMillis(lead.createdAt)
          return createdAtMs ? createdAtMs <= toMillisValue : false
        })
      }
    }

    if (q) {
      leads = leads.filter((lead) => {
        const haystack = [
          lead.buyerName,
          lead.buyerEmail,
          lead.buyerPhone,
          lead.source,
          lead.type,
          lead.ownerAgentId,
        ]
          .map((value) => String(value || '').toLowerCase())
          .join(' ')

        return haystack.includes(q)
      })
    }

    leads = leads.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)).slice(0, limit)

    const nowMs = Date.now()
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
    const RESPONSE_TIME_CLAMP_MINUTES = 7 * 24 * 60
    const responseWindowStages = new Set<ReturnType<typeof normalizeLeadStage>>(['assigned', 'contacted', 'qualified', 'won'])

    const responseLatencyMinutes = leads
      .map((lead) => {
        if (!responseWindowStages.has(lead.leadStage)) return null
        const createdMs = toMillis(lead.createdAt)
        const assignedMs = toMillis(lead.assignedAt)
        if (!createdMs || !assignedMs || assignedMs < createdMs) return null
        if (nowMs - createdMs > THIRTY_DAYS_MS) return null
        const latencyMinutes = (assignedMs - createdMs) / (1000 * 60)
        if (latencyMinutes <= 0) return null
        return Math.min(latencyMinutes, RESPONSE_TIME_CLAMP_MINUTES)
      })
      .filter((value): value is number => value !== null)

    const wonCount = leads.filter((lead) => lead.leadStage === 'won').length
    const slaBreachedCount = leads.filter((lead) => lead.slaBreached).length
    const unassignedCount = leads.filter((lead) => !lead.ownerAgentId).length
    const escalationsOpen = leads.filter((lead) => String(lead.escalationStatus || '') === 'open').length
    const autoAssignableCount = leads.filter((lead) => !lead.ownerAgentId && lead.leadStage === 'new').length
    const assignedFunnelCount = leads.filter((lead) => ['assigned', 'contacted', 'qualified', 'negotiating', 'won', 'lost'].includes(lead.leadStage)).length

    const ownerIds = Array.from(
      new Set(
        leads
          .map((lead) => String(lead.ownerAgentId || '').trim())
          .filter(Boolean)
      )
    )
    const usersById = await loadUsersByIds(adminDb, ownerIds)

    const brokerPerf = new Map<string, { assigned: number; won: number; breached: number }>()
    for (const lead of leads) {
      const ownerId = String(lead.ownerAgentId || '').trim()
      if (!ownerId) continue

      const owner = usersById.get(ownerId) || {}
      const brokerLabel = String(owner.brokerage || owner.company || owner.name || 'Independent').trim() || 'Independent'
      const current = brokerPerf.get(brokerLabel) || { assigned: 0, won: 0, breached: 0 }

      current.assigned += 1
      if (lead.leadStage === 'won') current.won += 1
      if (lead.slaBreached) current.breached += 1

      brokerPerf.set(brokerLabel, current)
    }

    const topBrokers = Array.from(brokerPerf.entries())
      .map(([broker, data]) => ({
        broker,
        assigned: data.assigned,
        won: data.won,
        conversionRate: pct(data.won, data.assigned),
        slaBreachRate: pct(data.breached, data.assigned),
      }))
      .sort((a, b) => b.conversionRate - a.conversionRate || b.assigned - a.assigned)
      .slice(0, 5)

    const jobsSnap = await adminDb
      .collection('operational_jobs')
      .orderBy('timestamp', 'desc')
      .limit(8)
      .get()

    const automationRuns = jobsSnap.docs
      .map((doc) => {
        const data = doc.data() || {}
        const job = String(data.job || '').trim()
        if (job !== 'scheduledLeadAutoAssign' && job !== 'scheduledLeadSlaEscalation') return null

        return {
          id: doc.id,
          job,
          status: String(data.status || 'unknown').trim().toLowerCase(),
          scanned: mapOperationalCount(data.scanned),
          assigned: mapOperationalCount(data.assigned),
          escalated: mapOperationalCount(data.escalated),
          durationMs: mapOperationalCount(data.durationMs),
          timestamp: toIso(data.timestamp),
        }
      })
      .filter((run): run is NonNullable<typeof run> => run !== null)
      .slice(0, 6)

    const stats = {
      total: leads.length,
      unassigned: unassignedCount,
      assigned: leads.filter((lead) => lead.status === 'assigned').length,
      contacted: leads.filter((lead) => lead.status === 'contacted').length,
      won: leads.filter((lead) => lead.status === 'won').length,
      lost: leads.filter((lead) => lead.status === 'lost').length,
      byStage: {
        new: leads.filter((lead) => lead.leadStage === 'new').length,
        assigned: leads.filter((lead) => lead.leadStage === 'assigned').length,
        contacted: leads.filter((lead) => lead.leadStage === 'contacted').length,
        qualified: leads.filter((lead) => lead.leadStage === 'qualified').length,
        negotiating: leads.filter((lead) => lead.leadStage === 'negotiating').length,
        won: leads.filter((lead) => lead.leadStage === 'won').length,
        lost: leads.filter((lead) => lead.leadStage === 'lost').length,
        archived: leads.filter((lead) => lead.leadStage === 'archived').length,
      },
      overdue: slaBreachedCount,
      unowned: unassignedCount,
      metrics: {
        totalLeads: leads.length,
        unassigned: unassignedCount,
        slaBreached: slaBreachedCount,
        conversionRate: assignedFunnelCount > 0 ? pct(wonCount, assignedFunnelCount) : null,
        avgResponseTimeMinutes: avg(responseLatencyMinutes),
        escalationsOpen,
        autoAssignable: autoAssignableCount,
        topBrokers,
      },
    }

    return NextResponse.json({ ok: true, data: { leads, stats, automationRuns } })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[admin/leads/queue] Error:', error?.message)
    return NextResponse.json({ ok: false, error: 'Failed to fetch lead queue' }, { status: 500 })
  }
}

// POST /api/admin/leads/queue
export async function POST(req: NextRequest) {
  try {
    const body: LeadData = await req.json()

    if (!body.buyerName || !body.buyerEmail || !body.type || !body.source) {
      return NextResponse.json({ ok: false, error: 'buyerName, buyerEmail, type, and source are required' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const leadDoc = {
      type: body.type,
      source: body.source,
      sourceId: body.sourceId,
      buyerName: body.buyerName.trim(),
      buyerEmail: body.buyerEmail.trim().toLowerCase(),
      buyerPhone: body.buyerPhone?.trim() || '',
      message: body.message?.trim() || '',
      leadStage: 'new',
      status: 'unassigned',
      ownerAgentId: null,
      assignedTo: null,
      ownerAssignedAt: null,
      ownerAssignedBy: null,
      ownerAssignmentReason: null,
      stageChangedAt: Timestamp.now(),
      stageChangedBy: null,
      stageChangeReason: 'lead_created',
      stageSlaDueAt: stageSlaDueAt('new'),
      slaBreached: false,
      slaBreachedAt: null,
      inboxConversationId: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    const docRef = await adminDb.collection('leads').add(leadDoc)

    return NextResponse.json({ ok: true, data: { id: docRef.id, ...leadDoc }, message: 'Lead created successfully' })
  } catch (error: any) {
    console.error('[admin/leads/queue POST] Error:', error?.message)
    return NextResponse.json({ ok: false, error: 'Failed to create lead' }, { status: 500 })
  }
}

// PATCH /api/admin/leads/queue
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const body = await req.json()
    const { id, status, leadStage, ownerAgentId, assignedTo, inboxConversationId, reason } = body

    if (!id) {
      return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
    }

    const leadRef = adminDb.collection('leads').doc(id)
    const leadSnap = await leadRef.get()
    if (!leadSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 })
    }

    const lead = leadSnap.data() || {}
    const currentStage = normalizeLeadStage(lead.leadStage, lead.status)

    const previousOwner = extractOwnerAgentId(lead)
    const incomingOwnerRaw = ownerAgentId !== undefined ? ownerAgentId : assignedTo
    const nextOwner = incomingOwnerRaw !== undefined ? String(incomingOwnerRaw || '').trim() : previousOwner

    const requestedStage =
      typeof leadStage === 'string'
        ? leadStage
        : typeof status === 'string'
          ? normalizeLeadStage(undefined, status)
          : (incomingOwnerRaw !== undefined && currentStage === 'new' ? 'assigned' : currentStage)

    const transition = validateLeadStageTransition({ currentStage, nextStage: requestedStage })
    if (!transition.ok) {
      return NextResponse.json({ ok: false, error: transition.error, code: transition.code }, { status: 400 })
    }

    if (ownerRequiredForStage(transition.nextStage) && !nextOwner) {
      return NextResponse.json({ ok: false, error: 'ownerAgentId is required for this lead stage', code: 'OWNER_REQUIRED' }, { status: 400 })
    }

    const ownerChanged = incomingOwnerRaw !== undefined && previousOwner !== nextOwner
    if (ownerChanged && previousOwner && nextOwner && !String(reason || '').trim()) {
      return NextResponse.json({ ok: false, error: 'Reassignment reason is required', code: 'REASSIGN_REASON_REQUIRED' }, { status: 400 })
    }

    if (isLeadTerminalStage(currentStage) && ownerChanged) {
      return NextResponse.json({ ok: false, error: `Cannot change owner in terminal stage (${currentStage})`, code: 'TERMINAL_STAGE_ASSIGNMENT_BLOCKED' }, { status: 409 })
    }

    const requestId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const now = new Date()
    const nextLegacyStatus = stageToLegacyStatus(transition.nextStage)
    const dueAt = stageSlaDueAt(transition.nextStage, now)

    const updates: any = {
      updatedAt: Timestamp.now(),
      leadStage: transition.nextStage,
      status: nextLegacyStatus,
      legacyStatus: nextLegacyStatus,
      previousStage: transition.currentStage,
      stageChangedAt: Timestamp.now(),
      stageChangedBy: admin.uid,
      stageChangeReason: String(reason || '').trim() || 'queue_patch',
      stageSlaDueAt: dueAt,
      slaBreached: false,
      slaBreachedAt: null,
    }

    if (incomingOwnerRaw !== undefined || ownerRequiredForStage(transition.nextStage)) {
      updates.ownerAgentId = nextOwner || null
      updates.assignedTo = nextOwner || null
      updates.assignedAt = nextOwner ? Timestamp.now() : null
      updates.ownerAssignedAt = nextOwner ? Timestamp.now() : null
      updates.ownerAssignedBy = nextOwner ? admin.uid : null
      updates.ownerAssignmentReason = ownerChanged ? String(reason || '').trim() : (lead.ownerAssignmentReason || null)

      if (ownerChanged) {
        updates.slaResetAt = Timestamp.now()
        updates.reassignmentReason = String(reason || '').trim() || null
      }
    }

    if (inboxConversationId !== undefined) {
      updates.inboxConversationId = inboxConversationId || null
    }

    await leadRef.update(updates)

    await adminDb.collection('lead_stage_events').add({
      leadId: id,
      previousStage: transition.currentStage,
      newStage: transition.nextStage,
      actorUserId: admin.uid,
      actorEmail: admin.email,
      reason: String(reason || '').trim() || 'queue_patch',
      requestId,
      createdAt: Timestamp.now(),
    })

    if (ownerChanged || (!previousOwner && nextOwner)) {
      const eventType = !nextOwner ? 'unassigned' : previousOwner ? 'reassigned' : 'assigned'
      await adminDb.collection('lead_assignment_logs').add({
        leadId: id,
        previousOwnerAgentId: previousOwner || null,
        newOwnerAgentId: nextOwner || null,
        previousAssignedTo: previousOwner || null,
        newAssignedTo: nextOwner || null,
        eventType,
        reason: String(reason || '').trim(),
        note: String(reason || '').trim(),
        actorUserId: admin.uid,
        actorEmail: admin.email,
        requestId,
        createdAt: Timestamp.now(),
      })
    }

    return NextResponse.json({ ok: true, message: 'Lead updated successfully' })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[admin/leads/queue PATCH] Error:', error?.message)
    return NextResponse.json({ ok: false, error: 'Failed to update lead' }, { status: 500 })
  }
}

// DELETE /api/admin/leads/queue
export async function DELETE(req: NextRequest) {
  try {
    await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const body = await req.json()
    const { leadId } = body

    if (!leadId) {
      return NextResponse.json({ ok: false, error: 'leadId is required' }, { status: 400 })
    }

    await adminDb.collection('leads').doc(leadId).delete()

    return NextResponse.json({ ok: true, message: 'Lead deleted successfully' })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[admin/leads/queue DELETE] Error:', error?.message)
    return NextResponse.json({ ok: false, error: 'Failed to delete lead' }, { status: 500 })
  }
}
