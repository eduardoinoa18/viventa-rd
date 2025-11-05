// app/api/admin/analytics/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

/**
 * Get analytics events summary
 * GET /api/admin/analytics/events?range=7d|30d|90d
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') || '30d'
    
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Firebase Admin not configured' }, { status: 500 })
    }

    // Calculate date range
    const now = new Date()
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
    const daysAgo = daysMap[range] || 30
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const startDateStr = startDate.toISOString().split('T')[0]

    // Get events from analytics_events collection
    const eventsRef = adminDb.collection('analytics_events')
    const snapshot = await eventsRef
      .where('date', '>=', startDateStr)
      .orderBy('date', 'asc')
      .limit(10000)
      .get()

    const events = snapshot.docs.map(doc => doc.data())

    // Aggregate data
    const uniqueUsers = new Set<string>()
    const dailyUsers = new Map<string, Set<string>>()
    const eventTypeCounts: Record<string, number> = {}
    const dailyEvents = new Map<string, number>()
    const userRoleCounts: Record<string, number> = {}
    
    let signupsAgent = 0
    let signupsBroker = 0
    let signupsUser = 0
    let listingsCreated = 0
    let listingsViewed = 0
    let searchesPerformed = 0
    let favoritesAdded = 0
    let leadsCreated = 0
    let errorCount = 0

    events.forEach(event => {
      const userId = event.userId
      const date = event.date
      const eventType = event.eventType
      const userRole = event.userRole

      // Track unique users
      if (userId && userId !== 'anonymous') {
        uniqueUsers.add(userId)
        
        // Daily active users
        if (!dailyUsers.has(date)) {
          dailyUsers.set(date, new Set())
        }
        dailyUsers.get(date)!.add(userId)
      }

      // Event type counts
      eventTypeCounts[eventType] = (eventTypeCounts[eventType] || 0) + 1

      // Daily event counts
      dailyEvents.set(date, (dailyEvents.get(date) || 0) + 1)

      // User role counts
      if (userRole && userRole !== 'visitor') {
        userRoleCounts[userRole] = (userRoleCounts[userRole] || 0) + 1
      }

      // Specific metrics
      if (eventType === 'signup') {
        if (userRole === 'agent') signupsAgent++
        else if (userRole === 'broker') signupsBroker++
        else signupsUser++
      }
      else if (eventType === 'listing_create') listingsCreated++
      else if (eventType === 'listing_view') listingsViewed++
      else if (eventType === 'search_performed') searchesPerformed++
      else if (eventType === 'favorite_added') favoritesAdded++
      else if (eventType === 'lead_create') leadsCreated++
      else if (eventType === 'error') errorCount++
    })

    // Calculate DAU trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
      return d.toISOString().split('T')[0]
    })
    
    const dauTrend = last7Days.map(date => ({
      date,
      users: dailyUsers.get(date)?.size || 0
    }))

    // Calculate current DAU (today)
    const today = now.toISOString().split('T')[0]
    const dau = dailyUsers.get(today)?.size || 0

    // Calculate WAU (last 7 days unique users)
    const last7DaysUsers = new Set<string>()
    last7Days.forEach(date => {
      dailyUsers.get(date)?.forEach(uid => last7DaysUsers.add(uid))
    })
    const wau = last7DaysUsers.size

    // Calculate MAU (all unique users in range)
    const mau = uniqueUsers.size

    // Top events
    const topEvents = Object.entries(eventTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([eventType, count]) => ({ eventType, count }))

    return NextResponse.json({
      ok: true,
      data: {
        summary: {
          totalEvents: events.length,
          uniqueUsers: uniqueUsers.size,
          dau,
          wau,
          mau,
          signups: {
            agent: signupsAgent,
            broker: signupsBroker,
            user: signupsUser,
            total: signupsAgent + signupsBroker + signupsUser
          },
          listings: {
            created: listingsCreated,
            viewed: listingsViewed
          },
          engagement: {
            searches: searchesPerformed,
            favorites: favoritesAdded,
            leads: leadsCreated
          },
          errors: errorCount
        },
        trends: {
          dauTrend,
          topEvents,
          userRoleCounts
        }
      }
    })
  } catch (error: any) {
    console.error('Error fetching analytics events:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to fetch analytics' 
    }, { status: 500 })
  }
}
