// app/api/user/stats/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore'
import { getSession } from '@/lib/authSession'

export async function GET() {
  try {
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
    const statsRef = doc(db, 'user_stats', session.uid)
    const statsSnap = await getDoc(statsRef)

    if (!statsSnap.exists()) {
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
      
      await setDoc(statsRef, initialStats)
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
    const session = await getSession()
    
    if (!session?.uid) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
    }

    const { action } = await request.json()
    // action can be: 'property_view', 'search', 'favorite_add'

    const statsRef = doc(db, 'user_stats', session.uid)
    const statsSnap = await getDoc(statsRef)

    let points = 0
    let updates: any = {}

    switch (action) {
      case 'property_view':
        updates.propertiesViewed = increment(1)
        points = 2
        break
      case 'search':
        updates.searchesMade = increment(1)
        points = 5
        break
      case 'favorite_add':
        updates.favoritesSaved = increment(1)
        points = 10
        break
      default:
        return NextResponse.json({ ok: false, error: 'Acción inválida' }, { status: 400 })
    }

    updates.points = increment(points)
    updates.lastActivity = new Date().toISOString()

    if (!statsSnap.exists()) {
      // Create initial stats with the action
      await setDoc(statsRef, {
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
      await updateDoc(statsRef, updates)

      // Check for level up
      const currentStats = statsSnap.data()
      const newPoints = (currentStats.points || 0) + points
      const currentLevel = currentStats.level || 1
      const nextLevelPoints = currentStats.nextLevelPoints || 100

      if (newPoints >= nextLevelPoints) {
        await updateDoc(statsRef, {
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
