import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'

type ZoneRow = {
  zone: string
  listings: number
  avgPrice: number
  avgDaysOnMarket: number
  wonLeads: number
  totalLeads: number
  leadToCloseRate: number
  topBroker: string
}

function toIsoDate(value: any): string {
  if (!value) return ''
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return Number.isFinite(date.getTime()) ? date.toISOString() : ''
  }
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : ''
}

function daysSince(isoDate?: string): number {
  if (!isoDate) return 0
  const date = new Date(isoDate)
  if (!Number.isFinite(date.getTime())) return 0
  return Math.max(0, Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)))
}

export async function GET(req: NextRequest) {
  try {
    await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const [propertiesSnap, leadsSnap] = await Promise.all([
      adminDb.collection('properties').limit(5000).get(),
      adminDb.collection('leads').limit(8000).get(),
    ])

    const zoneMap = new Map<string, {
      listings: number
      totalPrice: number
      totalDays: number
      brokers: Map<string, number>
    }>()

    propertiesSnap.docs.forEach((doc) => {
      const data = doc.data() as any
      const city = String(data?.city || data?.location || 'Unknown').trim() || 'Unknown'
      const sector = String(data?.sector || data?.neighborhood || 'General').trim() || 'General'
      const zone = `${city} · ${sector}`

      if (!zoneMap.has(zone)) {
        zoneMap.set(zone, {
          listings: 0,
          totalPrice: 0,
          totalDays: 0,
          brokers: new Map<string, number>(),
        })
      }

      const row = zoneMap.get(zone)!
      row.listings += 1
      row.totalPrice += Number(data?.price || 0)
      row.totalDays += daysSince(toIsoDate(data?.createdAt || data?.updatedAt))

      const brokerName = String(data?.brokerName || data?.companyName || 'Independent').trim() || 'Independent'
      row.brokers.set(brokerName, (row.brokers.get(brokerName) || 0) + 1)
    })

    const leadZoneMap = new Map<string, { total: number; won: number }>()

    leadsSnap.docs.forEach((doc) => {
      const data = doc.data() as any
      const city = String(data?.city || 'Unknown').trim() || 'Unknown'
      const sector = String(data?.sector || 'General').trim() || 'General'
      const zone = `${city} · ${sector}`

      if (!leadZoneMap.has(zone)) {
        leadZoneMap.set(zone, { total: 0, won: 0 })
      }

      const row = leadZoneMap.get(zone)!
      row.total += 1
      const stage = String(data?.leadStage || data?.status || '').toLowerCase()
      if (stage === 'won') row.won += 1
    })

    const zones: ZoneRow[] = Array.from(zoneMap.entries()).map(([zone, aggregate]) => {
      const leadStats = leadZoneMap.get(zone) || { total: 0, won: 0 }
      const topBroker = Array.from(aggregate.brokers.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

      return {
        zone,
        listings: aggregate.listings,
        avgPrice: aggregate.listings === 0 ? 0 : Math.round(aggregate.totalPrice / aggregate.listings),
        avgDaysOnMarket: aggregate.listings === 0 ? 0 : Math.round(aggregate.totalDays / aggregate.listings),
        wonLeads: leadStats.won,
        totalLeads: leadStats.total,
        leadToCloseRate: leadStats.total === 0 ? 0 : Math.round((leadStats.won / leadStats.total) * 1000) / 10,
        topBroker,
      }
    })

    const totals = {
      zones: zones.length,
      listings: zones.reduce((acc, row) => acc + row.listings, 0),
      avgPrice: zones.length === 0 ? 0 : Math.round(zones.reduce((acc, row) => acc + row.avgPrice, 0) / zones.length),
      avgDaysOnMarket: zones.length === 0 ? 0 : Math.round(zones.reduce((acc, row) => acc + row.avgDaysOnMarket, 0) / zones.length),
      leadToCloseRate: zones.length === 0 ? 0 : Math.round((zones.reduce((acc, row) => acc + row.leadToCloseRate, 0) / zones.length) * 10) / 10,
    }

    const sortedByListings = [...zones].sort((a, b) => b.listings - a.listings)
    const sortedByPrice = [...zones].sort((a, b) => b.avgPrice - a.avgPrice)

    return NextResponse.json({
      ok: true,
      data: {
        totals,
        topInventoryZones: sortedByListings.slice(0, 12),
        topPriceZones: sortedByPrice.slice(0, 12),
      },
    })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[admin/marketplace-intelligence/overview] error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load marketplace intelligence' }, { status: 500 })
  }
}
