import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
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

    const totalPipeline = leads.length
    const won = leads.filter((lead) => safeText(lead.leadStage || lead.status) === 'won').length
    const negotiating = leads.filter((lead) => safeText(lead.leadStage) === 'negotiating').length
    const qualified = leads.filter((lead) => {
      const stage = safeText(lead.leadStage)
      return stage === 'qualified' || stage === 'negotiating' || stage === 'won'
    }).length

    const projectedValue = leads.reduce((sum, lead) => {
      const value = Number(lead.potentialCommission || lead.potentialValue || lead.dealValue || 0)
      return sum + (Number.isFinite(value) ? value : 0)
    }, 0)

    return NextResponse.json({
      ok: true,
      officeId: context.officeId,
      summary: {
        totalPipeline,
        qualified,
        negotiating,
        won,
        projectedValue: Number(projectedValue.toFixed(2)),
      },
    })
  } catch (error: any) {
    console.error('[api/broker/transactions] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load transactions summary' }, { status: 500 })
  }
}
