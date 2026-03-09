import { NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function normalizeSlug(value: string) {
  return safeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
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

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })
    if (!ensureAdminRole(String(session.role || ''))) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = toNumber(searchParams.get('limit'), 80, 1, 200)
    const search = safeText(searchParams.get('search')).toLowerCase()
    const statusFilter = safeText(searchParams.get('status')).toLowerCase()

    const snap = await db.collection('broker_offices').orderBy('createdAt', 'desc').limit(limit).get()

    const offices = snap.docs
      .map((doc) => {
        const data = doc.data() as Record<string, any>
        return {
          id: doc.id,
          name: safeText(data.name),
          slug: safeText(data.slug),
          officeCode: safeText(data.officeCode || doc.id),
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
      })
      .filter((office) => {
        if (statusFilter && office.status !== statusFilter) return false
        if (!search) return true
        const text = `${office.name} ${office.slug} ${office.officeCode} ${office.city} ${office.province} ${office.brokerageName}`.toLowerCase()
        return text.includes(search)
      })

    return NextResponse.json({ ok: true, offices })
  } catch (error: any) {
    console.error('[api/admin/offices] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load offices' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })
    if (!ensureAdminRole(String(session.role || ''))) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const name = safeText(body.name)
    if (!name) return NextResponse.json({ ok: false, error: 'Office name is required' }, { status: 400 })

    const slugBase = normalizeSlug(safeText(body.slug) || name)
    const slug = slugBase || `office-${Date.now()}`
    const officeCode = safeText(body.officeCode) || `OF-${Date.now().toString().slice(-6)}`
    const now = Timestamp.now()

    const subscription = {
      plan: safeText(body.subscription?.plan || 'basic').toLowerCase() || 'basic',
      status: safeText(body.subscription?.status || 'active').toLowerCase() || 'active',
      agentsLimit: toNumber(body.subscription?.agentsLimit, 25, 1, 5000),
      listingsLimit: toNumber(body.subscription?.listingsLimit, 250, 1, 50000),
      seatsUsed: toNumber(body.subscription?.seatsUsed, 0, 0, 5000),
      currentPeriodEnd: body.subscription?.currentPeriodEnd
        ? Timestamp.fromDate(new Date(body.subscription.currentPeriodEnd))
        : null,
    }

    const ref = await db.collection('broker_offices').add({
      name,
      slug,
      officeCode,
      brokerageId: safeText(body.brokerageId),
      brokerageName: safeText(body.brokerageName),
      city: safeText(body.city),
      province: safeText(body.province),
      status: safeText(body.status || 'active').toLowerCase() || 'active',
      subscription,
      createdBy: session.uid,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ ok: true, id: ref.id }, { status: 201 })
  } catch (error: any) {
    console.error('[api/admin/offices] POST error', error)
    return NextResponse.json({ ok: false, error: 'Failed to create office' }, { status: 500 })
  }
}
