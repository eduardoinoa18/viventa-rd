import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { emitActivityEvent } from '@/lib/activityEvents'
import {
  getUnifiedDealAgeDays,
  getUnifiedDealHealth,
  normalizeBrokerDealTimelineStage,
  normalizeConstructoraDealTimelineStage,
} from '@/lib/domain/unifiedDeal'

export const dynamic = 'force-dynamic'

const SYSTEM_ACTOR_ID = 'system:deal-automation'
const ALERT_REPEAT_HOURS = 24
const MAX_BROKER_ALERTS_PER_RUN = 120
const MAX_CONSTRUCTORA_ALERTS_PER_RUN = 120
const MAX_BROKER_TASKS_PER_RUN = 80
const MAX_CONSTRUCTORA_TASKS_PER_RUN = 80
const TASK_REPEAT_HOURS = 24

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

function shouldEmitAlert(lastStatus: string, lastAt: Date | null, nextStatus: 'attention' | 'overdue'): boolean {
  if (!lastStatus) return true
  if (lastStatus !== nextStatus) return true
  if (!lastAt) return true
  const nextAllowedAt = lastAt.getTime() + ALERT_REPEAT_HOURS * 60 * 60 * 1000
  return Date.now() >= nextAllowedAt
}

function shouldCreateTask(lastStatus: string, lastAt: Date | null, nextStatus: 'attention' | 'overdue'): boolean {
  if (!lastStatus) return true
  if (lastStatus !== nextStatus) return true
  if (!lastAt) return true
  const nextAllowedAt = lastAt.getTime() + TASK_REPEAT_HOURS * 60 * 60 * 1000
  return Date.now() >= nextAllowedAt
}

function isTaskOpen(status: unknown): boolean {
  const normalized = safeText(status).toLowerCase()
  return normalized !== 'done' && normalized !== 'closed' && normalized !== 'cancelled'
}

function resolvePreferredAssigneeIds(tx: Record<string, any>): string[] {
  const result: string[] = []
  const push = (value: unknown) => {
    const uid = safeText(value)
    if (uid && !result.includes(uid)) result.push(uid)
  }

  push(tx.agentId)
  push(tx.ownerAgentId)
  push(tx.assignedTo)
  push(tx.brokerId)
  return result
}

function resolvePreferredConstructoraAssigneeIds(deal: Record<string, any>): string[] {
  const result: string[] = []
  const push = (value: unknown) => {
    const uid = safeText(value)
    if (uid && !result.includes(uid)) result.push(uid)
  }

  push(deal.updatedBy)
  push(deal.createdBy)
  push(deal.ownerId)
  push(deal.constructoraUserId)
  return result
}

async function getOfficeMemberIds(db: FirebaseFirestore.Firestore, officeId: string): Promise<Set<string>> {
  const [byBrokerId, byBrokerageId] = await Promise.all([
    db.collection('users').where('brokerId', '==', officeId).limit(500).get(),
    db.collection('users').where('brokerageId', '==', officeId).limit(500).get(),
  ])

  const memberIds = new Set<string>()
  for (const snap of [byBrokerId, byBrokerageId]) {
    for (const doc of snap.docs) {
      const user = doc.data() as Record<string, any>
      const role = safeText(user.role).toLowerCase()
      const status = safeText(user.status).toLowerCase()
      if ((role === 'agent' || role === 'broker') && status !== 'disabled' && status !== 'blocked') {
        memberIds.add(doc.id)
      }
    }
  }

  return memberIds
}

async function getOfficeOpenTaskCounts(
  db: FirebaseFirestore.Firestore,
  officeId: string
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()

  let snap: FirebaseFirestore.QuerySnapshot
  try {
    snap = await db
      .collection('office_crm_tasks')
      .where('officeId', '==', officeId)
      .orderBy('createdAt', 'desc')
      .limit(2000)
      .get()
  } catch {
    snap = await db.collection('office_crm_tasks').where('officeId', '==', officeId).limit(2000).get()
  }

  for (const doc of snap.docs) {
    const task = doc.data() as Record<string, any>
    if (!isTaskOpen(task.status)) continue
    const assigneeUid = safeText(task.assigneeUid)
    if (!assigneeUid) continue
    counts.set(assigneeUid, (counts.get(assigneeUid) || 0) + 1)
  }

  return counts
}

