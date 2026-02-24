/**
 * Unified Login API
 * Handles all user types: master_admin, buyer, agent, broker, constructora
 * Uses httpOnly session cookies (NO localStorage)
 */

import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin'
import { createSessionCookie } from '@/lib/auth/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const authErrorMessages: Record<string, string> = {
  EMAIL_NOT_FOUND: 'Usuario no encontrado',
  INVALID_PASSWORD: 'Contraseña incorrecta',
  INVALID_EMAIL: 'Email inválido',
  USER_DISABLED: 'Usuario deshabilitado',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Demasiados intentos. Intenta más tarde',
}

function isMasterAdminEmail(email: string): boolean {
  const configured = (process.env.MASTER_ADMIN_EMAILS || process.env.MASTER_ADMIN_EMAIL || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  if (configured.length === 0) return false
  return configured.includes(email)
}

function matchesMasterAdminPassword(email: string, password: string): boolean {
  const masterPassword = String(process.env.MASTER_ADMIN_PASSWORD || '')
  if (!masterPassword) return false
  if (!isMasterAdminEmail(email)) return false
  return password === masterPassword
}

async function getOrCreateMasterAdminUid(adminAuth: NonNullable<ReturnType<typeof getAdminAuth>>, email: string): Promise<string> {
  try {
    const user = await adminAuth.getUserByEmail(email)
    return user.uid
  } catch {
    const created = await adminAuth.createUser({
      email,
      emailVerified: true,
      displayName: 'Master Admin',
    })
    return created.uid
  }
}

async function signInWithPassword(apiKey: string, email: string, password: string) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  )

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const code = data?.error?.message || 'INVALID_CREDENTIALS'
    const message = authErrorMessages[code] || 'Credenciales inválidas'
    const err = new Error(message) as Error & { code?: string }
    err.code = code
    throw err
  }

  return data as { idToken: string; localId: string; email: string }
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
    throw new Error(data?.error?.message || 'CUSTOM_TOKEN_FAILED')
  }

  return data as { idToken: string }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null)
    const email = String(payload?.email || '').trim().toLowerCase()
    const password = String(payload?.password || '')

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: 'Configuración de Firebase incompleta' },
        { status: 500 }
      )
    }

    const adminAuth = getAdminAuth()
    if (!adminAuth) {
      console.error('[LOGIN] Admin Auth not initialized')
      return NextResponse.json(
        { ok: false, error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    // 1. Verify credentials (Firebase Auth first, legacy master-admin fallback second)
    let uid = ''
    let usedMasterFallback = false
    try {
      const signInData = await signInWithPassword(apiKey, email, password)
      uid = signInData.localId
    } catch (signInError: any) {
      const isInvalidCredentialError = signInError?.code === 'EMAIL_NOT_FOUND' || signInError?.code === 'INVALID_PASSWORD'
      if (!isInvalidCredentialError || !matchesMasterAdminPassword(email, password)) {
        throw signInError
      }

      usedMasterFallback = true
      uid = await getOrCreateMasterAdminUid(adminAuth, email)
    }

    // 2. Fetch role from Firestore (SOURCE OF TRUTH)
    const adminDb = getAdminDb()
    if (!adminDb) {
      console.error('[LOGIN] Admin DB not initialized')
      return NextResponse.json(
        { ok: false, error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    const userDocRef = adminDb.collection('users').doc(uid)
    let userDoc
    try {
      userDoc = await userDocRef.get()
    } catch (dbError: any) {
      console.error('[LOGIN] Firestore fetch error:', dbError?.message)
      return NextResponse.json(
        { ok: false, error: 'Error al acceder a la base de datos' },
        { status: 500 }
      )
    }

    let role = usedMasterFallback ? 'master_admin' : 'buyer'
    if (userDoc.exists) {
      role = (userDoc.data()?.role as string) || role
      if (usedMasterFallback && role !== 'master_admin') {
        role = 'master_admin'
        await userDocRef.set(
          {
            role: 'master_admin',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
      }
    } else {
      await userDocRef.set({
        email,
        role,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    try {
      await adminAuth.setCustomUserClaims(uid, {
        role,
        twoFactorVerified: role !== 'master_admin',
        lastUpdated: Date.now(),
      })
    } catch (claimsError: any) {
      console.error('[LOGIN] Failed to set custom claims:', claimsError?.message)
      return NextResponse.json(
        { ok: false, error: 'Error al configurar permisos' },
        { status: 500 }
      )
    }

    // 4. Exchange custom token for fresh ID token with updated claims
    let customToken
    try {
      customToken = await adminAuth.createCustomToken(uid)
    } catch (tokenError: any) {
      console.error('[LOGIN] Failed to create custom token:', tokenError?.message)
      return NextResponse.json(
        { ok: false, error: 'Error al crear token de autenticación' },
        { status: 500 }
      )
    }

    let tokenData
    try {
      tokenData = await signInWithCustomToken(apiKey, customToken)
    } catch (exchangeError: any) {
      console.error('[LOGIN] Failed to exchange custom token:', exchangeError?.message)
      return NextResponse.json(
        { ok: false, error: 'Error al validar token' },
        { status: 500 }
      )
    }

    const idToken = tokenData.idToken

    // 5. Create secure session cookie (httpOnly)
    let sessionCookie, options
    try {
      const cookieData = await createSessionCookie(idToken)
      sessionCookie = cookieData.value
      options = cookieData.options
    } catch (cookieError: any) {
      console.error('[LOGIN] Failed to create session cookie:', cookieError?.message)
      return NextResponse.json(
        { ok: false, error: 'Error al crear sesión' },
        { status: 500 }
      )
    }

    // 6. Determine flow based on role
    if (role === 'master_admin') {
      const sendCodeUrl = new URL('/api/auth/send-master-code', req.url)
      let sendCodeRes
      try {
        sendCodeRes = await fetch(sendCodeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, uid }),
        })
      } catch (fetchError: any) {
        console.error('[LOGIN] Failed to call send-master-code:', fetchError?.message)
        return NextResponse.json(
          { ok: false, error: 'Error al enviar código 2FA' },
          { status: 500 }
        )
      }

      const sendCodeData = await sendCodeRes.json().catch(() => ({}))
      if (!sendCodeRes.ok) {
        console.error('[LOGIN] send-master-code failed:', sendCodeData?.error)
        return NextResponse.json(
          { ok: false, error: sendCodeData?.error || 'Error al enviar código 2FA' },
          { status: sendCodeRes.status || 500 }
        )
      }

      const response = NextResponse.json({
        ok: true,
        requires2FA: true,
        email,
        devCode: sendCodeData.devCode,
      })

      response.cookies.set('__session', sessionCookie, options)

      return response
    }

    const redirectMap: Record<string, string> = {
      buyer: '/search',
      agent: '/dashboard',
      broker: '/dashboard',
      constructora: '/dashboard',
    }

    const response = NextResponse.json({
      ok: true,
      requires2FA: false,
      redirect: redirectMap[role] || '/search',
      user: {
        uid,
        email,
        role,
      },
    })

    response.cookies.set('__session', sessionCookie, options)

    return response
  } catch (error: any) {
    if (error?.code && authErrorMessages[error.code]) {
      return NextResponse.json(
        { ok: false, error: authErrorMessages[error.code], errorCode: error.code },
        { status: 401 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { ok: false, error: 'Error del servidor', errorCode: error?.code || 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
