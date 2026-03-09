import { NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function toNumber(value: unknown, fallback: number, min: number, max: number) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.min(max, Math.max(min, Math.round(num)))
}

function toIso(value: any): string | null {
  if (!value) return null
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return date instanceof Date ? date.toISOString() : null
  }
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null
}

function ensureAdminRole(role: string) {
  const normalized = safeText(role).toLowerCase()
  return normalized === 'master_admin' || normalized === 'admin'
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })
    if (!ensureAdminRole(String(session.role || ''))) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const id = safeText(params?.id)
    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

    const snap = await db.collection('broker_offices').doc(id).get()
    if (!snap.exists) return NextResponse.json({ ok: false, error: 'Office not found' }, { status: 404 })

    const data = snap.data() as Record<string, any>
    const office = {
      id: snap.id,
      name: safeText(data.name),
      slug: safeText(data.slug),
      officeCode: safeText(data.officeCode || snap.id),
      brokerageId: safeText(data.brokerageId),
      brokerageName: safeText(data.brokerageName),
      city: safeText(data.city),
      province: safeText(data.province),
      status: safeText(data.status || 'active').toLowerCase() || 'active',
      subscription: {
        plan: safeText(data.subscription?.plan || 'basic').toLowerCase() || 'basic',
        status: safeText(data.subscription?.status || 'active').toLowerCase() || 'active',
        agentsLimit: Number(data.subscription?.agentsLimit || 25),
        listingsLimit: Number(data.subscription?.listingsLimit || 250),
        seatsUsed: Number(data.subscription?.seatsUsed || 0),
        currentPeriodEnd: toIso(data.subscription?.currentPeriodEnd),
      },
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    }

    return NextResponse.json({ ok: true, office })
  } catch (error: any) {
    console.error('[api/admin/offices/[id]] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load office' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })
    if (!ensureAdminRole(String(session.role || ''))) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const id = safeText(params?.id)
    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

    const body = await req.json().catch(() => ({}))

    const update: Record<string, any> = {
      updatedAt: Timestamp.now(),
      updatedBy: session.uid,
    }

    if (typeof body.name !== 'undefined') update.name = safeText(body.name)
    if (typeof body.slug !== 'undefined') update.slug = safeText(body.slug)
    if (typeof body.officeCode !== 'undefined') update.officeCode = safeText(body.officeCode)
    if (typeof body.brokerageId !== 'undefined') update.brokerageId = safeText(body.brokerageId)
    if (typeof body.brokerageName !== 'undefined') update.brokerageName = safeText(body.brokerageName)
    if (typeof body.city !== 'undefined') update.city = safeText(body.city)
    if (typeof body.province !== 'undefined') update.province = safeText(body.province)
    if (typeof body.status !== 'undefined') update.status = safeText(body.status).toLowerCase() || 'active'

    if (body.subscription && typeof body.subscription === 'object') {
      update.subscription = {
        plan: safeText(body.subscription.plan || 'basic').toLowerCase() || 'basic',
        status: safeText(body.subscription.status || 'active').toLowerCase() || 'active',
        agentsLimit: toNumber(body.subscription.agentsLimit, 25, 1, 5000),
        listingsLimit: toNumber(body.subscription.listingsLimit, 250, 1, 50000),
        seatsUsed: toNumber(body.subscription.seatsUsed, 0, 0, 5000),
        currentPeriodEnd: body.subscription.currentPeriodEnd
          ? Timestamp.fromDate(new Date(body.subscription.currentPeriodEnd))
          : null,
      }
    }

    await db.collection('broker_offices').doc(id).set(update, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[api/admin/offices/[id]] PATCH error', error)
    return NextResponse.json({ ok: false, error: 'Failed to update office' }, { status: 500 })
  }
}
