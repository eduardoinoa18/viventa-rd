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

function normalizeTransactionStage(stageValue: unknown, statusValue: unknown): string {
  const stage = safeText(stageValue)
  if (stage) return stage
  const status = safeText(statusValue)
  if (status === 'won' || status === 'closed' || status === 'completado') return 'completado'
  if (status === 'negotiating') return 'en_negociacion'
  if (status === 'qualified') return 'oferta'
  if (status === 'contacted') return 'showing'
  return 'lead'
}

function sumCommission(record: Record<string, any>): number {
  return (
    toNumber(record.commissionAmount) ||
    toNumber(record.totalCommission) ||
    toNumber(record.potentialCommission) ||
    toNumber(record.potentialValue) ||
    toNumber(record.dealValue) ||
    0
  )
}

const PIPELINE_STAGES = ['lead', 'showing', 'offer', 'reservation', 'contract', 'closing', 'completed'] as const
type PipelineStage = (typeof PIPELINE_STAGES)[number]

function normalizePipelineStage(value: unknown): PipelineStage {
  const stage = safeText(value)
  if (PIPELINE_STAGES.includes(stage as PipelineStage)) return stage as PipelineStage
  if (stage === 'oferta') return 'offer'
  if (stage === 'contrato_firmado') return 'contract'
  if (stage === 'cierre') return 'closing'
  if (stage === 'completado' || stage === 'won' || stage === 'closed') return 'completed'
  return 'lead'
}

function stageKey(stage: PipelineStage): keyof typeof EMPTY_STAGE_COUNTS {
  if (stage === 'offer') return 'offer'
  if (stage === 'reservation') return 'reservation'
  if (stage === 'contract') return 'contract'
  if (stage === 'closing') return 'closing'
  if (stage === 'completed') return 'completed'
  if (stage === 'showing') return 'showing'
  return 'lead'
}

const EMPTY_STAGE_COUNTS = {
  lead: 0,
  showing: 0,
  offer: 0,
  reservation: 0,
  contract: 0,
  closing: 0,
  completed: 0,
}

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

    const [teamByBrokerId, teamByBrokerageId] = await Promise.all([
      db.collection('users').where('brokerId', '==', context.officeId).limit(400).get(),
      db.collection('users').where('brokerageId', '==', context.officeId).limit(400).get(),
    ])

    const officeAgentIds = new Set<string>()
    for (const snap of [teamByBrokerId, teamByBrokerageId]) {
      for (const doc of snap.docs) {
        const data = doc.data() as Record<string, any>
        const role = safeText(data.role)
        if (role === 'agent' || role === 'broker') {
          officeAgentIds.add(doc.id)
        }
      }
    }
    officeAgentIds.add(context.uid)

    const txSnap = await db
      .collection('transactions')
      .where('officeId', '==', context.officeId)
      .limit(2000)
      .get()

    const transactions = txSnap.docs
      .map<Record<string, any>>((doc) => ({ id: doc.id, ...(doc.data() as Record<string, any>) }))
      .filter((tx) => {
        if (context.role === 'broker') return true
        const ownerAgentId = String(tx.agentId || '').trim()
        return !ownerAgentId || ownerAgentId === context.uid
      })

    const stageCounts = { ...EMPTY_STAGE_COUNTS }

    let pendingCommissions = 0
    let paidCommissions = 0
    let projectedCommissions = 0
    let projectedValue = 0

    for (const tx of transactions) {
      const stage = normalizePipelineStage(tx.stage)
      stageCounts[stageKey(stage)] += 1

      const salePrice = toNumber(tx.salePrice)
      projectedValue += salePrice

      const commissionValue = toNumber(tx.totalCommission)
      const commissionStatus = safeText((tx as any).commissionStatus)
      if (commissionStatus === 'paid' || commissionStatus === 'pagada') {
        paidCommissions += commissionValue
      } else if (commissionValue > 0 && stage !== 'completed') {
        pendingCommissions += commissionValue
      }

      if (stage === 'offer' || stage === 'reservation' || stage === 'contract' || stage === 'closing') {
        projectedCommissions += commissionValue
      }
    }

    const totalPipeline = transactions.length
    const won = stageCounts.completed
    const negotiating = stageCounts.offer + stageCounts.reservation + stageCounts.contract + stageCounts.closing
    const qualified = stageCounts.showing + stageCounts.offer

    return NextResponse.json({
      ok: true,
      officeId: context.officeId,
      summary: {
        totalPipeline,
        qualified,
        negotiating,
        won,
        projectedValue: Number(projectedValue.toFixed(2)),
        pendingCommissions: Number(pendingCommissions.toFixed(2)),
        paidCommissions: Number(paidCommissions.toFixed(2)),
        monthlyProjection: Number(projectedCommissions.toFixed(2)),
        stages: stageCounts,
      },
      transactions,
    })
  } catch (error: any) {
    console.error('[api/broker/transactions] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load transactions summary' }, { status: 500 })
  }
}

