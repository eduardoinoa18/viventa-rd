import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

type LeadStage = 'new' | 'assigned' | 'contacted' | 'qualified' | 'negotiating' | 'won' | 'lost' | 'archived'

const TERMINAL_STAGES = new Set<LeadStage>(['won', 'lost', 'archived'])
const STAGE_BY_STATUS: Record<string, LeadStage> = {
  unassigned: 'new',
  assigned: 'assigned',
  contacted: 'contacted',
  won: 'won',
  lost: 'lost',
}
const STATUS_BY_STAGE: Record<LeadStage, 'unassigned' | 'assigned' | 'contacted' | 'won' | 'lost'> = {
  new: 'unassigned',
  assigned: 'assigned',
  contacted: 'contacted',
  qualified: 'contacted',
  negotiating: 'contacted',
  won: 'won',
  lost: 'lost',
  archived: 'lost',
}
const SLA_HOURS_BY_STAGE: Record<LeadStage, number> = {
  new: 1,
  assigned: 2,
  contacted: 24,
  qualified: 48,
  negotiating: 72,
  won: 0,
  lost: 0,
  archived: 0,
}

function normalizeLeadStage(value: unknown, fallbackStatus?: unknown): LeadStage {
  if (typeof value === 'string' && value in SLA_HOURS_BY_STAGE) {
    return value as LeadStage
  }
  if (typeof fallbackStatus === 'string' && STAGE_BY_STATUS[fallbackStatus]) {
    return STAGE_BY_STATUS[fallbackStatus]
  }
  return 'new'
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

function stageSlaDueAt(stage: LeadStage, fromDate = new Date()): Date | null {
  const hours = SLA_HOURS_BY_STAGE[stage]
  if (!hours) return null
  return new Date(fromDate.getTime() + hours * 60 * 60 * 1000)
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

function isSlaBreached(stage: LeadStage, dueAt: Date | null): boolean {
  if (!dueAt) return false
  if (TERMINAL_STAGES.has(stage)) return false
  return dueAt.getTime() < Date.now()
}

async function logOperationalJob(job: string, data: Record<string, unknown>) {
  await admin.firestore().collection('operational_jobs').add({
    job,
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })
}

async function getAssignablePool() {
  const usersSnap = await admin
    .firestore()
    .collection('users')
    .where('status', '==', 'active')
    .where('role', 'in', ['agent', 'broker'])
    .get()

  const all = usersSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
  if (all.length === 0) return []

  const premium = all.filter((user: any) => String(user.plan || '').toLowerCase() === 'premium')
  const base = premium.length > 0 ? premium : all

  return base.sort((a: any, b: any) => String(a.name || a.company || '').localeCompare(String(b.name || b.company || '')))
}

export const scheduledLeadAutoAssign = functions.pubsub
  .schedule('every 10 minutes')
  .timeZone('America/Santo_Domingo')
  .onRun(async () => {
    const startedAt = Date.now()
    const pool = await getAssignablePool()

    if (pool.length === 0) {
      await logOperationalJob('scheduledLeadAutoAssign', {
        status: 'ok',
        scanned: 0,
        assigned: 0,
        note: 'No active assignable agents',
      })
      return null
    }

    const leadsSnap = await admin.firestore().collection('leads').where('leadStage', '==', 'new').limit(120).get()
    const candidates = leadsSnap.docs.filter((doc) => {
      const lead = doc.data() || {}
      return !extractOwnerAgentId(lead)
    })

    if (candidates.length === 0) {
      await logOperationalJob('scheduledLeadAutoAssign', {
        status: 'ok',
        scanned: leadsSnap.size,
        assigned: 0,
        durationMs: Date.now() - startedAt,
      })
      return null
    }

    const counterRef = admin.firestore().collection('counters').doc('lead_assignment')
    const counterSnap = await counterRef.get()
    const lastAssignedUid = String(counterSnap.data()?.lastAssignedUid || '').trim()

    let idx = 0
    if (lastAssignedUid) {
      const found = pool.findIndex((entry: any) => entry.id === lastAssignedUid)
      idx = found >= 0 ? (found + 1) % pool.length : 0
    }

    const batch = admin.firestore().batch()
    const now = admin.firestore.Timestamp.now()
    let assignedCount = 0
    let lastUid = lastAssignedUid

    for (const leadDoc of candidates.slice(0, 50)) {
      const assignee = pool[idx]
      idx = (idx + 1) % pool.length
      lastUid = assignee.id
      assignedCount += 1

      batch.update(leadDoc.ref, {
        ownerAgentId: assignee.id,
        assignedTo: assignee.id,
        ownerAssignedAt: now,
        ownerAssignedBy: 'scheduled_auto_assign',
        ownerAssignmentReason: 'scheduled_auto_assign',
        assignedAt: now,
        leadStage: 'assigned',
        status: STATUS_BY_STAGE.assigned,
        legacyStatus: STATUS_BY_STAGE.assigned,
        previousStage: 'new',
        stageChangedAt: now,
        stageChangeReason: 'scheduled_auto_assign',
        stageSlaDueAt: stageSlaDueAt('assigned', now.toDate()),
        slaBreached: false,
        slaBreachedAt: null,
        updatedAt: now,
      })

      const logRef = admin.firestore().collection('lead_assignment_logs').doc()
      batch.set(logRef, {
        leadId: leadDoc.id,
        previousOwnerAgentId: null,
        newOwnerAgentId: assignee.id,
        previousAssignedTo: null,
        newAssignedTo: assignee.id,
        eventType: 'assigned',
        reason: 'scheduled_auto_assign',
        actorUserId: 'system',
        actorEmail: 'system@viventa.local',
        createdAt: now,
      })
    }

    batch.set(counterRef, { lastAssignedUid: lastUid, updatedAt: now }, { merge: true })
    await batch.commit()

    await logOperationalJob('scheduledLeadAutoAssign', {
      status: 'ok',
      scanned: leadsSnap.size,
      candidates: candidates.length,
      assigned: assignedCount,
      durationMs: Date.now() - startedAt,
    })

    return null
  })

export const scheduledLeadSlaEscalation = functions.pubsub
  .schedule('every 15 minutes')
  .timeZone('America/Santo_Domingo')
  .onRun(async () => {
    const startedAt = Date.now()
    let docs: FirebaseFirestore.QueryDocumentSnapshot[] = []

    try {
      const snap = await admin.firestore().collection('leads').orderBy('updatedAt', 'desc').limit(300).get()
      docs = snap.docs
    } catch {
      const snap = await admin.firestore().collection('leads').get()
      docs = snap.docs.slice(0, 300)
    }

    const now = admin.firestore.Timestamp.now()
    const batch = admin.firestore().batch()
    let escalated = 0

    for (const doc of docs) {
      const lead = doc.data() || {}
      const stage = normalizeLeadStage(lead.leadStage, lead.status)
      const dueAt = toDate(lead.stageSlaDueAt)
      const alreadyOpen = String(lead.escalationStatus || '') === 'open'

      if (TERMINAL_STAGES.has(stage) || alreadyOpen || !isSlaBreached(stage, dueAt)) {
        continue
      }

      escalated += 1
      const previousLevel = Number(lead.escalationLevel || 0)

      batch.update(doc.ref, {
        escalationStatus: 'open',
        escalationLevel: previousLevel + 1,
        escalatedAt: now,
        escalatedBy: 'scheduled_sla_escalation',
        escalationReason: 'sla_breach',
        escalationOwnerAgentId: lead.ownerAgentId || lead.assignedTo || null,
        escalationResolvedAt: null,
        escalationResolvedBy: null,
        updatedAt: now,
      })

      const eventRef = admin.firestore().collection('lead_escalation_events').doc()
      batch.set(eventRef, {
        leadId: doc.id,
        eventType: 'escalated',
        reason: 'sla_breach',
        previousLevel,
        newLevel: previousLevel + 1,
        actorUserId: 'system',
        actorEmail: 'system@viventa.local',
        createdAt: now,
      })
    }

    if (escalated > 0) {
      await batch.commit()
    }

    await logOperationalJob('scheduledLeadSlaEscalation', {
      status: 'ok',
      scanned: docs.length,
      escalated,
      durationMs: Date.now() - startedAt,
    })

    return null
  })
