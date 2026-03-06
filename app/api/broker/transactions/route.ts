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

    const leadsSnap = await db.collection('leads').limit(2500).get()
    const leads = leadsSnap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, any>) }) as Record<string, any>)
      .filter((lead) => {
        const owner = String(lead.ownerAgentId || lead.assignedTo || '').trim()
        const leadOffice = String(lead.brokerId || lead.brokerageId || '').trim()
        return officeAgentIds.has(owner) || leadOffice === context.officeId
      })

    const stageCounts = {
      lead: 0,
      showing: 0,
      oferta: 0,
      enNegociacion: 0,
      contratoFirmado: 0,
      cierre: 0,
      completado: 0,
    }

    let pendingCommissions = 0
    let paidCommissions = 0
    let projectedCommissions = 0

    for (const lead of leads) {
      const stage = normalizeTransactionStage(lead.leadStage, lead.status)
      const commissionValue = sumCommission(lead)

      if (stage === 'lead') stageCounts.lead++
      else if (stage === 'showing' || stage === 'visita' || stage === 'visita_programada' || stage === 'visita_realizada') stageCounts.showing++
      else if (stage === 'oferta' || stage === 'offer') stageCounts.oferta++
      else if (stage === 'en_negociacion' || stage === 'negotiating') stageCounts.enNegociacion++
      else if (stage === 'contrato_firmado' || stage === 'contract') stageCounts.contratoFirmado++
      else if (stage === 'cierre' || stage === 'closing') stageCounts.cierre++
      else if (stage === 'completado' || stage === 'won' || stage === 'closed') stageCounts.completado++

      const commissionStatus = safeText((lead as any).commissionStatus)
      if (commissionStatus === 'paid' || commissionStatus === 'pagada') {
        paidCommissions += commissionValue
      } else if (commissionValue > 0 && stage !== 'completado') {
        pendingCommissions += commissionValue
      }

      if (stage === 'oferta' || stage === 'en_negociacion' || stage === 'contrato_firmado' || stage === 'cierre') {
        projectedCommissions += commissionValue
      }
    }

    const totalPipeline = leads.length
    const won = stageCounts.completado
    const negotiating = stageCounts.enNegociacion
    const qualified = leads.filter((lead) => {
      const stage = safeText(lead.leadStage)
      return stage === 'qualified' || stage === 'negotiating' || stage === 'won'
    }).length

    const projectedValue = leads.reduce((sum, lead) => sum + sumCommission(lead), 0)

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
    })
  } catch (error: any) {
    console.error('[api/broker/transactions] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load transactions summary' }, { status: 500 })
  }
}
