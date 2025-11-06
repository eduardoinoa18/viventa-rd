// app/api/favorites/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminDb } from '@/lib/firebaseAdmin'

// This route reads cookies; ensure it's treated as dynamic at build time
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Identify user via cookie set during login (middleware uses this too)
    const uid = cookies().get('viventa_uid')?.value
    if (!uid) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
    }

    const db = getAdminDb()
    if (!db) {
      console.error('Admin DB not available')
      return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })
    }

    // Query user's favorites from Firestore (Admin SDK)
    const snap = await db
      .collection('favorites')
      .where('userId', '==', uid)
      .orderBy('savedAt', 'desc')
      .get()

    const favorites = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    return NextResponse.json({ ok: true, favorites })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ ok: false, error: 'Error al obtener favoritos' }, { status: 500 })
  }
}
