// API route to sync offline favorites with Firestore (Admin SDK)
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminDb } from '@/lib/firebaseAdmin'

type PendingAction = { action: 'save' | 'remove'; propertyId: string; timestamp?: number }

// Uses cookies and writes; mark dynamic
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { actions } = await request.json()
    if (!actions || !Array.isArray(actions)) {
      return NextResponse.json({ ok: false, error: 'Invalid actions' }, { status: 400 })
    }

    const uid = cookies().get('viventa_uid')?.value
    if (!uid) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
    }

    const db = getAdminDb()
    if (!db) {
      console.error('Admin DB not available')
      return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })
    }

    // Use a batch for efficiency
    const batch = db.batch()
    let applied = 0
    const now = Date.now()

    for (const action of actions as PendingAction[]) {
      const propertyId = action?.propertyId
      if (!propertyId) continue
      const favId = `${uid}_${propertyId}`
      const ref = db.collection('favorites').doc(favId)

      if (action.action === 'save') {
        batch.set(ref, {
          id: favId,
          userId: uid,
          propertyId,
          savedAt: action.timestamp || now,
          // Extra fields are allowed if client provides (e.g., title, price) but keep minimal server write
        }, { merge: true })
        applied++
      } else if (action.action === 'remove') {
        batch.delete(ref)
        applied++
      }
    }

    if (applied > 0) {
      await batch.commit()
    }

    return NextResponse.json({ ok: true, synced: applied })
  } catch (error) {
    console.error('Favorites sync error:', error)
    return NextResponse.json({ ok: false, error: 'Sync failed' }, { status: 500 })
  }
}
