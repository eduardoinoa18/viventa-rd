import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json()
    if (!uid) return NextResponse.json({ ok: false, error: 'Missing uid' }, { status: 400 })
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'No admin db' }, { status: 500 })
    await db.collection('users').doc(uid).set({ online: false, lastSeen: (await import('firebase-admin/firestore')).Timestamp.now() }, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'presence off failed' }, { status: 500 })
  }
}
