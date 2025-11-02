// app/api/analytics/agent-performance/route.ts
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'default-no-store'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'

function getCookie(req: NextRequest, name: string): string | null {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

export async function GET(req: NextRequest) {
  try {
    const uid = getCookie(req, 'viventa_uid')
    const role = getCookie(req, 'viventa_role')

    if (!uid || !['agent', 'broker', 'admin', 'master_admin'].includes(role || '')) {
      return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId') || uid
    const days = parseInt(searchParams.get('days') || '30')

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Aggregate from analytics_events
    const eventsQ = query(
      collection(db, 'analytics_events'),
      where('data.agentId', '==', agentId),
      where('timestamp', '>=', Timestamp.fromDate(cutoffDate)),
      orderBy('timestamp', 'desc')
    )

    try {
      const eventsSnap = await getDocs(eventsQ)
      
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
      const propsQ = query(collection(db, 'properties'), where('agentId', '==', agentId))
      const propsSnap = await getDocs(propsQ)
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
    } catch (e) {
      // Firestore not configured, return mock
      return NextResponse.json({
        ok: true,
        performance: {
          agentId,
          period: `${days} days`,
          metrics: {
            profileViews: 42,
            propertyViews: 320,
            contactRequests: 18,
            favoritesGenerated: 45,
            uniqueVisitors: 87,
          },
          properties: {
            total: 12,
            active: 8,
            sold: 4,
          },
          conversionRate: '5.63',
        },
        note: 'Mock data - Firebase not configured'
      })
    }
  } catch (e: any) {
    console.error('agent-performance GET error', e)
    return NextResponse.json({ ok: false, error: 'Failed to get performance data' }, { status: 500 })
  }
}
