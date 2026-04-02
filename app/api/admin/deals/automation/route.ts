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

      brokerAlerted += 1
    }

    let constructoraChecked = 0
    let constructoraAlerted = 0
    let constructoraOverdue = 0
    let constructoraAttention = 0

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
        constructora: constructoraAlerted,
        constructoraOverdue,
        constructoraAttention,
      },
      limits: {
        broker: MAX_BROKER_ALERTS_PER_RUN,
        constructora: MAX_CONSTRUCTORA_ALERTS_PER_RUN,
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
        constructora: constructoraAlerted,
        constructoraOverdue,
        constructoraAttention,
      },
    })
  } catch (error: any) {
    console.error('[api/admin/deals/automation] GET error', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to run deal automation' }, { status: 500 })
  }
}