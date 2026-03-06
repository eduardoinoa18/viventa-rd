import { NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

type SchedulerJobKey = 'auto_assign' | 'escalate' | 'followup_reminders'

type SchedulerJobConfig = {
  enabled: boolean
  intervalMinutes: number
  limit: number
}

type SchedulerConfig = {
  enabled: boolean
  windowStart: string
  windowEnd: string
  jobs: Record<SchedulerJobKey, SchedulerJobConfig>
}

const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  enabled: false,
  windowStart: '08:00',
  windowEnd: '20:00',
  jobs: {
    auto_assign: { enabled: true, intervalMinutes: 15, limit: 30 },
    escalate: { enabled: true, intervalMinutes: 30, limit: 120 },
    followup_reminders: { enabled: true, intervalMinutes: 20, limit: 100 },
  },
}

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.min(max, Math.max(min, Math.round(num)))
}

function isValidTime(value: unknown): boolean {
  const text = safeText(value)
  if (!text) return false
  const parts = text.split(':')
  if (parts.length !== 2) return false
  const hour = Number(parts[0])
  const minute = Number(parts[1])
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return false
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

function normalizeSchedulerConfig(input: any): SchedulerConfig {
  const source = (input && typeof input === 'object' ? input : {}) as Partial<SchedulerConfig>
  const jobs = (source.jobs && typeof source.jobs === 'object' ? source.jobs : {}) as Partial<Record<SchedulerJobKey, Partial<SchedulerJobConfig>>>

  return {
    enabled: Boolean(source.enabled),
    windowStart: isValidTime(source.windowStart) ? safeText(source.windowStart) : DEFAULT_SCHEDULER_CONFIG.windowStart,
    windowEnd: isValidTime(source.windowEnd) ? safeText(source.windowEnd) : DEFAULT_SCHEDULER_CONFIG.windowEnd,
    jobs: {
      auto_assign: {
        enabled: Boolean(jobs.auto_assign?.enabled ?? DEFAULT_SCHEDULER_CONFIG.jobs.auto_assign.enabled),
        intervalMinutes: clampNumber(jobs.auto_assign?.intervalMinutes, 5, 1440, DEFAULT_SCHEDULER_CONFIG.jobs.auto_assign.intervalMinutes),
        limit: clampNumber(jobs.auto_assign?.limit, 1, 300, DEFAULT_SCHEDULER_CONFIG.jobs.auto_assign.limit),
      },
      escalate: {
        enabled: Boolean(jobs.escalate?.enabled ?? DEFAULT_SCHEDULER_CONFIG.jobs.escalate.enabled),
        intervalMinutes: clampNumber(jobs.escalate?.intervalMinutes, 5, 1440, DEFAULT_SCHEDULER_CONFIG.jobs.escalate.intervalMinutes),
        limit: clampNumber(jobs.escalate?.limit, 1, 300, DEFAULT_SCHEDULER_CONFIG.jobs.escalate.limit),
      },
      followup_reminders: {
        enabled: Boolean(jobs.followup_reminders?.enabled ?? DEFAULT_SCHEDULER_CONFIG.jobs.followup_reminders.enabled),
        intervalMinutes: clampNumber(jobs.followup_reminders?.intervalMinutes, 5, 1440, DEFAULT_SCHEDULER_CONFIG.jobs.followup_reminders.intervalMinutes),
        limit: clampNumber(jobs.followup_reminders?.limit, 1, 300, DEFAULT_SCHEDULER_CONFIG.jobs.followup_reminders.limit),
      },
    },
  }
}

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'broker') {
      return NextResponse.json({ ok: false, error: 'Only brokers can manage automation scheduler' }, { status: 403 })
    }
    if (!context.officeId) {
      return NextResponse.json({ ok: false, error: 'Broker office assignment required' }, { status: 403 })
    }

    const ref = db.collection('office_automation_settings').doc(context.officeId)
    const snap = await ref.get()
    const raw = snap.exists ? (snap.data() as Record<string, any>) : null
    const config = normalizeSchedulerConfig(raw?.scheduler)

    return NextResponse.json({
      ok: true,
      config,
      updatedAt: raw?.updatedAt?.toDate?.()?.toISOString?.() || null,
    })
  } catch (error: any) {
    console.error('[api/broker/leads/automation/scheduler] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load scheduler config' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'broker') {
      return NextResponse.json({ ok: false, error: 'Only brokers can manage automation scheduler' }, { status: 403 })
    }
    if (!context.officeId) {
      return NextResponse.json({ ok: false, error: 'Broker office assignment required' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const config = normalizeSchedulerConfig(body?.config)

    const now = Timestamp.now()
    const ref = db.collection('office_automation_settings').doc(context.officeId)
    await ref.set(
      {
        officeId: context.officeId,
        scheduler: config,
        updatedAt: now,
        updatedBy: context.uid,
        createdAt: now,
      },
      { merge: true }
    )

    return NextResponse.json({ ok: true, config })
  } catch (error: any) {
    console.error('[api/broker/leads/automation/scheduler] PATCH error', error)
    return NextResponse.json({ ok: false, error: 'Failed to save scheduler config' }, { status: 500 })
  }
}