async function getConstructoraMemberIds(
  db: FirebaseFirestore.Firestore,
  constructoraCode: string
): Promise<Set<string>> {
  const [byConstructoraCode, byProfessionalCode] = await Promise.all([
    db.collection('users').where('constructoraCode', '==', constructoraCode).limit(500).get(),
    db.collection('users').where('professionalCode', '==', constructoraCode).limit(500).get(),
  ])

  const memberIds = new Set<string>()
  for (const snap of [byConstructoraCode, byProfessionalCode]) {
    for (const doc of snap.docs) {
      const user = doc.data() as Record<string, any>
      const role = safeText(user.role).toLowerCase()
      const status = safeText(user.status).toLowerCase()
      if (role === 'constructora' && status !== 'disabled' && status !== 'blocked') {
        memberIds.add(doc.id)
      }
    }
  }

  return memberIds
}

async function getConstructoraOpenTaskCounts(
  db: FirebaseFirestore.Firestore,
  constructoraCode: string
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()

  let snap: FirebaseFirestore.QuerySnapshot
  try {
    snap = await db
      .collection('constructora_crm_tasks')
      .where('constructoraCode', '==', constructoraCode)
      .orderBy('createdAt', 'desc')
      .limit(2000)
      .get()
  } catch {
    snap = await db
      .collection('constructora_crm_tasks')
      .where('constructoraCode', '==', constructoraCode)
      .limit(2000)
      .get()
  }

  for (const doc of snap.docs) {
    const task = doc.data() as Record<string, any>
    if (!isTaskOpen(task.status)) continue
    const assigneeUid = safeText(task.assigneeUid)
    if (!assigneeUid) continue
    counts.set(assigneeUid, (counts.get(assigneeUid) || 0) + 1)
  }

  return counts
}

function chooseTaskAssignee(params: {
  officeMemberIds: Set<string>
  preferredAssigneeIds: string[]
  openTaskCountByAssignee: Map<string, number>
}): string | null {
  const { officeMemberIds, preferredAssigneeIds, openTaskCountByAssignee } = params
  const candidates = Array.from(officeMemberIds)
  if (!candidates.length) return null

  let minAssignee = candidates[0]
  let minCount = openTaskCountByAssignee.get(minAssignee) || 0
  for (const candidate of candidates) {
    const count = openTaskCountByAssignee.get(candidate) || 0
    if (count < minCount) {
      minCount = count
      minAssignee = candidate
    }
  }

  for (const preferred of preferredAssigneeIds) {
    if (!officeMemberIds.has(preferred)) continue
    const preferredCount = openTaskCountByAssignee.get(preferred) || 0
    if (preferredCount <= minCount + 2) return preferred
  }

  return minAssignee
}

function assertCronSecret(req: NextRequest) {
  if (req.headers.get('x-vercel-cron')) return true
  const required = process.env.CRON_SECRET
  if (!required) return true
  const provided = req.headers.get('x-cron-secret') || req.headers.get('x-vercel-signature')
  return provided === required
}

