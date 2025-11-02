import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore'

function initFirebase() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
  const valid = Boolean(
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.storageBucket &&
    config.messagingSenderId &&
    config.appId
  )
  if (!valid) return null
  if (!getApps().length) initializeApp(config as any)
  return getFirestore()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ids: string[] = Array.isArray(body.ids) ? body.ids : []
    const status: 'active'|'rejected' = body.status
    if (!ids.length || !status) {
      return NextResponse.json({ ok: false, error: 'ids and status required' }, { status: 400 })
    }
    if (ids.length > 200) {
      return NextResponse.json({ ok: false, error: 'Too many ids (max 200)' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    if (adminDb) {
      const errors: Record<string, string> = {}
      await Promise.all(ids.map(async (id) => {
        try {
          const ref = adminDb.collection('properties').doc(id)
          const beforeSnap = await ref.get()
          await ref.update({ status, updatedAt: new Date() })
        } catch (e: any) {
          errors[id] = e?.message || 'update failed'
        }
      }))
      const ok = Object.keys(errors).length === 0
      return NextResponse.json({ ok, errors: ok ? undefined : errors })
    }

    const db = initFirebase()
    if (!db) return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 })

    const errors: Record<string, string> = {}
    await Promise.all(ids.map(async (id) => {
      try {
        const ref = doc(db, 'properties', id)
        const before = await getDoc(ref)
        await updateDoc(ref, { status, updatedAt: serverTimestamp() })
      } catch (e: any) {
        errors[id] = e?.message || 'update failed'
      }
    }))
    const ok = Object.keys(errors).length === 0
    return NextResponse.json({ ok, errors: ok ? undefined : errors })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Bulk update failed' }, { status: 500 })
  }
}
