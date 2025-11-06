// app/api/gamification/leaderboard/route.ts
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { db } from '@/lib/firebaseClient'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'

export async function GET() {
  try {
    // Get top 100 agents by points
    const q = query(
      collection(db, 'gamification_stats'),
      orderBy('points', 'desc'),
      limit(100)
    )

    const snapshot = await getDocs(q)
    const leaderboard = snapshot.docs.map((d: any, index: number) => {
      const data = d.data()
      return {
        id: d.id,
        name: data.name || 'Agente',
        avatar: data.avatar,
        points: data.points || 0,
        level: data.level || 1,
        rank: index + 1,
        trend: data.trend || 'same',
      }
    })

    return NextResponse.json({ ok: true, leaderboard })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ ok: false, error: 'Error al obtener tabla de líderes' }, { status: 500 })
  }
}