export async function GET(req: NextRequest) {
  try {
    if (!assertCronSecret(req)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const now = new Date()

    const [transactionsSnap, constructoraDealsSnap] = await Promise.all([
      db.collection('transactions').limit(4000).get(),
      db.collection('deals').limit(4000).get(),
    ])

    let brokerChecked = 0
    let brokerAlerted = 0
    let brokerOverdue = 0
    let brokerAttention = 0
    let brokerTasksCreated = 0

    const officeMembersByOfficeId = new Map<string, Set<string>>()
    const openTaskCountByOfficeId = new Map<string, Map<string, number>>()

    for (const doc of transactionsSnap.docs) {
      const tx = doc.data() as Record<string, any>
      const stage = normalizeBrokerDealTimelineStage(tx.stage)
      const health = getUnifiedDealHealth(stage, tx.updatedAt || tx.createdAt, now)
      const stageAgeDays = getUnifiedDealAgeDays(tx.updatedAt || tx.createdAt, now)
      const officeId = safeText(tx.officeId)

      if (!officeId) continue
      brokerChecked += 1

      await doc.ref.set(
        {
          dealHealthStatus: health,
          dealStageAgeDays: stageAgeDays,
          dealHealthCheckedAt: now,
        },
        { merge: true }
      )

      if ((health !== 'attention' && health !== 'overdue') || brokerAlerted >= MAX_BROKER_ALERTS_PER_RUN) {
        continue
      }

      const lastAlertStatus = safeText(tx.dealHealthAlertStatus)
      const lastAlertAt = toDate(tx.dealHealthAlertAt)
      const nextStatus = health === 'overdue' ? 'overdue' : 'attention'
      if (!shouldEmitAlert(lastAlertStatus, lastAlertAt, nextStatus)) continue

      if (nextStatus === 'overdue') brokerOverdue += 1
      else brokerAttention += 1

      const dealId = safeText(tx.dealId) || doc.id
      await emitActivityEvent(db, {
        type: 'deal_updated',
        actorId: SYSTEM_ACTOR_ID,
        actorRole: 'system',
        entityType: 'transaction',
        entityId: doc.id,
        transactionId: doc.id,
        dealId,
        listingId: safeText(tx.propertyId || tx.listingId) || null,
        projectId: safeText(tx.projectId) || null,
        brokerId: safeText(tx.brokerId) || null,
        agentId: safeText(tx.agentId) || null,
        officeId,
        metadata: {
          alertType: `deal_${nextStatus}`,
          stage,
          stageAgeDays,
          salePrice: Number(tx.salePrice || 0),
          fromAutomation: true,
        },
      })

      await doc.ref.set(
        {
          dealHealthAlertStatus: nextStatus,
          dealHealthAlertAt: now,
        },
        { merge: true }
      )

      if (brokerTasksCreated < MAX_BROKER_TASKS_PER_RUN) {
        const lastTaskStatus = safeText(tx.dealHealthTaskStatus)
        const lastTaskAt = toDate(tx.dealHealthTaskAt)
        if (shouldCreateTask(lastTaskStatus, lastTaskAt, nextStatus)) {
          let officeMemberIds = officeMembersByOfficeId.get(officeId)
          if (!officeMemberIds) {
            officeMemberIds = await getOfficeMemberIds(db, officeId)
            officeMembersByOfficeId.set(officeId, officeMemberIds)
          }

          let openTaskCountByAssignee = openTaskCountByOfficeId.get(officeId)
          if (!openTaskCountByAssignee) {
            openTaskCountByAssignee = await getOfficeOpenTaskCounts(db, officeId)
            openTaskCountByOfficeId.set(officeId, openTaskCountByAssignee)
          }

          const assigneeUid = chooseTaskAssignee({
            officeMemberIds,
            preferredAssigneeIds: resolvePreferredAssigneeIds(tx),
            openTaskCountByAssignee,
          })

          if (assigneeUid) {
            const dueAt = new Date(now.getTime() + (nextStatus === 'overdue' ? 6 : 12) * 60 * 60 * 1000)
            const priority = nextStatus === 'overdue' ? 'high' : 'normal'
            const taskRef = await db.collection('office_crm_tasks').add({
              officeId,
              title:
                nextStatus === 'overdue'
                  ? `Escalar deal vencido (${dealId})`
                  : `Revisar deal en riesgo (${dealId})`,
              dueAt,
              status: 'pending',
              priority,
              assigneeUid,
              createdBy: SYSTEM_ACTOR_ID,
              createdAt: now,
              updatedAt: now,
              linkedDealId: dealId,
              linkedTransactionId: doc.id,
              source: 'deal_automation',
              metadata: {
                dealId,
                transactionId: doc.id,
                dealHealthStatus: nextStatus,
                stage,
                stageAgeDays,
              },
            })

            await doc.ref.set(
              {
                dealHealthTaskStatus: nextStatus,
                dealHealthTaskAt: now,
                dealHealthTaskId: taskRef.id,
                dealHealthTaskAssigneeUid: assigneeUid,
              },
              { merge: true }
            )

            openTaskCountByAssignee.set(assigneeUid, (openTaskCountByAssignee.get(assigneeUid) || 0) + 1)
            brokerTasksCreated += 1

            await emitActivityEvent(db, {
              type: 'deal_updated',
              actorId: SYSTEM_ACTOR_ID,
              actorRole: 'system',
              entityType: 'transaction',
              entityId: doc.id,
              transactionId: doc.id,
              dealId,
              listingId: safeText(tx.propertyId || tx.listingId) || null,
              projectId: safeText(tx.projectId) || null,
              brokerId: safeText(tx.brokerId) || null,
              agentId: assigneeUid,
              officeId,
              metadata: {
                alertType: `deal_${nextStatus}_task_created`,
                stage,
                stageAgeDays,
                taskId: taskRef.id,
                assigneeUid,
                fromAutomation: true,
              },
            })
          }
        }
      }

      brokerAlerted += 1
    }

    let constructoraChecked = 0
    let constructoraAlerted = 0
    let constructoraOverdue = 0
    let constructoraAttention = 0
    let constructoraTasksCreated = 0

    const constructoraMembersByCode = new Map<string, Set<string>>()
    const openTaskCountByConstructoraCode = new Map<string, Map<string, number>>()

    for (const doc of constructoraDealsSnap.docs) {
      const deal = doc.data() as Record<string, any>
      const timelineStage = normalizeConstructoraDealTimelineStage(deal.status)
      const health = getUnifiedDealHealth(timelineStage, deal.updatedAt || deal.createdAt, now)
      const stageAgeDays = getUnifiedDealAgeDays(deal.updatedAt || deal.createdAt, now)
      const constructoraCode = safeText(deal.constructoraCode)

      if (!constructoraCode) continue
      constructoraChecked += 1

      await doc.ref.set(
        {
          dealHealthStatus: health,
          dealStageAgeDays: stageAgeDays,
          dealHealthCheckedAt: now,
        },
        { merge: true }
      )

      if ((health !== 'attention' && health !== 'overdue') || constructoraAlerted >= MAX_CONSTRUCTORA_ALERTS_PER_RUN) {
        continue
      }

      const lastAlertStatus = safeText(deal.dealHealthAlertStatus)
      const lastAlertAt = toDate(deal.dealHealthAlertAt)
      const nextStatus = health === 'overdue' ? 'overdue' : 'attention'
      if (!shouldEmitAlert(lastAlertStatus, lastAlertAt, nextStatus)) continue

      if (nextStatus === 'overdue') constructoraOverdue += 1
      else constructoraAttention += 1

      await emitActivityEvent(db, {
        type: 'deal_updated',
        actorId: SYSTEM_ACTOR_ID,
        actorRole: 'system',
        entityType: 'deal',
        entityId: doc.id,
        dealId: doc.id,
        reservationId: safeText(deal.reservationId) || null,
        unitId: safeText(deal.unitId) || null,
        projectId: safeText(deal.projectId) || null,
        brokerId: safeText(deal.brokerId) || null,
        buyerId: safeText(deal.buyerId) || null,
        constructoraCode,
        metadata: {
          alertType: `deal_${nextStatus}`,
          stage: timelineStage,
          stageAgeDays,
          price: Number(deal.price || 0),
          fromAutomation: true,
        },
      })

      await doc.ref.set(
        {
          dealHealthAlertStatus: nextStatus,
          dealHealthAlertAt: now,
        },
        { merge: true }
      )

      if (constructoraTasksCreated < MAX_CONSTRUCTORA_TASKS_PER_RUN) {
        const lastTaskStatus = safeText(deal.dealHealthTaskStatus)
        const lastTaskAt = toDate(deal.dealHealthTaskAt)
        if (shouldCreateTask(lastTaskStatus, lastTaskAt, nextStatus)) {
          let constructoraMemberIds = constructoraMembersByCode.get(constructoraCode)
          if (!constructoraMemberIds) {
            constructoraMemberIds = await getConstructoraMemberIds(db, constructoraCode)
            constructoraMembersByCode.set(constructoraCode, constructoraMemberIds)
          }

          let openTaskCountByAssignee = openTaskCountByConstructoraCode.get(constructoraCode)
          if (!openTaskCountByAssignee) {
            openTaskCountByAssignee = await getConstructoraOpenTaskCounts(db, constructoraCode)
            openTaskCountByConstructoraCode.set(constructoraCode, openTaskCountByAssignee)
          }

          const assigneeUid = chooseTaskAssignee({
            officeMemberIds: constructoraMemberIds,
            preferredAssigneeIds: resolvePreferredConstructoraAssigneeIds(deal),
            openTaskCountByAssignee,
          })

          if (assigneeUid) {
            const dueAt = new Date(now.getTime() + (nextStatus === 'overdue' ? 6 : 12) * 60 * 60 * 1000)
            const priority = nextStatus === 'overdue' ? 'high' : 'normal'
            const taskRef = await db.collection('constructora_crm_tasks').add({
              constructoraCode,
              title:
                nextStatus === 'overdue'
                  ? `Escalar deal vencido (${doc.id})`
                  : `Revisar deal en riesgo (${doc.id})`,
              dueAt,
              status: 'pending',
              priority,
              assigneeUid,
              createdBy: SYSTEM_ACTOR_ID,
              createdAt: now,
              updatedAt: now,
              linkedDealId: doc.id,
              source: 'deal_automation',
              metadata: {
                dealId: doc.id,
                dealHealthStatus: nextStatus,
                stage: timelineStage,
                stageAgeDays,
              },
            })

            await doc.ref.set(
              {
                dealHealthTaskStatus: nextStatus,
                dealHealthTaskAt: now,
                dealHealthTaskId: taskRef.id,
                dealHealthTaskAssigneeUid: assigneeUid,
              },
              { merge: true }
            )

            openTaskCountByAssignee.set(assigneeUid, (openTaskCountByAssignee.get(assigneeUid) || 0) + 1)
            constructoraTasksCreated += 1

            await emitActivityEvent(db, {
              type: 'deal_updated',
              actorId: SYSTEM_ACTOR_ID,
              actorRole: 'system',
              entityType: 'deal',
              entityId: doc.id,
              dealId: doc.id,
              reservationId: safeText(deal.reservationId) || null,
              unitId: safeText(deal.unitId) || null,
              projectId: safeText(deal.projectId) || null,
              brokerId: safeText(deal.brokerId) || null,
              buyerId: safeText(deal.buyerId) || null,
              constructoraCode,
              metadata: {
                alertType: `deal_${nextStatus}_task_created`,
                stage: timelineStage,
                stageAgeDays,
                taskId: taskRef.id,
                assigneeUid,
                fromAutomation: true,
              },
            })
          }
        }
      }

      constructoraAlerted += 1
    }

    const runRef = await db.collection('deal_automation_runs').add({
      createdAt: now,
      actorId: SYSTEM_ACTOR_ID,
      checked: {
        broker: brokerChecked,
        constructora: constructoraChecked,
      },
      alerts: {
        broker: brokerAlerted,
        brokerOverdue,
        brokerAttention,
        brokerTasksCreated,
        constructora: constructoraAlerted,
        constructoraOverdue,
        constructoraAttention,
        constructoraTasksCreated,
      },
      limits: {
        broker: MAX_BROKER_ALERTS_PER_RUN,
        constructora: MAX_CONSTRUCTORA_ALERTS_PER_RUN,
        brokerTasks: MAX_BROKER_TASKS_PER_RUN,
        constructoraTasks: MAX_CONSTRUCTORA_TASKS_PER_RUN,
      },
    })

    return NextResponse.json({
      ok: true,
      runId: runRef.id,
      checked: {
        broker: brokerChecked,
        constructora: constructoraChecked,
      },
      alerts: {
        broker: brokerAlerted,
        brokerOverdue,
        brokerAttention,
        brokerTasksCreated,
        constructora: constructoraAlerted,
        constructoraOverdue,
        constructoraAttention,
        constructoraTasksCreated,
      },
    })
  } catch (error: any) {
    console.error('[api/admin/deals/automation] GET error', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to run deal automation' }, { status: 500 })
  }
}