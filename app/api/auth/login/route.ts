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
    const { email, password } = await req.json()

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

    // 1. Verify credentials using Firebase Auth REST API
    const signInData = await signInWithPassword(apiKey, email, password)
    const uid = signInData.localId

    // 2. Fetch role from Firestore (SOURCE OF TRUTH)
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    const userDocRef = adminDb.collection('users').doc(uid)
    const userDoc = await userDocRef.get()

    let role = 'buyer'
    if (userDoc.exists) {
      role = (userDoc.data()?.role as string) || 'buyer'
    } else {
      await userDocRef.set({
        email,
        role: 'buyer',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    // 3. Set custom claims on Firebase Auth
    const adminAuth = getAdminAuth()
    if (!adminAuth) {
      return NextResponse.json(
        { ok: false, error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    await adminAuth.setCustomUserClaims(uid, {
      role,
      twoFactorVerified: role !== 'master_admin',
      lastUpdated: Date.now(),
    })

    // 4. Exchange custom token for fresh ID token with updated claims
    const customToken = await adminAuth.createCustomToken(uid)
    const tokenData = await signInWithCustomToken(apiKey, customToken)
    const idToken = tokenData.idToken

    // 5. Create secure session cookie (httpOnly)
    const { value: sessionCookie, options } = await createSessionCookie(idToken)

    // 6. Determine flow based on role
    if (role === 'master_admin') {
      const sendCodeUrl = new URL('/api/auth/send-master-code', req.url)
      const sendCodeRes = await fetch(sendCodeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, uid }),
      })

      const sendCodeData = await sendCodeRes.json().catch(() => ({}))
      if (!sendCodeRes.ok) {
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
        { ok: false, error: authErrorMessages[error.code] },
        { status: 401 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { ok: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
