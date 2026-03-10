import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'
import { DEAL_STATUSES, type DealStatus } from '@/lib/domain/deal'
import { emitActivityEvent } from '@/lib/activityEvents'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function safeLower(value: unknown): string {
  return safeText(value).toLowerCase()
}

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeDealStatus(value: unknown) {
  const status = safeLower(value)
  if ((DEAL_STATUSES as readonly string[]).includes(status)) return status as DealStatus
  if (status === 'contract') return 'contract_signed'
  if (status === 'won' || status === 'completed') return 'closed'
  return 'reserved'
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

function asDeal(id: string, data: Record<string, any>) {
  return {
    id,
    dealId: id,
    unitId: safeText(data.unitId),
    projectId: safeText(data.projectId),
    reservationId: safeText(data.reservationId),
    buyerId: safeText(data.buyerId),
    buyerName: safeText(data.buyerName),
    brokerId: safeText(data.brokerId),
    brokerName: safeText(data.brokerName),
    price: toNumber(data.price),
    currency: safeText(data.currency || 'USD') || 'USD',
    status: normalizeDealStatus(data.status),
    constructoraCode: safeText(data.constructoraCode),
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    createdBy: safeText(data.createdBy),
    updatedBy: safeText(data.updatedBy),
  }
}

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'constructora') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const scopedCode = safeText(context.constructoraCode || context.professionalCode || context.uid)
    const { searchParams } = new URL(req.url)
    const q = safeLower(searchParams.get('q') || '')
    const statusFilter = normalizeDealStatus(searchParams.get('status') || 'reserved')
    const showAllStatuses = safeLower(searchParams.get('status') || '') === 'all'

    const snap = await db.collection('deals').where('constructoraCode', '==', scopedCode).limit(2000).get()
    let deals = snap.docs.map((doc) => asDeal(doc.id, doc.data() as Record<string, any>))

    if (!showAllStatuses) {
      deals = deals.filter((deal) => deal.status === statusFilter)
    }

    if (q) {
      deals = deals.filter((deal) => {
        return (
          safeLower(deal.buyerName).includes(q) ||
          safeLower(deal.unitId).includes(q) ||
          safeLower(deal.projectId).includes(q) ||
          safeLower(deal.brokerName).includes(q)
        )
      })
    }

    deals.sort((a, b) => toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt))

    const summary = {
      total: deals.length,
      reserved: deals.filter((deal) => deal.status === 'reserved').length,
      negotiating: deals.filter((deal) => deal.status === 'negotiating').length,
      contractSigned: deals.filter((deal) => deal.status === 'contract_signed').length,
      financing: deals.filter((deal) => deal.status === 'financing').length,
      closing: deals.filter((deal) => deal.status === 'closing').length,
      closed: deals.filter((deal) => deal.status === 'closed').length,
      cancelled: deals.filter((deal) => deal.status === 'cancelled').length,
      pipelineValue: Number(deals.reduce((sum, deal) => sum + Number(deal.price || 0), 0).toFixed(2)),
    }

    return NextResponse.json({ ok: true, deals: deals.slice(0, 300), total: deals.length, summary })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/deals] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load deals' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'constructora') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const unitId = safeText(body.unitId)
    const projectId = safeText(body.projectId)
    const reservationId = safeText(body.reservationId)
    const buyerId = safeText(body.buyerId)
    const buyerName = safeText(body.buyerName)
    const brokerId = safeText(body.brokerId)
    const brokerName = safeText(body.brokerName)
    const price = toNumber(body.price)
    const status = normalizeDealStatus(body.status)

    if (!unitId || !projectId) {
      return NextResponse.json({ ok: false, error: 'unitId and projectId are required' }, { status: 400 })
    }
    if (!buyerName) {
      return NextResponse.json({ ok: false, error: 'buyerName is required' }, { status: 400 })
    }
    if (price <= 0) {
      return NextResponse.json({ ok: false, error: 'price must be greater than 0' }, { status: 400 })
    }

    const now = new Date()
    const constructoraCode = safeText(context.constructoraCode || context.professionalCode || context.uid)
    const created = await db.collection('deals').add({
      unitId,
      projectId,
      reservationId: reservationId || null,
      buyerId: buyerId || null,
      buyerName,
      brokerId: brokerId || null,
      brokerName: brokerName || null,
      price,
      currency: safeText(body.currency || 'USD') || 'USD',
      status,
      constructoraCode,
      createdAt: now,
      updatedAt: now,
      createdBy: context.uid,
      updatedBy: context.uid,
    })

    await created.collection('events').add({
      type: 'reservation_created',
      actorId: context.uid,
      metadata: {
        reservationId: reservationId || null,
        unitId,
        projectId,
      },
      createdAt: now,
    })

    await emitActivityEvent(db, {
      type: 'deal_opened',
      actorId: context.uid,
      actorRole: context.role,
      entityType: 'deal',
      entityId: created.id,
      dealId: created.id,
      unitId,
      projectId,
      reservationId: reservationId || null,
      brokerId: brokerId || null,
      buyerId: buyerId || null,
      constructoraCode,
      metadata: {
        status,
        price,
        currency: safeText(body.currency || 'USD') || 'USD',
      },
    })

    if (reservationId) {
      await emitActivityEvent(db, {
        type: 'reservation_created',
        actorId: context.uid,
        actorRole: context.role,
        entityType: 'reservation',
        entityId: reservationId,
        dealId: created.id,
        reservationId,
        unitId,
        projectId,
        brokerId: brokerId || null,
        buyerId: buyerId || null,
        constructoraCode,
      })
    }

    const saved = await created.get()
    return NextResponse.json({ ok: true, deal: asDeal(created.id, saved.data() as Record<string, any>) }, { status: 201 })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/deals] POST error', error)
    return NextResponse.json({ ok: false, error: 'Failed to create deal' }, { status: 500 })
  }
}
