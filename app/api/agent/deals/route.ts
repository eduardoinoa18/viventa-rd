import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

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

function toIso(value: any): string | null {
  const ms = toMillis(value)
  return ms ? new Date(ms).toISOString() : null
}

const ACTIVE_STAGES = ['lead', 'showing', 'offer', 'reservation', 'contract', 'closing']
const COMPLETED_STAGES = ['completed', 'won', 'closed']

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

    const { searchParams } = new URL(req.url)
    const stageFilter = safeLower(searchParams.get('stage') || '')
    const q = safeLower(searchParams.get('q') || '')

    const txSnap = await db
      .collection('transactions')
      .where('officeId', '==', context.officeId)
      .where('agentId', '==', context.uid)
      .limit(1500)
      .get()

    let deals = txSnap.docs
      .map<Record<string, any>>((doc) => ({ id: doc.id, ...(doc.data() as Record<string, any>) }))
      .map((d) => ({
        id: d.id,
        clientName: safeText(d.buyerName || d.clientName || d.contactName || 'Cliente'),
        clientEmail: safeText(d.buyerEmail || d.clientEmail || ''),
        propertyAddress: safeText(d.propertyAddress || d.address || d.propertyTitle || ''),
        salePrice: toNumber(d.salePrice || d.price),
        currency: (safeText(d.currency) || 'USD') as 'USD' | 'DOP',
        stage: safeLower(d.stage || d.status || 'lead'),
        commission: toNumber(d.agentCommission),
        commissionStatus: (safeLower(d.commissionStatus) as 'pending' | 'paid') || 'pending',
        createdAt: toIso(d.createdAt),
        updatedAt: toIso(d.updatedAt || d.createdAt),
      }))
      .sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt))

    // Apply filters
    if (stageFilter && stageFilter !== 'all') {
      deals = deals.filter((d) => d.stage === stageFilter)
    }
    if (q) {
      deals = deals.filter(
        (d) =>
          d.clientName.toLowerCase().includes(q) ||
          d.propertyAddress.toLowerCase().includes(q) ||
          d.clientEmail.toLowerCase().includes(q),
      )
    }

    // Summary stats from unfiltered
    const allTx = txSnap.docs.map((doc) => doc.data() as Record<string, any>)
    const total = allTx.length
    const active = allTx.filter((d) => ACTIVE_STAGES.includes(safeLower(d.stage || d.status))).length
    const completed = allTx.filter((d) => COMPLETED_STAGES.includes(safeLower(d.stage || d.status))).length
    const pipeline = allTx
      .filter((d) => ['offer', 'reservation', 'contract', 'closing'].includes(safeLower(d.stage || d.status)))
      .reduce((sum, d) => sum + toNumber(d.salePrice || d.price), 0)
    const commission = allTx.reduce((sum, d) => sum + toNumber(d.agentCommission), 0)

    return NextResponse.json({
      ok: true,
      summary: {
        total,
        active,
        completed,
        pipeline: Number(pipeline.toFixed(2)),
        commission: Number(commission.toFixed(2)),
      },
      deals: deals.slice(0, 200),
    })
  } catch (error: any) {
    console.error('[api/agent/deals] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load agent deals' }, { status: 500 })
  }
}
