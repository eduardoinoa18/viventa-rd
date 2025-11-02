// app/api/gamification/stats/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'User ID required' }, { status: 400 })
    }

    // Get user gamification stats
    const statsDoc = await getDoc(doc(db, 'gamification_stats', userId))
    
    if (!statsDoc.exists()) {
      // Initialize default stats for new users
      const defaultStats = {
        id: userId,
        name: 'Usuario',
        email: '',
        points: 0,
        level: 1,
        rank: 999,
        badges: [],
        achievements: [],
        stats: {
          listingsCreated: 0,
          listingsSold: 0,
          leadsGenerated: 0,
          leadsConverted: 0,
          revenue: 0,
        }
      }
      return NextResponse.json({ ok: true, stats: defaultStats })
    }

    const stats = { id: statsDoc.id, ...statsDoc.data() }

    return NextResponse.json({ ok: true, stats })
  } catch (error) {
    console.error('Error fetching gamification stats:', error)
    return NextResponse.json({ ok: false, error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}

// POST - Update stats (called when user performs actions)
export async function POST(request: Request) {
  try {
    const { userId, action, value } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Points mapping
    const pointsMap: Record<string, number> = {
      'listing_created': 50,
      'listing_sold': 500,
      'lead_generated': 10,
      'lead_converted': 100,
      'login': 5,
      'profile_updated': 25,
      'first_sale': 1000, // Bonus
      // Social actions
      'content_shared': 20,
      'content_liked': 2,
      'content_commented': 5,
    }

    const pointsEarned = pointsMap[action] || 0

    // TODO: Update Firestore stats
    // This will increment points, check for level ups, unlock badges, etc.

    return NextResponse.json({ 
      ok: true, 
      pointsEarned,
      message: `+${pointsEarned} puntos!` 
    })
  } catch (error) {
    console.error('Error updating gamification stats:', error)
    return NextResponse.json({ ok: false, error: 'Error al actualizar estadísticas' }, { status: 500 })
  }
}
