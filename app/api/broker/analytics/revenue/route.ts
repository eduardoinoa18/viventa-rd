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

type BrokerAggregate = {
  userId: string
  deals: number
  pipelineValue: number
  expectedCommission: number
  closedDeals: number
  closedCommission: number
}

const ACTIVE_STAGES = new Set(['lead', 'showing', 'offer', 'reservation', 'contract', 'closing'])

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'broker' && context.role !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
    if (!context.officeId) {
      return NextResponse.json({ ok: false, error: 'Broker office assignment required' }, { status: 403 })
    }

    const txSnap = await db
      .collection('transactions')
      .where('officeId', '==', context.officeId)
      .limit(3000)
      .get()

    const transactions = txSnap.docs
      .map<Record<string, any>>((doc) => ({ id: doc.id, ...(doc.data() as Record<string, any>) }))
      .filter((tx) => {
        if (context.role === 'broker') return true
        return String(tx.agentId || '').trim() === context.uid
      })

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    let officePipelineValue = 0
    let expectedCommission = 0
    let dealsClosingThisMonth = 0

    const brokerMap = new Map<string, BrokerAggregate>()

    for (const tx of transactions) {
      const stage = safeText(tx.stage)
      const salePrice = toNumber(tx.salePrice)
      const totalCommission = toNumber(tx.totalCommission)
      const agentCommission = toNumber(tx.agentCommission || totalCommission)
      const agentId = String(tx.agentId || '').trim() || context.uid
      const updatedAtMs = toMillis(tx.updatedAt || tx.createdAt)

      if (!brokerMap.has(agentId)) {
        brokerMap.set(agentId, {
          userId: agentId,
          deals: 0,
          pipelineValue: 0,
          expectedCommission: 0,
          closedDeals: 0,
          closedCommission: 0,
        })
      }

      const aggregate = brokerMap.get(agentId)!
      aggregate.deals += 1

      if (ACTIVE_STAGES.has(stage)) {
        officePipelineValue += salePrice
        expectedCommission += totalCommission
        aggregate.pipelineValue += salePrice
        aggregate.expectedCommission += agentCommission
      }

      if (stage === 'closing' && updatedAtMs >= monthStart) {
        dealsClosingThisMonth += 1
      }

      if (stage === 'completed') {
        aggregate.closedDeals += 1
        aggregate.closedCommission += agentCommission
      }
    }

    const topBrokerRows = Array.from(brokerMap.values())
      .sort((a, b) => b.expectedCommission - a.expectedCommission)
      .slice(0, 5)

    const topBrokerUsers = await Promise.all(
      topBrokerRows.map(async (row) => {
        const userSnap = await db.collection('users').doc(row.userId).get()
        const user = (userSnap.data() || {}) as Record<string, any>
        return {
          ...row,
          name: String(user.displayName || user.name || user.fullName || user.email || row.userId),
        }
      })
    )

    return NextResponse.json({
      ok: true,
      officeId: context.officeId,
      metrics: {
        officePipelineValue: Number(officePipelineValue.toFixed(2)),
        expectedCommission: Number(expectedCommission.toFixed(2)),
        dealsClosingThisMonth,
        activeDeals: transactions.filter((tx) => ACTIVE_STAGES.has(safeText(tx.stage))).length,
      },
      topBrokers: topBrokerUsers,
    })
  } catch (error: any) {
    console.error('[api/broker/analytics/revenue] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load broker revenue analytics' }, { status: 500 })
  }
}