export async function POST(req: Request) {
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

    const body = await req.json().catch(() => ({}))
    const stage = normalizePipelineStage(body.stage)
    const clientName = String(body.clientName || '').trim()
    const agentId = String(body.agentId || context.uid).trim()
    const salePrice = toNumber(body.salePrice)
    const commissionPercent = toNumber(body.commissionPercent || 0)
    const agentSplitPercent = toNumber(body.agentSplitPercent || 70)
    const brokerSplitPercent = Math.max(0, 100 - agentSplitPercent)

    if (!clientName) {
      return NextResponse.json({ ok: false, error: 'clientName is required' }, { status: 400 })
    }
    if (salePrice <= 0) {
      return NextResponse.json({ ok: false, error: 'salePrice must be greater than 0' }, { status: 400 })
    }
    if (commissionPercent < 0 || commissionPercent > 100) {
      return NextResponse.json({ ok: false, error: 'commissionPercent must be between 0 and 100' }, { status: 400 })
    }
    if (agentSplitPercent < 0 || agentSplitPercent > 100) {
      return NextResponse.json({ ok: false, error: 'agentSplitPercent must be between 0 and 100' }, { status: 400 })
    }

    if (context.role === 'agent' && agentId !== context.uid) {
      return NextResponse.json({ ok: false, error: 'Agents can only create their own transactions' }, { status: 403 })
    }

    const totalCommission = Number(((salePrice * commissionPercent) / 100).toFixed(2))
    const agentCommission = Number(((totalCommission * agentSplitPercent) / 100).toFixed(2))
    const brokerCommission = Number((totalCommission - agentCommission).toFixed(2))

    const now = new Date()
    const created = await db.collection('transactions').add({
      officeId: context.officeId,
      leadId: String(body.leadId || '').trim() || null,
      propertyId: String(body.propertyId || '').trim() || null,
      projectId: String(body.projectId || '').trim() || null,
      unitId: String(body.unitId || '').trim() || null,
      clientName,
      clientEmail: String(body.clientEmail || '').trim() || null,
      clientPhone: String(body.clientPhone || '').trim() || null,
      agentId,
      brokerId: context.role === 'broker' ? context.uid : null,
      stage,
      salePrice,
      currency: String(body.currency || 'USD').trim().toUpperCase() === 'DOP' ? 'DOP' : 'USD',
      commissionPercent,
      totalCommission,
      agentSplitPercent,
      brokerSplitPercent,
      agentCommission,
      brokerCommission,
      commissionStatus: 'pending',
      notes: String(body.notes || '').trim() || null,
      createdAt: now,
      updatedAt: now,
      createdBy: context.uid,
      updatedBy: context.uid,
    })

    const saved = await created.get()
    return NextResponse.json({ ok: true, id: created.id, transaction: { id: created.id, ...(saved.data() || {}) } }, { status: 201 })
  } catch (error: any) {
    console.error('[api/broker/transactions] POST error', error)
    return NextResponse.json({ ok: false, error: 'Failed to create transaction' }, { status: 500 })
  }
}
