import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin'
import { createSessionCookie, getSessionFromRequest } from '@/lib/auth/session'
import { normalizeLifecycleStatus } from '@/lib/userLifecycle'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function signInWithCustomToken(apiKey: string, token: string) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, returnSecureToken: true }),
    }
  )

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(String(data?.error?.message || 'INVALID_CUSTOM_TOKEN'))
  }

  return data as { idToken: string }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })
    }

    const impersonation = session.impersonation
    if (!impersonation?.active || !impersonation.adminId || !impersonation.adminEmail) {
      return NextResponse.json({ ok: false, error: 'No active impersonation session' }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'Missing Firebase API key' }, { status: 500 })
    }

    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const [adminAuthUser, adminUserDoc] = await Promise.all([
      adminAuth.getUser(impersonation.adminId),
      adminDb.collection('users').doc(impersonation.adminId).get(),
    ])

    const adminRole = String(adminUserDoc.data()?.role || '')
    const adminStatus = normalizeLifecycleStatus(adminUserDoc.data()?.status)
    const adminEmail = String(adminAuthUser.email || '').trim().toLowerCase()

    if (adminRole !== 'master_admin') {
      return NextResponse.json({ ok: false, error: 'Original account no longer has master admin role' }, { status: 403 })
    }

    if (!adminEmail || adminEmail !== impersonation.adminEmail) {
      return NextResponse.json({ ok: false, error: 'Impersonation metadata mismatch' }, { status: 403 })
    }

    if (adminStatus === 'suspended' || adminStatus === 'archived') {
      return NextResponse.json({ ok: false, error: `Original admin account is ${adminStatus}` }, { status: 403 })
    }

    await adminAuth.setCustomUserClaims(impersonation.adminId, {
      role: 'master_admin',
      status: adminStatus,
      twoFactorVerified: true,
      impersonation: null,
      lastUpdated: Date.now(),
    })

    await adminDb.collection('audit_logs').add({
      action: 'ADMIN_IMPERSONATION_ENDED',
      actor: impersonation.adminId,
      actorEmail: impersonation.adminEmail,
      target: session.uid,
      targetEmail: session.email || null,
      ts: new Date(),
      payload: {
        startedAt: impersonation.startedAt,
        endedAt: Date.now(),
        endpoint: '/api/admin/stop-impersonation',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const customToken = await adminAuth.createCustomToken(impersonation.adminId)
    const tokenData = await signInWithCustomToken(apiKey, customToken)
    const { value: sessionCookie, options } = await createSessionCookie(tokenData.idToken)

    const response = NextResponse.json({
      ok: true,
      redirect: '/master',
      restored: {
        uid: impersonation.adminId,
        email: impersonation.adminEmail,
        role: 'master_admin',
      },
    })

    response.cookies.set('__session', sessionCookie, options)
    response.cookies.set('viventa_role', 'master_admin', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    response.cookies.set('viventa_uid', impersonation.adminId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    response.cookies.delete('viventa_impersonating')
    response.cookies.delete('viventa_impersonated_by')

    return response
  } catch (error: any) {
    if (error?.code === 'auth/user-not-found') {
      return NextResponse.json({ ok: false, error: 'Original admin account not found' }, { status: 404 })
    }

    console.error('[admin/stop-impersonation] error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to stop impersonation' }, { status: 500 })
  }
}
