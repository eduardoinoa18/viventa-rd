import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
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
  if (!ms) return null
  return new Date(ms).toISOString()
}

function getLeadOwner(lead: Record<string, any>): string {
  return String(lead.ownerAgentId || lead.assignedTo || '').trim()
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

    const now = Date.now()
    const day30Ms = 30 * 24 * 60 * 60 * 1000

    const [listingsByOwner, listingsByAgent] = await Promise.all([
      db.collection('properties').where('createdByUserId', '==', context.uid).limit(600).get(),
      db.collection('properties').where('agentId', '==', context.uid).limit(600).get(),
    ])

    const listingsMap = new Map<string, Record<string, any>>()
    for (const snap of [listingsByOwner, listingsByAgent]) {
      for (const doc of snap.docs) {
        listingsMap.set(doc.id, { id: doc.id, ...(doc.data() as Record<string, any>) })
      }
    }

    const listings = Array.from(listingsMap.values())
    const activeListings = listings.filter((row) => safeText(row.status) === 'active')
    const soldListings = listings.filter((row) => ['sold', 'rented'].includes(safeText(row.status)))
    const sold30 = soldListings.filter((row) => {
      const closedMs = toMillis(row.updatedAt) || toMillis((row as any).soldAt) || toMillis((row as any).closedAt)
      return closedMs > 0 && now - closedMs <= day30Ms
    })

    const leadsSnap = await db.collection('leads').limit(2500).get()
    const leads = leadsSnap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, any>) }))
      .filter((lead) => getLeadOwner(lead) === context.uid)

    const newLeads30 = leads.filter((lead) => {
      const createdMs = toMillis((lead as any).createdAt)
      return createdMs > 0 && now - createdMs <= day30Ms
    })

    const wonLeads = leads.filter((lead) => {
      const stage = safeText((lead as any).leadStage || (lead as any).status)
      return stage === 'won' || stage === 'closed' || stage === 'completado'
    })

    const pipelineOpen = leads.filter((lead) => {
      const stage = safeText((lead as any).leadStage || (lead as any).status)
      return !['won', 'lost', 'closed', 'completado'].includes(stage)
    })

    const responseTimesMinutes = leads
      .map((lead) => {
        const createdMs = toMillis((lead as any).createdAt)
        const assignedMs = toMillis((lead as any).assignedAt) || toMillis((lead as any).ownerAssignedAt)
        if (!createdMs || !assignedMs || assignedMs < createdMs) return 0
        return (assignedMs - createdMs) / (1000 * 60)
      })
      .filter((value) => value > 0)

    const avgResponseMinutes =
      responseTimesMinutes.length > 0
        ? Number((responseTimesMinutes.reduce((sum, value) => sum + value, 0) / responseTimesMinutes.length).toFixed(1))
        : 0

    const recentActivity = [
      ...listings.slice(0, 20).map((listing) => ({
        id: `listing_${listing.id}`,
        type: 'listing',
        title: String((listing as any).title || 'Listado actualizado'),
        status: safeText((listing as any).status) || 'active',
        at: toIso((listing as any).updatedAt || (listing as any).createdAt),
      })),
      ...leads.slice(0, 20).map((lead) => ({
        id: `lead_${lead.id}`,
        type: 'lead',
        title: String((lead as any).buyerName || (lead as any).name || 'Lead'),
        status: safeText((lead as any).leadStage || (lead as any).status) || 'new',
        at: toIso((lead as any).updatedAt || (lead as any).createdAt),
      })),
    ]
      .sort((a, b) => toMillis(b.at) - toMillis(a.at))
      .slice(0, 8)

    return NextResponse.json({
      ok: true,
      summary: {
        activeListings: activeListings.length,
        soldLast30Days: sold30.length,
        leadsAssigned: leads.length,
        newLeadsLast30Days: newLeads30.length,
        leadsWon: wonLeads.length,
        pipelineOpen: pipelineOpen.length,
        leadToCloseRate: leads.length > 0 ? Number(((wonLeads.length / leads.length) * 100).toFixed(1)) : 0,
        avgResponseMinutes,
      },
      recentActivity,
    })
  } catch (error: any) {
    console.error('[api/agent/dashboard/overview] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load agent dashboard overview' }, { status: 500 })
  }
}
