// app/api/favorites/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { getSession } from '@/lib/authSession'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session?.uid) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
    }

    // Query user's favorites from Firestore
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', session.uid),
      orderBy('savedAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    const favorites = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({ ok: true, favorites })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ ok: false, error: 'Error al obtener favoritos' }, { status: 500 })
  }
}
