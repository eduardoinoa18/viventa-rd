import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin'
import { createSessionCookie } from '@/lib/auth/session'
import { requireMasterAdmin, AdminAuthError } from '@/lib/requireMasterAdmin'
import { normalizeLifecycleStatus } from '@/lib/userLifecycle'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const authErrorMessages: Record<string, string> = {
  EMAIL_NOT_FOUND: 'Usuario no encontrado',
  INVALID_CUSTOM_TOKEN: 'Token de impersonación inválido',
}

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
    const code = String(data?.error?.message || 'INVALID_CUSTOM_TOKEN')
    const message = authErrorMessages[code] || 'No se pudo crear sesión de impersonación'
    const err = new Error(message) as Error & { code?: string }
    err.code = code
    throw err
  }

  return data as { idToken: string }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireMasterAdmin(req)
    const body = await req.json().catch(() => ({}))
    const userId = String(body?.userId || '').trim()

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'userId is required' }, { status: 400 })
    }

    if (userId === admin.uid) {
      return NextResponse.json({ ok: false, error: 'Cannot impersonate current master admin account' }, { status: 400 })
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

    const [authUser, userDoc] = await Promise.all([
      adminAuth.getUser(userId),
      adminDb.collection('users').doc(userId).get(),
    ])

    const userData = userDoc.exists ? userDoc.data() || {} : {}
    const role = String(userData?.role || 'buyer')
    const status = normalizeLifecycleStatus(userData?.status)

    if (role === 'master_admin') {
      return NextResponse.json({ ok: false, error: 'Cannot impersonate another master admin' }, { status: 403 })
    }

    if (status === 'suspended' || status === 'archived') {
      return NextResponse.json({ ok: false, error: `Cannot impersonate ${status} user` }, { status: 403 })
    }

    const startedAt = Date.now()
    const impersonationMetadata = {
      active: true,
      adminId: admin.uid,
      adminEmail: admin.email,
      startedAt,
    }

    await adminAuth.setCustomUserClaims(userId, {
      role,
      status,
      twoFactorVerified: role !== 'master_admin',
      impersonatedBy: admin.uid,
      impersonation: impersonationMetadata,
      lastUpdated: Date.now(),
    })

    await adminDb.collection('audit_logs').add({
      action: 'ADMIN_IMPERSONATION_STARTED',
      actor: admin.uid,
      actorEmail: admin.email,
      target: userId,
      targetEmail: authUser.email || null,
      ts: new Date(),
      payload: {
        targetRole: role,
        startedAt,
        impersonation: impersonationMetadata,
        endpoint: '/api/admin/users/impersonate',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const customToken = await adminAuth.createCustomToken(userId)
    const tokenData = await signInWithCustomToken(apiKey, customToken)
    const { value: sessionCookie, options } = await createSessionCookie(tokenData.idToken)

    const redirectMap: Record<string, string> = {
      master_admin: '/master',
      admin: '/master',
      buyer: '/dashboard',
      user: '/dashboard',
      agent: '/master',
      broker: '/master',
      constructora: '/master',
    }

    const response = NextResponse.json({
      ok: true,
      redirect: redirectMap[role] || '/dashboard',
      impersonated: {
        uid: userId,
        email: authUser.email || null,
        role,
        name: String(userData?.name || authUser.displayName || authUser.email || userId),
      },
    })

    response.cookies.set('__session', sessionCookie, options)
    response.cookies.set('viventa_role', role, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    response.cookies.set('viventa_uid', userId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    response.cookies.set('viventa_impersonating', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    response.cookies.set('viventa_impersonated_by', admin.uid, {
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      )
    }

    if (error?.code === 'auth/user-not-found') {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    console.error('[admin/users/impersonate] error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to impersonate user' }, { status: 500 })
  }
}
