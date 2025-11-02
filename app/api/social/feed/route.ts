// app/api/social/feed/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'

export async function GET() {
  try {
    const q = query(
      collection(db, 'social_posts'),
      orderBy('timestamp', 'desc'),
      limit(50)
    )

    const snapshot = await getDocs(q)
    const posts = snapshot.docs.map((d: any) => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      }
    })

    return NextResponse.json({ ok: true, posts })
  } catch (error) {
    console.error('Error fetching social feed:', error)
    return NextResponse.json({ ok: false, error: 'Error al cargar feed' }, { status: 500 })
  }
}
