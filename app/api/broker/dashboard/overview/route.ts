import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

type ListingRecord = Record<string, any> & {
  id: string
  city?: string
  status?: string
  price?: number
  createdAt?: unknown
  updatedAt?: unknown
  createdByUserId?: string
  agentId?: string
}

type LeadRecord = Record<string, any> & {
  id: string
  ownerAgentId?: string | null
  assignedTo?: string | null
  leadStage?: string
  status?: string
  createdAt?: unknown
  assignedAt?: unknown
  ownerAssignedAt?: unknown
  stageSlaDueAt?: unknown
  slaBreached?: boolean
}

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function toDate(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === 'function') {
    const parsed = value.toDate()
    return parsed instanceof Date ? parsed : null
  }
  if (typeof value?.seconds === 'number') {
    return new Date(value.seconds * 1000)
  }
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function toMillis(value: any): number {
  const parsed = toDate(value)
  return parsed ? parsed.getTime() : 0
}

function daysBetween(startValue: any, endValue: any): number {
  const start = toDate(startValue)
  const end = toDate(endValue)
  if (!start || !end) return 0
  const delta = end.getTime() - start.getTime()
  if (delta <= 0) return 0
  return delta / (1000 * 60 * 60 * 24)
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Number(((numerator / denominator) * 100).toFixed(1))
}

function avg(values: number[]): number {
  if (!values.length) return 0
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
}

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2) return sorted[middle]
  return Number(((sorted[middle - 1] + sorted[middle]) / 2).toFixed(2))
}

function normalizeOwnerAgentId(lead: LeadRecord): string {
  return safeText(lead.ownerAgentId) || safeText(lead.assignedTo)
}

function normalizeLeadStage(lead: LeadRecord): string {
  const stage = safeText(lead.leadStage).toLowerCase()
  if (stage) return stage
  const status = safeText(lead.status).toLowerCase()
  if (status === 'won') return 'won'
  if (status === 'lost') return 'lost'
  if (status === 'contacted') return 'contacted'
  if (status === 'assigned') return 'assigned'
  return 'new'
}

