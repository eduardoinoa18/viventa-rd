import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

function noStoreJson(body: any, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

type ActivityEventRow = {
  id: string
  createdAt?: unknown
  type?: unknown
  actorId?: unknown
  buyerId?: unknown
  officeId?: unknown
  constructoraCode?: unknown
} & Record<string, unknown>

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function safeLower(value: unknown): string {
  return safeText(value).toLowerCase()
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

async function getScopedEvents(req: Request) {
  const db = getAdminDb()
  if (!db) return { error: noStoreJson({ ok: false, error: 'Server config error' }, { status: 500 }) }

  const session = await getSessionFromRequest(req)
  if (!session?.uid) return { error: noStoreJson({ ok: false, error: 'Authentication required' }, { status: 401 }) }

  const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
  const role = safeLower(context.role)

  const eventsSnap = await db.collection('activityEvents').limit(3000).get()
  const allEvents: ActivityEventRow[] = eventsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))

  const scopedCode = safeText(context.constructoraCode || context.professionalCode || context.uid)
  const officeId = safeText(context.officeId)

  const events: ActivityEventRow[] = allEvents.filter((event) => {
    if (role === 'master_admin' || role === 'admin') return true
    if (role === 'constructora') return safeText(event.constructoraCode) === scopedCode
    if (role === 'broker' || role === 'agent') {
      if (!officeId) return safeText(event.actorId) === context.uid
      return safeText(event.officeId) === officeId || safeText(event.actorId) === context.uid
    }
    return safeText(event.actorId) === context.uid || safeText(event.buyerId) === context.uid
  })

  return { db, session, context, role, events }
}

export async function GET(req: Request) {
  try {
    const scoped = await getScopedEvents(req)
    if ('error' in scoped) return scoped.error

    const now = Date.now()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStartMs = todayStart.getTime()

    const userDoc = await scoped.db.collection('users').doc(scoped.session.uid).get()
    const userData = (userDoc.data() || {}) as Record<string, any>
    const lastSeenMs = toMillis(userData.lastActivitySeenAt || userData.activityLastSeenAt || userData.lastSeen || null)

    const todayEvents = scoped.events.filter((event) => toMillis(event.createdAt) >= todayStartMs)
    const unreadActivity = scoped.events.filter((event) => toMillis(event.createdAt) > lastSeenMs).length

    const todayDealsOpened = todayEvents.filter((event) => safeLower(event.type) === 'deal_opened').length
    const todayReservations = todayEvents.filter((event) => safeLower(event.type) === 'reservation_created').length
    const todayDocuments = todayEvents.filter((event) => ['document_uploaded', 'document_deleted'].includes(safeLower(event.type))).length
    const todayTransactions = todayEvents.filter((event) => safeLower(event.type) === 'transaction_created').length

    const personalUnreadSnap = await scoped.db
      .collection('notifications')
      .where('userId', '==', scoped.session.uid)
      .where('read', '==', false)
      .limit(500)
      .get()

    const audiences = new Set<string>(['all'])
    if (scoped.role) {
      audiences.add(scoped.role)
      if (scoped.role === 'master_admin') {
        audiences.add('admin')
        audiences.add('master_admin')
      }
    }

    const broadcastUnreadSnap = await scoped.db
      .collection('notifications')
      .where('audience', 'array-contains-any', Array.from(audiences))
      .limit(500)
      .get()

    let broadcastUnread = 0
    for (const doc of broadcastUnreadSnap.docs) {
      const data = doc.data() as Record<string, any>
      const readBy = Array.isArray(data.readBy) ? data.readBy : []
      if (!readBy.includes(scoped.session.uid)) broadcastUnread += 1
    }

    return noStoreJson({
      ok: true,
      summary: {
        unreadNotifications: personalUnreadSnap.size + broadcastUnread,
        unreadActivity,
        todayDealsOpened,
        todayReservations,
        todayDocuments,
        todayTransactions,
        generatedAt: now,
      },
    })
  } catch (error: any) {
    console.error('[api/activity-events/summary] GET error', error)
    return noStoreJson({ ok: false, error: 'Failed to load activity summary' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const scoped = await getScopedEvents(req)
    if ('error' in scoped) return scoped.error

    const body = await req.json().catch(() => ({}))
    const action = safeLower(body?.action || 'markSeen')
    if (action !== 'markseen') {
      return noStoreJson({ ok: false, error: 'Unsupported action' }, { status: 400 })
    }

    const now = new Date()

    await scoped.db.collection('users').doc(scoped.session.uid).set({
      lastActivitySeenAt: now,
    }, { merge: true })

    return noStoreJson({ ok: true })
  } catch (error: any) {
    console.error('[api/activity-events/summary] PATCH error', error)
    return noStoreJson({ ok: false, error: 'Failed to update activity last seen' }, { status: 500 })
  }
}
