import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'
import { toActivityEvent } from '@/lib/activityEvents'

export const dynamic = 'force-dynamic'

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

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    const role = safeLower(context.role)

    const { searchParams } = new URL(req.url)
    const dealId = safeText(searchParams.get('dealId') || '')
    const typeFilter = safeLower(searchParams.get('type') || '')
    const entityType = safeLower(searchParams.get('entityType') || '')
    const entityId = safeText(searchParams.get('entityId') || '')
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 80), 1), 300)

    const snap = await db.collection('activityEvents').limit(1000).get()

    const scopedCode = safeText(context.constructoraCode || context.professionalCode || context.uid)
    const officeId = safeText(context.officeId)

    let events = snap.docs
      .map((doc) => toActivityEvent(doc.id, doc.data() as Record<string, any>))
      .filter((event) => {
        if (role === 'master_admin' || role === 'admin') return true
        if (role === 'constructora') {
          return safeText(event.constructoraCode) === scopedCode
        }
        if (role === 'broker' || role === 'agent') {
          if (!officeId) return safeText(event.actorId) === context.uid
          return safeText(event.officeId) === officeId || safeText(event.actorId) === context.uid
        }
        return safeText(event.actorId) === context.uid || safeText(event.buyerId) === context.uid
      })

    if (typeFilter) events = events.filter((event) => safeLower(event.type) === typeFilter)
    if (dealId) events = events.filter((event) => safeText(event.dealId) === dealId)
    if (entityType) events = events.filter((event) => safeLower(event.entityType) === entityType)
    if (entityId) events = events.filter((event) => safeText(event.entityId) === entityId)

    events.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))

    return NextResponse.json({ ok: true, events: events.slice(0, limit), total: events.length })
  } catch (error: any) {
    console.error('[api/activity-events] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load activity events' }, { status: 500 })
  }
}
