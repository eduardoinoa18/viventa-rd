import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
}

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
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
    if (context.role !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
    if (!context.officeId) {
      return NextResponse.json({ ok: false, error: 'Broker office assignment required' }, { status: 403 })
    }

    const txSnap = await db
      .collection('transactions')
      .where('officeId', '==', context.officeId)
      .where('agentId', '==', context.uid)
      .limit(1500)
      .get()

    const deals = txSnap.docs
      .map<Record<string, any>>((doc) => ({ id: doc.id, ...(doc.data() as Record<string, any>) }))
      .sort((a, b) => toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt))

    const year = new Date().getFullYear()
    const yearStart = new Date(year, 0, 1).getTime()

    let pendingCommission = 0
    let paidCommission = 0
    let paidThisYear = 0
    let projectedCommission = 0

    for (const deal of deals) {
      const stage = safeText(deal.stage)
      const commission = toNumber(deal.agentCommission)
      const status = safeText(deal.commissionStatus)

      if (status === 'paid' || status === 'pagada') {
        paidCommission += commission
        const paidAtMs = toMillis(deal.updatedAt || deal.createdAt)
        if (paidAtMs >= yearStart) paidThisYear += commission
      } else {
        pendingCommission += commission
      }

      if (['offer', 'reservation', 'contract', 'closing'].includes(stage)) {
        projectedCommission += commission
      }
    }

    return NextResponse.json({
      ok: true,
      summary: {
        deals: deals.length,
        pendingCommission: Number(pendingCommission.toFixed(2)),
        paidCommission: Number(paidCommission.toFixed(2)),
        paidThisYear: Number(paidThisYear.toFixed(2)),
        projectedCommission: Number(projectedCommission.toFixed(2)),
      },
      deals: deals.slice(0, 120),
    })
  } catch (error: any) {
    console.error('[api/agent/commissions] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load agent commissions' }, { status: 500 })
  }
}
