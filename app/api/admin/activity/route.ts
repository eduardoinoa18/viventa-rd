// app/api/admin/activity/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { db } from '@/lib/firebaseClient'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitNum = parseInt(searchParams.get('limit') || '20')

    // Try Admin SDK first
    const adminDb = getAdminDb()
    if (adminDb) {
      const snapshot = await adminDb
        .collection('activity_logs')
        .orderBy('timestamp', 'desc')
        .limit(limitNum)
        .get()

      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      }))

      return NextResponse.json({ ok: true, data: logs })
    }

    // Fallback to client SDK
      const q = query(
      collection(db, 'activity_logs'),
      orderBy('timestamp', 'desc'),
      limit(limitNum)
    )
    const snapshot = await getDocs(q)
    const logs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: (doc.data().timestamp as any)?.toDate?.()?.toISOString() || new Date().toISOString()
    }))

    return NextResponse.json({ ok: true, data: logs })
  } catch (error: any) {
    console.error('Activity logs error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, action, userId, userName, userEmail, metadata } = body

    if (!type || !action) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    const log = {
      type, // 'user', 'application', 'property', 'system'
      action, // 'created', 'updated', 'approved', 'rejected', 'deleted'
      userId: userId || null,
      userName: userName || null,
      userEmail: userEmail || null,
      metadata: metadata || {},
      timestamp: new Date(),
    }

    if (adminDb) {
      await adminDb.collection('activity_logs').add(log)
    } else {
      // Fallback to client SDK
      const { addDoc, collection: fbCollection, serverTimestamp } = await import('firebase/firestore')
      await addDoc(fbCollection(db, 'activity_logs'), {
        ...log,
        timestamp: serverTimestamp()
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Log activity error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
