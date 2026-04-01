import { NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'
import {
  isLeadTerminalStage,
  isSlaBreached,
  normalizeLeadStage,
  stageSlaDueAt,
  stageToLegacyStatus,
} from '@/lib/leadLifecycle'

export const dynamic = 'force-dynamic'

const AUTO_ASSIGN_JOB = 'scheduledLeadAutoAssign'
const ESCALATION_JOB = 'scheduledLeadSlaEscalation'
const FOLLOWUP_REMINDER_JOB = 'scheduledLeadFollowupReminder'

const AUTO_ASSIGN_MAX_PER_RUN = 40
const AUTO_ASSIGN_DEFAULT_LIMIT = 30
const AUTO_ASSIGN_COOLDOWN_SECONDS = 180

const ESCALATION_MAX_PER_RUN = 200
const ESCALATION_DEFAULT_LIMIT = 150
const ESCALATION_COOLDOWN_SECONDS = 300

const FOLLOWUP_REMINDER_MAX_PER_RUN = 200
const FOLLOWUP_REMINDER_DEFAULT_LIMIT = 100
const FOLLOWUP_REMINDER_COOLDOWN_SECONDS = 300
const FOLLOWUP_REMINDER_REPEAT_HOURS = 6

function safeText(value: unknown): string {
  return String(value ?? '').trim()
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

function isFollowUpDueNow(value: any): boolean {
  const followUpAt = toDate(value)
  if (!followUpAt) return false
  return followUpAt.getTime() <= Date.now()
}

function canSendReminderAgain(lastSentAtValue: any): boolean {
  const lastSentAt = toDate(lastSentAtValue)
  if (!lastSentAt) return true
  const nextAllowed = lastSentAt.getTime() + FOLLOWUP_REMINDER_REPEAT_HOURS * 60 * 60 * 1000
  return Date.now() >= nextAllowed
}

function resolveRequestedLimit(value: unknown, fallback: number, maxLimit: number): number {
  return Math.min(Math.max(Number(value || fallback), 1), maxLimit)
}

function remainingCooldownSeconds(lastRunAt: Date | null, cooldownSeconds: number): number {
  if (!lastRunAt) return 0
  const nextAllowedAt = lastRunAt.getTime() + cooldownSeconds * 1000
  const diffMs = nextAllowedAt - Date.now()
  return diffMs > 0 ? Math.ceil(diffMs / 1000) : 0
}

function buildSafeguardMeta(lastRunAt: Date | null, cooldownSeconds: number, maxPerRun: number) {
  const remainingSeconds = remainingCooldownSeconds(lastRunAt, cooldownSeconds)
  const nextAllowedAt = lastRunAt ? new Date(lastRunAt.getTime() + cooldownSeconds * 1000) : null
  return {
    cooldownSeconds,
    maxPerRun,
    remainingSeconds,
    lastRunAt: lastRunAt ? lastRunAt.toISOString() : null,
    nextAllowedAt: nextAllowedAt ? nextAllowedAt.toISOString() : null,
  }
}

async function getLatestRunForJob(db: FirebaseFirestore.Firestore, officeId: string, job: string) {
  let snap: FirebaseFirestore.QuerySnapshot
  try {
    snap = await db
      .collection('office_automation_runs')
      .where('officeId', '==', officeId)
      .where('job', '==', job)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get()
  } catch {
    snap = await db
      .collection('office_automation_runs')
      .where('officeId', '==', officeId)
      .where('job', '==', job)
      .limit(50)
      .get()
  }

  if (snap.empty) return null
  const doc = snap.docs
    .map((item) => ({ item, createdAt: toDate(item.data()?.createdAt)?.getTime() || 0 }))
    .sort((a, b) => b.createdAt - a.createdAt)[0]?.item
  return (doc?.data() || null) as Record<string, any> | null
}

function extractOwnerAgentId(lead: Record<string, any>): string {
  return safeText(lead.ownerAgentId || lead.assignedTo || lead.assignedTo?.uid)
}

async function getOfficeAgentIds(db: FirebaseFirestore.Firestore, officeId: string, currentUid: string) {
  const [byBrokerId, byBrokerageId] = await Promise.all([
    db.collection('users').where('brokerId', '==', officeId).limit(500).get(),
    db.collection('users').where('brokerageId', '==', officeId).limit(500).get(),
  ])

  const officeAgentIds = new Set<string>()
  for (const snapshot of [byBrokerId, byBrokerageId]) {
    for (const doc of snapshot.docs) {
      const data = doc.data() as Record<string, any>
      const role = safeText(data.role).toLowerCase()
      const status = safeText(data.status).toLowerCase()
      if ((role === 'agent' || role === 'broker') && status !== 'disabled' && status !== 'blocked') {
        officeAgentIds.add(doc.id)
      }
    }
  }
  officeAgentIds.add(currentUid)
  return officeAgentIds
}

async function loadOfficeScopedLeads(db: FirebaseFirestore.Firestore, officeId: string, officeAgentIds: Set<string>) {
  const snap = await db.collection('leads').limit(3000).get()
  return snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, any>) }) as Record<string, any>)
    .filter((lead) => {
      const owner = extractOwnerAgentId(lead)
      const leadOffice = safeText(lead.brokerId || lead.brokerageId)
      if (leadOffice && leadOffice === officeId) return true
      if (owner && officeAgentIds.has(owner)) return true
      return false
    })
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

    const officeAgentIds = await getOfficeAgentIds(db, context.officeId, context.uid)
    const leads = await loadOfficeScopedLeads(db, context.officeId, officeAgentIds)

    const overdueCount = leads.filter((lead) => {
      const stage = normalizeLeadStage(lead.leadStage, lead.status)
      if (isLeadTerminalStage(stage)) return false
      return isSlaBreached(stage, toDate(lead.stageSlaDueAt))
    }).length
    const followUpDueCount = leads.filter((lead) => {
      const stage = normalizeLeadStage(lead.leadStage, lead.status)
      if (isLeadTerminalStage(stage)) return false
      return isFollowUpDueNow(lead.followUpAt || lead.nextFollowUpAt)
    }).length

    const openEscalations = leads.filter((lead) => safeText(lead.escalationStatus).toLowerCase() === 'open').length
    const autoAssignable = leads.filter((lead) => !extractOwnerAgentId(lead) && normalizeLeadStage(lead.leadStage, lead.status) === 'new').length

    const byAgent = new Map<string, { assigned: number; won: number; breached: number }>()
    for (const lead of leads) {
      const ownerId = extractOwnerAgentId(lead)
      if (!ownerId) continue

      const current = byAgent.get(ownerId) || { assigned: 0, won: 0, breached: 0 }
      const stage = normalizeLeadStage(lead.leadStage, lead.status)
      current.assigned += 1
      if (stage === 'won') current.won += 1
      if (isSlaBreached(stage, toDate(lead.stageSlaDueAt))) current.breached += 1
      byAgent.set(ownerId, current)
    }

    let usersSnap: FirebaseFirestore.QuerySnapshot
    try {
      usersSnap = await db
        .collection('users')
        .where('role', 'in', ['agent', 'broker'])
        .where('status', '==', 'active')
        .limit(500)
        .get()
    } catch {
      const [agents, brokers] = await Promise.all([
        db.collection('users').where('role', '==', 'agent').limit(500).get(),
        db.collection('users').where('role', '==', 'broker').limit(500).get(),
      ])
      const mergedDocs = [...agents.docs, ...brokers.docs].filter(
        (doc) => safeText(doc.data()?.status).toLowerCase() === 'active'
      )
      usersSnap = { docs: mergedDocs } as FirebaseFirestore.QuerySnapshot
    }

    const userNameById = new Map<string, string>()
    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data() as Record<string, any>
      if (!officeAgentIds.has(userDoc.id)) continue
      userNameById.set(userDoc.id, safeText(data.name || data.company || data.email || userDoc.id))
    }

    const topBrokers = Array.from(byAgent.entries())
      .map(([ownerId, perf]) => {
        const conversionRate = perf.assigned > 0 ? Number(((perf.won / perf.assigned) * 100).toFixed(1)) : 0
        const slaBreachRate = perf.assigned > 0 ? Number(((perf.breached / perf.assigned) * 100).toFixed(1)) : 0
        return {
          broker: userNameById.get(ownerId) || ownerId,
          assigned: perf.assigned,
          won: perf.won,
          conversionRate,
          slaBreachRate,
        }
      })
      .sort((a, b) => b.conversionRate - a.conversionRate || b.assigned - a.assigned)
      .slice(0, 5)

    let runsSnap: FirebaseFirestore.QuerySnapshot
    try {
      runsSnap = await db
        .collection('office_automation_runs')
        .where('officeId', '==', context.officeId)
        .orderBy('createdAt', 'desc')
        .limit(6)
        .get()
    } catch {
      runsSnap = await db
        .collection('office_automation_runs')
        .where('officeId', '==', context.officeId)
        .limit(100)
        .get()
    }

    const automationRuns = runsSnap.docs.map((doc) => {
      const run = doc.data() as Record<string, any>
      return {
        id: doc.id,
        job: safeText(run.job) || 'scheduledLeadAutoAssign',
        status: safeText(run.status || 'unknown').toLowerCase(),
        scanned: Number(run.scanned || 0),
        assigned: Number(run.assigned || 0),
        escalated: Number(run.escalated || 0),
        reminded: Number(run.reminded || 0),
        durationMs: Number(run.durationMs || 0),
        timestamp: toIso(run.createdAt),
      }
    }).sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()).slice(0, 6)

    const latestAutoAssign = automationRuns.find((run) => run.job === AUTO_ASSIGN_JOB)
    const latestEscalation = automationRuns.find((run) => run.job === ESCALATION_JOB)
    const latestFollowupReminder = automationRuns.find((run) => run.job === FOLLOWUP_REMINDER_JOB)
    const autoAssignLastRunAt = toDate(latestAutoAssign?.timestamp)
    const escalationLastRunAt = toDate(latestEscalation?.timestamp)
    const followupLastRunAt = toDate(latestFollowupReminder?.timestamp)

    return NextResponse.json({
      ok: true,
      data: {
        totalLeads: leads.length,
        autoAssignable,
        overdue: overdueCount,
        followUpDue: followUpDueCount,
        escalationsOpen: openEscalations,
        topBrokers,
        automationRuns,
        safeguards: {
          autoAssign: buildSafeguardMeta(autoAssignLastRunAt, AUTO_ASSIGN_COOLDOWN_SECONDS, AUTO_ASSIGN_MAX_PER_RUN),
          escalation: buildSafeguardMeta(escalationLastRunAt, ESCALATION_COOLDOWN_SECONDS, ESCALATION_MAX_PER_RUN),
          followupReminder: buildSafeguardMeta(followupLastRunAt, FOLLOWUP_REMINDER_COOLDOWN_SECONDS, FOLLOWUP_REMINDER_MAX_PER_RUN),
        },
      },
    })
  } catch (error: any) {
    console.error('[api/broker/leads/automation] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load broker automation analytics' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'broker') {
      return NextResponse.json({ ok: false, error: 'Only brokers can run automation controls' }, { status: 403 })
    }
    if (!context.officeId) {
      return NextResponse.json({ ok: false, error: 'Broker office assignment required' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const action = safeText(body.action).toLowerCase()
    if (action !== 'auto_assign' && action !== 'escalate' && action !== 'followup_reminders') {
      return NextResponse.json({ ok: false, error: 'Invalid automation action' }, { status: 400 })
    }

    const isAutoAssignAction = action === 'auto_assign'
    const isEscalationAction = action === 'escalate'
    const currentJob = isAutoAssignAction
      ? AUTO_ASSIGN_JOB
      : isEscalationAction
        ? ESCALATION_JOB
        : FOLLOWUP_REMINDER_JOB
    const cooldownSeconds = isAutoAssignAction
      ? AUTO_ASSIGN_COOLDOWN_SECONDS
      : isEscalationAction
        ? ESCALATION_COOLDOWN_SECONDS
        : FOLLOWUP_REMINDER_COOLDOWN_SECONDS
    const maxPerRun = isAutoAssignAction
      ? AUTO_ASSIGN_MAX_PER_RUN
      : isEscalationAction
        ? ESCALATION_MAX_PER_RUN
        : FOLLOWUP_REMINDER_MAX_PER_RUN
    const defaultLimit = isAutoAssignAction
      ? AUTO_ASSIGN_DEFAULT_LIMIT
      : isEscalationAction
        ? ESCALATION_DEFAULT_LIMIT
        : FOLLOWUP_REMINDER_DEFAULT_LIMIT

    const latestRun = await getLatestRunForJob(db, context.officeId, currentJob)
    const remainingSeconds = remainingCooldownSeconds(toDate(latestRun?.createdAt), cooldownSeconds)
    if (remainingSeconds > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Cooldown active. Retry in ${remainingSeconds}s`,
          code: 'AUTOMATION_COOLDOWN_ACTIVE',
          retryAfterSeconds: remainingSeconds,
          safeguards: {
            cooldownSeconds,
            maxPerRun,
          },
        },
        { status: 429 }
      )
    }

    const officeAgentIds = await getOfficeAgentIds(db, context.officeId, context.uid)
    const leads = await loadOfficeScopedLeads(db, context.officeId, officeAgentIds)
    const now = Timestamp.now()
    const startedAt = Date.now()
    const requestedLimit = resolveRequestedLimit(body.limit, defaultLimit, maxPerRun)

    if (isAutoAssignAction) {
      const candidates = leads
        .filter((lead) => !extractOwnerAgentId(lead) && normalizeLeadStage(lead.leadStage, lead.status) === 'new')
        .slice(0, requestedLimit)

      if (candidates.length === 0) {
        return NextResponse.json({
          ok: true,
          data: { scanned: 0, assigned: 0, leadIds: [] },
          message: 'No unassigned new leads in your office queue',
        })
      }

      const activeAgents = Array.from(officeAgentIds)
      if (activeAgents.length === 0) {
        return NextResponse.json({ ok: false, error: 'No office agents available for assignment' }, { status: 404 })
      }

      const users = await Promise.all(activeAgents.map((uid) => db.collection('users').doc(uid).get()))
      const assignable = users
        .filter((snap) => snap.exists)
        .map((snap) => {
          const data = (snap.data() || {}) as Record<string, any>
          return {
            id: snap.id,
            role: safeText(data.role).toLowerCase(),
            status: safeText(data.status).toLowerCase(),
            name: safeText(data.name),
            company: safeText(data.company),
            email: safeText(data.email),
          }
        })
        .filter((user) => (user.role === 'agent' || user.role === 'broker') && (user.status === '' || user.status === 'active'))
        .sort((a, b) => safeText(a.name || a.company || a.email).localeCompare(safeText(b.name || b.company || b.email)))

      if (assignable.length === 0) {
        return NextResponse.json({ ok: false, error: 'No active assignable users in office' }, { status: 404 })
      }

      const counterRef = db.collection('counters').doc(`office_lead_assignment_${context.officeId}`)
      const counterSnap = await counterRef.get()
      const lastUid = safeText(counterSnap.data()?.lastAssignedUid)
      let pointer = 0
      if (lastUid) {
        const found = assignable.findIndex((item) => item.id === lastUid)
        pointer = found >= 0 ? (found + 1) % assignable.length : 0
      }

      let assigned = 0
      const assignedLeadIds: string[] = []

      for (const lead of candidates) {
        const assignee = assignable[pointer]
        pointer = (pointer + 1) % assignable.length
        const leadRef = db.collection('leads').doc(lead.id)

        const nextStage = 'assigned'
        await leadRef.set(
          {
            ownerAgentId: assignee.id,
            assignedTo: assignee.id,
            ownerAssignedAt: now,
            ownerAssignedBy: context.uid,
            ownerAssignmentReason: 'office_auto_assign',
            assignedAt: now,
            leadStage: nextStage,
            status: stageToLegacyStatus(nextStage),
            legacyStatus: stageToLegacyStatus(nextStage),
            stageChangedAt: now,
            stageChangedBy: context.uid,
            stageChangeReason: 'office_auto_assign',
            stageSlaDueAt: stageSlaDueAt(nextStage, now.toDate()),
            slaBreached: false,
            slaBreachedAt: null,
            updatedAt: now,
          },
          { merge: true }
        )

        assigned += 1
        assignedLeadIds.push(lead.id)
      }

      const lastAssignee = assignable[(pointer + assignable.length - 1) % assignable.length]
      await counterRef.set({ lastAssignedUid: lastAssignee.id, updatedAt: now }, { merge: true })

      await db.collection('office_automation_runs').add({
        officeId: context.officeId,
        actorUid: context.uid,
        actorRole: context.role,
        job: AUTO_ASSIGN_JOB,
        status: 'success',
        scanned: candidates.length,
        assigned,
        escalated: 0,
        requestedLimit,
        effectiveLimit: requestedLimit,
        durationMs: Date.now() - startedAt,
        createdAt: now,
      })

      return NextResponse.json({
        ok: true,
        data: {
          scanned: candidates.length,
          assigned,
          leadIds: assignedLeadIds,
        },
      })
    }

    if (action === 'followup_reminders') {
      const reminderCandidates = leads
        .filter((lead) => {
          const stage = normalizeLeadStage(lead.leadStage, lead.status)
          if (isLeadTerminalStage(stage)) return false

          if (!isFollowUpDueNow(lead.followUpAt || lead.nextFollowUpAt)) return false

          const ownerUid = extractOwnerAgentId(lead)
          if (!ownerUid) return false
          if (!officeAgentIds.has(ownerUid)) return false

          return canSendReminderAgain(lead.followUpReminderSentAt)
        })
        .slice(0, requestedLimit)

      let reminded = 0
      const remindedLeadIds: string[] = []
      for (const lead of reminderCandidates) {
        const ownerUid = extractOwnerAgentId(lead)
        const stage = normalizeLeadStage(lead.leadStage, lead.status)
        const buyerName = safeText(lead.buyerName || lead.name || lead.fullName || 'Lead')

        await db.collection('notifications').add({
          userId: ownerUid,
          type: 'lead_followup_reminder',
          title: 'Seguimiento pendiente de lead',
          body: `${buyerName} requiere seguimiento (${stage}).`,
          url: '/dashboard',
          data: {
            leadId: lead.id,
            source: 'broker_followup_automation',
            officeId: context.officeId,
          },
          read: false,
          createdAt: now,
          sentAt: null,
        })

        await db.collection('leads').doc(lead.id).set(
          {
            followUpReminderSentAt: now,
            followUpReminderSentBy: context.uid,
            followUpReminderStatus: 'sent',
            followUpReminderSentTo: ownerUid,
            followUpReminderCount: FieldValue.increment(1),
            updatedAt: now,
          },
          { merge: true }
        )

        reminded += 1
        remindedLeadIds.push(lead.id)
      }

      await db.collection('office_automation_runs').add({
        officeId: context.officeId,
        actorUid: context.uid,
        actorRole: context.role,
        job: FOLLOWUP_REMINDER_JOB,
        status: 'success',
        scanned: reminderCandidates.length,
        assigned: 0,
        escalated: 0,
        reminded,
        requestedLimit,
        effectiveLimit: requestedLimit,
        durationMs: Date.now() - startedAt,
        createdAt: now,
      })

      return NextResponse.json({
        ok: true,
        data: {
          scanned: reminderCandidates.length,
          reminded,
          leadIds: remindedLeadIds,
        },
        message: reminded > 0 ? 'Follow-up reminders sent' : 'No overdue follow-up reminders required sending',
      })
    }

    const escalationCandidates = leads
      .filter((lead) => {
        const stage = normalizeLeadStage(lead.leadStage, lead.status)
        if (isLeadTerminalStage(stage)) return false
        if (safeText(lead.escalationStatus).toLowerCase() === 'open') return false
        return isSlaBreached(stage, toDate(lead.stageSlaDueAt))
      })
      .slice(0, requestedLimit)

    let escalated = 0
    const escalatedLeadIds: string[] = []
    for (const lead of escalationCandidates) {
      const leadRef = db.collection('leads').doc(lead.id)
      const currentLevel = Number(lead.escalationLevel || 0)
      await leadRef.set(
        {
          escalationStatus: 'open',
          escalationLevel: currentLevel + 1,
          escalatedAt: now,
          escalatedBy: context.uid,
          escalationReason: 'office_sla_breach',
          escalationOwnerAgentId: extractOwnerAgentId(lead) || null,
          escalationResolvedAt: null,
          escalationResolvedBy: null,
          updatedAt: now,
        },
        { merge: true }
      )

      escalated += 1
      escalatedLeadIds.push(lead.id)
    }

    await db.collection('office_automation_runs').add({
      officeId: context.officeId,
      actorUid: context.uid,
      actorRole: context.role,
      job: ESCALATION_JOB,
      status: 'success',
      scanned: escalationCandidates.length,
      assigned: 0,
      escalated,
      requestedLimit,
      effectiveLimit: requestedLimit,
      durationMs: Date.now() - startedAt,
      createdAt: now,
    })

    return NextResponse.json({
      ok: true,
      data: {
        scanned: escalationCandidates.length,
        escalated,
        leadIds: escalatedLeadIds,
      },
      message: escalated > 0 ? 'Escalation run completed' : 'No SLA-breached leads required escalation',
    })
  } catch (error: any) {
    console.error('[api/broker/leads/automation] POST error', error)
    return NextResponse.json({ ok: false, error: 'Failed to execute broker automation action' }, { status: 500 })
  }
}
