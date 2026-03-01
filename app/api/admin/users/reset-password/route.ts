import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebaseAdmin'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { withMasterAdmin } from '@/lib/requireMasterAdmin'

export async function POST(req: NextRequest) {
  return withMasterAdmin(req, async () => {
    try {
      const { uid, email } = await req.json()
      if (!uid && !email) {
        return NextResponse.json({ ok: false, error: 'uid or email required' }, { status: 400 })
      }

      const adminAuth = getAdminAuth()
      if (!adminAuth) {
        return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
      }

      let targetEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

      if (!targetEmail && uid) {
        try {
          const authUser = await adminAuth.getUser(String(uid))
          targetEmail = (authUser.email || '').trim().toLowerCase()
        } catch (lookupError: any) {
          // Fallback: some legacy users may provide a Firestore doc id instead of Firebase Auth uid
          if (lookupError?.code === 'auth/user-not-found') {
            const adminDb = getAdminDb()
            if (adminDb) {
              const byDoc = await adminDb.collection('users').doc(String(uid)).get()
              if (byDoc.exists) {
                const candidate = byDoc.data()?.email
                if (typeof candidate === 'string') targetEmail = candidate.trim().toLowerCase()
              }
              if (!targetEmail) {
                const byUid = await adminDb.collection('users').where('uid', '==', String(uid)).limit(1).get()
                if (!byUid.empty) {
                  const candidate = byUid.docs[0].data()?.email
                  if (typeof candidate === 'string') targetEmail = candidate.trim().toLowerCase()
                }
              }
            }
          } else {
            throw lookupError
          }
        }
      }

      if (!targetEmail) {
        return NextResponse.json({ ok: false, error: 'Email not found for user' }, { status: 404 })
      }

      const link = await adminAuth.generatePasswordResetLink(targetEmail)
      return NextResponse.json({ ok: true, resetLink: link })
    } catch (e: any) {
      console.error('reset-password error', e)

      if (e?.code === 'auth/user-not-found') {
        return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
      }
      if (e?.code === 'auth/invalid-email') {
        return NextResponse.json({ ok: false, error: 'Invalid email' }, { status: 400 })
      }

      return NextResponse.json(
        { ok: false, error: e?.message || 'Failed to generate reset link' },
        { status: 500 }
      )
    }
  })
}
