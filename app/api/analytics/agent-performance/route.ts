// app/api/analytics/agent-performance/route.ts
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'default-no-store'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    const session = await getSessionFromRequest(req)
    const uid = session?.uid
    const role = session?.role

    if (!uid || !['agent', 'broker', 'admin', 'master_admin'].includes(role || '')) {
      return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const requestedAgentId = (searchParams.get('agentId') || '').trim()
    const agentId = requestedAgentId || uid
    if (role === 'agent' && requestedAgentId && requestedAgentId !== uid) {
      return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 403 })
    }
    const days = parseInt(searchParams.get('days') || '30')

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const eventsSnap = await db
      .collection('analytics_events')
      .where('data.agentId', '==', agentId)
      .where('timestamp', '>=', cutoffDate)
      .orderBy('timestamp', 'desc')
      .get()

    const metrics = {
      profileViews: 0,
      propertyViews: 0,
      contactRequests: 0,
      favoritesGenerated: 0,
      uniqueVisitors: new Set(),
    }

    eventsSnap.forEach((doc: any) => {
      const evt = doc.data()
      if (evt.event === 'agent_profile_view') metrics.profileViews++
      if (evt.event === 'property_view' && evt.data?.agentId === agentId) metrics.propertyViews++
      if (evt.event === 'agent_contact') metrics.contactRequests++
      if (evt.event === 'property_favorite' && evt.data?.agentId === agentId) metrics.favoritesGenerated++
      if (evt.userId && evt.userId !== 'anonymous') metrics.uniqueVisitors.add(evt.userId)
    })

    // Get property stats
    const propsSnap = await db.collection('properties').where('agentId', '==', agentId).get()
    const properties = propsSnap.docs.map((d: any) => d.data())

    const performance = {
      agentId,
      period: `${days} days`,
      metrics: {
        profileViews: metrics.profileViews,
        propertyViews: metrics.propertyViews,
        contactRequests: metrics.contactRequests,
        favoritesGenerated: metrics.favoritesGenerated,
        uniqueVisitors: metrics.uniqueVisitors.size,
      },
      properties: {
        total: properties.length,
        active: properties.filter((p: any) => p.status === 'active').length,
        sold: properties.filter((p: any) => p.status === 'sold').length,
      },
      conversionRate: metrics.contactRequests > 0 ? ((metrics.contactRequests / metrics.propertyViews) * 100).toFixed(2) : '0.00',
    }

    return NextResponse.json({ ok: true, performance })
  } catch (e: any) {
    console.error('Analytics query failed:', e)
    return NextResponse.json({ ok: false, error: 'Data temporarily unavailable' }, { status: 500 })
  }
}
