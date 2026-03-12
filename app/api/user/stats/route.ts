// app/api/user/stats/route.ts
import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'
import { getSession } from '@/lib/authSession'

export async function GET() {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    const session = await getSession()
    
    if (!session?.uid) {
      // Return default stats for guests
      return NextResponse.json({
        ok: true,
        stats: {
          propertiesViewed: 0,
          searchesMade: 0,
          favoritesSaved: 0,
          level: 1,
          points: 0,
          nextLevelPoints: 100
        }
      })
    }

    // Get user stats from Firestore
    const statsRef = db.collection('user_stats').doc(session.uid)
    const statsSnap = await statsRef.get()

    if (!statsSnap.exists) {
      // Create initial stats
      const initialStats = {
        userId: session.uid,
        propertiesViewed: 0,
        searchesMade: 0,
        favoritesSaved: 0,
        level: 1,
        points: 0,
        nextLevelPoints: 100,
        createdAt: new Date().toISOString()
      }
      
      await statsRef.set(initialStats)
      return NextResponse.json({ ok: true, stats: initialStats })
    }

    const stats = statsSnap.data()
    return NextResponse.json({ ok: true, stats })

  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json({ ok: false, error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}

// POST - Track user activity
export async function POST(request: Request) {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    const session = await getSession()
    
    if (!session?.uid) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
    }

    const { action } = await request.json()
    // action can be: 'property_view', 'search', 'favorite_add'

    const statsRef = db.collection('user_stats').doc(session.uid)
    const statsSnap = await statsRef.get()

    let points = 0
    const updates: Record<string, unknown> = {}

    switch (action) {
      case 'property_view':
        updates.propertiesViewed = FieldValue.increment(1)
        points = 2
        break
      case 'search':
        updates.searchesMade = FieldValue.increment(1)
        points = 5
        break
      case 'favorite_add':
        updates.favoritesSaved = FieldValue.increment(1)
        points = 10
        break
      default:
        return NextResponse.json({ ok: false, error: 'Acción inválida' }, { status: 400 })
    }

    updates.points = FieldValue.increment(points)
    updates.lastActivity = new Date().toISOString()

    if (!statsSnap.exists) {
      // Create initial stats with the action
      await statsRef.set({
        userId: session.uid,
        propertiesViewed: action === 'property_view' ? 1 : 0,
        searchesMade: action === 'search' ? 1 : 0,
        favoritesSaved: action === 'favorite_add' ? 1 : 0,
        level: 1,
        points,
        nextLevelPoints: 100,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      })
    } else {
      // Update existing stats
      await statsRef.update(updates)

      // Check for level up
      const currentStats = statsSnap.data() || {}
      const newPoints = (currentStats.points || 0) + points
      const currentLevel = currentStats.level || 1
      const nextLevelPoints = currentStats.nextLevelPoints || 100

      if (newPoints >= nextLevelPoints) {
        await statsRef.update({
          level: currentLevel + 1,
          nextLevelPoints: nextLevelPoints + 50 // Increase by 50 for each level
        })
      }
    }

    return NextResponse.json({ ok: true, pointsEarned: points })

  } catch (error) {
    console.error('Error tracking user activity:', error)
    return NextResponse.json({ ok: false, error: 'Error al rastrear actividad' }, { status: 500 })
  }
}