function buildCacheKey(officeId: string): string {
  const day = new Date().toISOString().slice(0, 10)
  return `${officeId}_${day}`
}

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'broker' && context.role !== 'agent') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!context.officeId) {
      return NextResponse.json({ error: 'Broker office assignment required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const forceRefresh = searchParams.get('refresh') === '1'

    const cacheKey = buildCacheKey(context.officeId)
    if (!forceRefresh) {
      const cacheSnap = await db.collection('broker_kpi_cache').doc(cacheKey).get()
      if (cacheSnap.exists) {
        const cached = cacheSnap.data() || {}
        return NextResponse.json({ ...cached, fromCache: true })
      }
    }

    const now = Date.now()
    const day30Ms = 30 * 24 * 60 * 60 * 1000
    const day90Ms = 90 * 24 * 60 * 60 * 1000

    const listingQueries = [
      db.collection('properties').where('brokerId', '==', context.officeId).limit(800).get(),
      db.collection('properties').where('createdByBrokerId', '==', context.officeId).limit(800).get(),
      db.collection('properties').where('brokerageId', '==', context.officeId).limit(800).get(),
    ]

    const listingSnapshots = await Promise.all(listingQueries)
    const officeListingsMap = new Map<string, ListingRecord>()
    for (const snapshot of listingSnapshots) {
      for (const doc of snapshot.docs) {
        officeListingsMap.set(doc.id, { id: doc.id, ...(doc.data() as Record<string, any>) })
      }
    }

    const officeListings = Array.from(officeListingsMap.values())

    const activeListings = officeListings.filter((row) => safeText(row.status).toLowerCase() === 'active')
    const pendingListings = officeListings.filter((row) => safeText(row.status).toLowerCase() === 'pending')
    const closedListings = officeListings.filter((row) => {
      const status = safeText(row.status).toLowerCase()
      return status === 'sold' || status === 'rented'
    })

    const newListings30 = officeListings.filter((row) => {
      const createdAtMs = toMillis(row.createdAt)
      return createdAtMs > 0 && now - createdAtMs <= day30Ms
    })

    const closedListings30 = closedListings.filter((row) => {
      const closedAtMs = toMillis(row.updatedAt) || toMillis((row as any).soldAt) || toMillis((row as any).closedAt)
      return closedAtMs > 0 && now - closedAtMs <= day30Ms
    })

    const domValues = closedListings30
      .map((row) => daysBetween(row.createdAt, row.updatedAt || (row as any).soldAt || (row as any).closedAt))
      .filter((value) => value > 0)

    const activeByAgent = new Map<string, number>()
    for (const listing of activeListings) {
      const owner = safeText(listing.createdByUserId) || safeText(listing.agentId)
      if (!owner) continue
      activeByAgent.set(owner, (activeByAgent.get(owner) || 0) + 1)
    }

    const userQueries = [
      db.collection('users').where('brokerageId', '==', context.officeId).limit(400).get(),
      db.collection('users').where('brokerId', '==', context.officeId).limit(400).get(),
    ]

    const userSnapshots = await Promise.all(userQueries)
    const officeUsersMap = new Map<string, Record<string, any>>()
    for (const snapshot of userSnapshots) {
      for (const doc of snapshot.docs) {
        officeUsersMap.set(doc.id, { id: doc.id, ...(doc.data() as Record<string, any>) })
      }
    }
    officeUsersMap.set(context.uid, { id: context.uid, role: context.role, name: context.name, email: context.email })

    const officeAgentIds = Array.from(officeUsersMap.values())
      .filter((user) => ['agent', 'broker'].includes(safeText(user.role).toLowerCase()))
      .map((user) => safeText(user.id))
      .filter(Boolean)

    const leadsSnapshot = await db.collection('leads').limit(2000).get()
    const leads = leadsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, any>) }) as LeadRecord)
      .filter((lead) => {
        const ownerId = normalizeOwnerAgentId(lead)
        if (ownerId && officeAgentIds.includes(ownerId)) return true
        const leadBrokerId = safeText((lead as any).brokerId) || safeText((lead as any).brokerageId)
        return leadBrokerId === context.officeId
      })

    const leadsAssigned = leads.filter((lead) => Boolean(normalizeOwnerAgentId(lead)))
    const wonLeads = leadsAssigned.filter((lead) => normalizeLeadStage(lead) === 'won')
    const contactedLeads = leadsAssigned.filter((lead) => {
      const stage = normalizeLeadStage(lead)
      return ['contacted', 'qualified', 'negotiating', 'won'].includes(stage)
    })
    const qualifiedLeads = leadsAssigned.filter((lead) => {
      const stage = normalizeLeadStage(lead)
      return ['qualified', 'negotiating', 'won'].includes(stage)
    })

    const responseMinutes = leadsAssigned
      .map((lead) => {
        const createdAtMs = toMillis(lead.createdAt)
        const assignedAtMs = toMillis(lead.assignedAt) || toMillis(lead.ownerAssignedAt)
        if (!createdAtMs || !assignedAtMs || assignedAtMs < createdAtMs) return 0
        return (assignedAtMs - createdAtMs) / (1000 * 60)
      })
      .filter((value) => value > 0)

    const slaBreaches = leadsAssigned.filter((lead) => Boolean(lead.slaBreached)).length

    const conversionPerAgent = officeAgentIds.map((agentId) => {
      const agentLeads = leadsAssigned.filter((lead) => normalizeOwnerAgentId(lead) === agentId)
      const agentWon = agentLeads.filter((lead) => normalizeLeadStage(lead) === 'won').length
      const pipelineValue = agentLeads.reduce((sum, lead) => {
        const value = Number((lead as any).potentialCommission || (lead as any).potentialValue || (lead as any).dealValue || 0)
        return sum + (Number.isFinite(value) ? value : 0)
      }, 0)
      return {
        agentId,
        assigned: agentLeads.length,
        won: agentWon,
        conversionRate: pct(agentWon, agentLeads.length),
        pipelineValue,
      }
    })

    const topAgent = conversionPerAgent
      .filter((row) => row.assigned > 0)
      .sort((a, b) => b.won - a.won || b.conversionRate - a.conversionRate)[0] || null

    const dominantCity = (() => {
      const counts = new Map<string, number>()
      for (const listing of officeListings) {
        const city = safeText(listing.city)
        if (!city) continue
        counts.set(city, (counts.get(city) || 0) + 1)
      }
      const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
      return sorted[0]?.[0] || ''
    })()

    let marketListings: ListingRecord[] = []
    if (dominantCity) {
      const marketSnap = await db.collection('properties').where('city', '==', dominantCity).limit(1500).get()
      marketListings = marketSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, any>) }))
    }

    const marketActive = marketListings.filter((row) => safeText(row.status).toLowerCase() === 'active')
    const marketPending = marketListings.filter((row) => safeText(row.status).toLowerCase() === 'pending')
    const marketClosed90 = marketListings.filter((row) => {
      const status = safeText(row.status).toLowerCase()
      if (!['sold', 'rented'].includes(status)) return false
      const closedAtMs = toMillis(row.updatedAt) || toMillis((row as any).soldAt) || toMillis((row as any).closedAt)
      return closedAtMs > 0 && now - closedAtMs <= day90Ms
    })

    const marketDomValues = marketClosed90
      .map((row) => daysBetween(row.createdAt, row.updatedAt || (row as any).soldAt || (row as any).closedAt))
      .filter((value) => value > 0)

    const medianPrice = median(
      marketActive
        .map((row) => Number(row.price || 0))
        .filter((value) => Number.isFinite(value) && value > 0)
    )

    const priceLast30 = median(
      marketListings
        .filter((row) => {
          const createdAtMs = toMillis(row.createdAt)
          return createdAtMs > 0 && now - createdAtMs <= day30Ms
        })
        .map((row) => Number(row.price || 0))
        .filter((value) => Number.isFinite(value) && value > 0)
    )

    const pricePrev30 = median(
      marketListings
        .filter((row) => {
          const createdAtMs = toMillis(row.createdAt)
          if (!createdAtMs) return false
          const age = now - createdAtMs
          return age > day30Ms && age <= day30Ms * 2
        })
        .map((row) => Number(row.price || 0))
        .filter((value) => Number.isFinite(value) && value > 0)
    )

    const payload = {
      officeId: context.officeId,
      role: context.role,
      generatedAt: new Date().toISOString(),
      performance: {
        totalActiveListings: activeListings.length,
        newListings30Days: newListings30.length,
        pendingListings: pendingListings.length,
        closedListings30Days: closedListings30.length,
        totalGci: 0,
        avgDaysOnMarket: avg(domValues),
        officeConversionRate: pct(closedListings30.length, Math.max(1, activeListings.length + pendingListings.length + closedListings30.length)),
        leadToAppointmentRate: pct(qualifiedLeads.length, leadsAssigned.length),
        leadToCloseRate: pct(wonLeads.length, leadsAssigned.length),
      },
      leads: {
        leadsAssigned: leadsAssigned.length,
        responseTimeAvgMinutes: avg(responseMinutes),
        slaBreaches,
        contactRate: pct(contactedLeads.length, leadsAssigned.length),
        qualificationRate: pct(qualifiedLeads.length, leadsAssigned.length),
      },
      team: {
        topAgentThisMonth: topAgent,
        listingsPerAgent: conversionPerAgent.map((row) => ({
          agentId: row.agentId,
          listings: activeByAgent.get(row.agentId) || 0,
        })),
        conversionPerAgent,
      },
      market: {
        dominantCity,
        avgDomInMarket: avg(marketDomValues),
        medianPriceInArea: medianPrice,
        activeVsPendingRatio: marketPending.length > 0 ? Number((marketActive.length / marketPending.length).toFixed(2)) : marketActive.length,
        priceTrend30vsPrev30Pct: pricePrev30 > 0 ? Number((((priceLast30 - pricePrev30) / pricePrev30) * 100).toFixed(2)) : 0,
      },
    }

    await db.collection('broker_kpi_cache').doc(cacheKey).set(payload, { merge: true })

    return NextResponse.json({ ...payload, fromCache: false })
  } catch (error: any) {
    console.error('[api/broker/dashboard/overview] GET error', error)
    return NextResponse.json({ error: error?.message || 'Failed to load broker dashboard KPIs' }, { status: 500 })
  }
}
