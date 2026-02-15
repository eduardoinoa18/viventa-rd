// app/api/admin/users/sync/route.ts
import { NextResponse } from 'next/server'
import { getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin'
import { ActivityLogger } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const adminDb = getAdminDb()
    const adminAuth = getAdminAuth()
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured. Add FIREBASE_ADMIN_* env vars.' }, { status: 500 })
    }

    let nextPageToken: string | undefined
    let created = 0
    let updated = 0
    let total = 0

    do {
      const res = await adminAuth.listUsers(1000, nextPageToken)
      for (const user of res.users) {
        total += 1
        const email = (user.email || '').toLowerCase()
        const providerIds = user.providerData.map(p => p.providerId)
        const creationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date()
        const lastSignInTime = user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null

        const payload: any = {
          uid: user.uid,
          name: user.displayName || '',
          email,
          phone: user.phoneNumber || '',
          photoURL: user.photoURL || '',
          emailVerified: user.emailVerified || false,
          disabled: !!user.disabled,
          providerIds,
          lastLoginAt: lastSignInTime,
          updatedAt: new Date(),
        }

        // Try to find by uid doc first
        const uidDoc = await adminDb.collection('users').doc(user.uid).get()
        if (uidDoc.exists) {
          // Preserve existing role/status if present
          await adminDb.collection('users').doc(user.uid).set(payload, { merge: true })
          updated += 1
          continue
        }
        // Else try by email
        if (email) {
          const byEmail = await adminDb.collection('users').where('email', '==', email).limit(1).get()
          if (!byEmail.empty) {
            const docRef = byEmail.docs[0].ref
            await docRef.set({ ...payload, uid: user.uid }, { merge: true })
            updated += 1
            continue
          }
        }
        // Else create new with doc id = uid
        const newDoc = {
          ...payload,
          role: 'buyer',
          status: user.disabled ? 'suspended' : 'active',
          createdAt: creationTime,
        }
        await adminDb.collection('users').doc(user.uid).set(newDoc, { merge: true })
        created += 1
      }
      nextPageToken = res.pageToken
    } while (nextPageToken)

    // Log sync activity
    ActivityLogger.authSync('admin@viventa.com', created, updated)

    return NextResponse.json({ ok: true, data: { created, updated, total }, message: 'Sync completed' })
  } catch (e: any) {
    console.error('admin users sync error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to sync users' }, { status: 500 })
  }
}
