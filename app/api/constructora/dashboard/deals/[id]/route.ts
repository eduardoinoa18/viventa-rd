import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

const DEAL_STATUSES = ['reserved', 'negotiating', 'contract_signed', 'financing', 'closing', 'closed', 'cancelled'] as const

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
  if ((DEAL_STATUSES as readonly string[]).includes(status)) return status
  if (status === 'contract') return 'contract_signed'
  if (status === 'won' || status === 'completed') return 'closed'
  return 'reserved'
}

function asDeal(id: string, data: Record<string, any>) {
  return {
    id,
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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'constructora') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const ref = db.collection('deals').doc(params.id)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: 'Deal not found' }, { status: 404 })
    }

    const deal = asDeal(snap.id, snap.data() as Record<string, any>)
    const scopedCode = safeText(context.constructoraCode || context.professionalCode || context.uid)
    if (deal.constructoraCode !== scopedCode) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ ok: true, deal })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/deals/[id]] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load deal' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'constructora') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const ref = db.collection('deals').doc(params.id)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: 'Deal not found' }, { status: 404 })
    }

    const current = asDeal(snap.id, snap.data() as Record<string, any>)
    const scopedCode = safeText(context.constructoraCode || context.professionalCode || context.uid)
    if (current.constructoraCode !== scopedCode) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const update: Record<string, any> = {
      updatedAt: new Date(),
      updatedBy: context.uid,
    }

    if (body.status !== undefined) update.status = normalizeDealStatus(body.status)
    if (body.price !== undefined) update.price = toNumber(body.price)
    if (body.buyerName !== undefined) update.buyerName = safeText(body.buyerName)
    if (body.brokerName !== undefined) update.brokerName = safeText(body.brokerName)

    await ref.set(update, { merge: true })

    if (body.status !== undefined && normalizeDealStatus(body.status) !== current.status) {
      await ref.collection('events').add({
        type: body.status === 'closed' ? 'deal_closed' : 'status_changed',
        actorId: context.uid,
        metadata: {
          fromStatus: current.status,
          toStatus: normalizeDealStatus(body.status),
        },
        createdAt: new Date(),
      })
    }

    const saved = await ref.get()
    return NextResponse.json({ ok: true, deal: asDeal(saved.id, saved.data() as Record<string, any>) })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/deals/[id]] PATCH error', error)
    return NextResponse.json({ ok: false, error: 'Failed to update deal' }, { status: 500 })
  }
}
