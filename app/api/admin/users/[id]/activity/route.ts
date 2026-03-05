import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type AnyRecord = Record<string, any>

type TimelineEvent = {
  id: string
  source: 'activity_logs' | 'analytics_events'
  eventType: string
  action: string
  timestamp: string | null
  metadata: Record<string, unknown>
}

function toDateSafe(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === 'function') {
    const dt = value.toDate()
    return dt instanceof Date && !Number.isNaN(dt.getTime()) ? dt : null
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function safeText(value: any): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeTimelineEventTypeFromActivity(item: AnyRecord): string {
  const type = safeText(item.type).toLowerCase()
  const action = safeText(item.action).toLowerCase()
  const metadata = (item.metadata || {}) as AnyRecord

  if (type === 'auth' && action === 'login') return 'login'
  if (action.includes('whatsapp') || safeText(metadata.channel).toLowerCase() === 'whatsapp') return 'whatsapp_click'
  if (type === 'property' && (action === 'viewed' || action === 'view')) return 'property_view'
  if (type === 'lead' && (action === 'created' || action === 'lead_created')) return 'lead_created'
  if (action.includes('reservation') && (action.includes('start') || action.includes('initiated'))) return 'reservation_started'
  if (action.includes('reservation') && (action.includes('complete') || action.includes('completed') || action.includes('converted'))) return 'reservation_completed'

  return action || type || 'activity'
}

function normalizeTimelineEventTypeFromAnalytics(item: AnyRecord): string {
  const eventType = safeText(item.eventType || item.event).toLowerCase()
  if (eventType === 'listing_view' || eventType === 'property_card_click') return 'property_view'
  if (eventType === 'lead_create') return 'lead_created'
  if (eventType === 'whatsapp_click') return 'whatsapp_click'
  return eventType || 'analytics_event'
}

async function safeQueryCollection(queryFactory: () => Promise<any>): Promise<AnyRecord[]> {
  try {
    const snap = await queryFactory()
    return snap.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }))
  } catch {
    return []
  }
}

function toTimelineFromActivity(items: AnyRecord[]): TimelineEvent[] {
  return items.map((item) => ({
    id: item.id,
    source: 'activity_logs',
    eventType: normalizeTimelineEventTypeFromActivity(item),
    action: safeText(item.action) || 'activity',
    timestamp: toDateSafe(item.timestamp || item.createdAt)?.toISOString() || null,
    metadata: (item.metadata || {}) as Record<string, unknown>,
  }))
}

function toTimelineFromAnalytics(items: AnyRecord[]): TimelineEvent[] {
  return items.map((item) => ({
    id: item.id,
    source: 'analytics_events',
    eventType: normalizeTimelineEventTypeFromAnalytics(item),
    action: safeText(item.eventType || item.event) || 'analytics_event',
    timestamp: toDateSafe(item.timestamp || item.createdAt)?.toISOString() || null,
    metadata: (item.metadata || {}) as Record<string, unknown>,
  }))
}

function toUnixMs(value: string | null): number {
  if (!value) return 0
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : 0
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const role = String(session.role || '')
    const isAdmin = role === 'master_admin' || role === 'admin'
    const isBroker = role === 'broker'

    if (!isAdmin && !isBroker) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const userId = params.id
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'User id required' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const [targetSnap, actorSnap] = await Promise.all([
      adminDb.collection('users').doc(userId).get(),
      adminDb.collection('users').doc(session.uid).get(),
    ])

    if (!targetSnap.exists) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    if (isBroker) {
      const actor = actorSnap.data() || {}
      const target = targetSnap.data() || {}
      const actorBrokerage = String(actor.brokerage_id || actor.brokerageId || actor.brokerage || actor.company || '').trim().toLowerCase()
      const targetBrokerage = String(target.brokerage_id || target.brokerageId || target.brokerage || target.company || '').trim().toLowerCase()
      if (!actorBrokerage || !targetBrokerage || actorBrokerage !== targetBrokerage) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
      }
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100)
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const eventTypeFilter = safeText(searchParams.get('eventType')).toLowerCase()

    const [activityByUserId, activityByEntityId, analyticsByUserId] = await Promise.all([
      safeQueryCollection(() =>
        adminDb.collection('activity_logs').where('userId', '==', userId).orderBy('timestamp', 'desc').limit(300).get()
      ),
      safeQueryCollection(() =>
        adminDb.collection('activity_logs').where('entityId', '==', userId).orderBy('timestamp', 'desc').limit(300).get()
      ),
      safeQueryCollection(() =>
        adminDb.collection('analytics_events').where('userId', '==', userId).orderBy('timestamp', 'desc').limit(300).get()
      ),
    ])

    const dedupActivityMap = new Map<string, AnyRecord>()
    for (const item of [...activityByUserId, ...activityByEntityId]) {
      if (!dedupActivityMap.has(item.id)) dedupActivityMap.set(item.id, item)
    }

    const timeline = [
      ...toTimelineFromActivity(Array.from(dedupActivityMap.values())),
      ...toTimelineFromAnalytics(analyticsByUserId),
    ]
      .filter((item) => {
        if (!eventTypeFilter || eventTypeFilter === 'all') return true
        return item.eventType.toLowerCase() === eventTypeFilter
      })
      .sort((a, b) => toUnixMs(b.timestamp) - toUnixMs(a.timestamp))

    const total = timeline.length
    const start = (page - 1) * limit
    const end = start + limit
    const rows = timeline.slice(start, end)

    return NextResponse.json({
      ok: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        hasMore: end < total,
      },
      filters: {
        eventType: eventTypeFilter || 'all',
      },
    })
  } catch (error: any) {
    console.error('[admin/users/:id/activity] error:', error?.message)
    return NextResponse.json(
      { ok: false, error: 'Failed to load user activity timeline' },
      { status: 500 }
    )
  }
}
