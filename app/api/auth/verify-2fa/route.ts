/**
 * 2FA Verification API
 * Verifies code and updates custom claims
 * Recreates session cookie with twoFactorVerified=true
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebaseAdmin'
import { getServerSession, createSessionCookie } from '@/lib/auth/session'
import { verificationCodes } from '@/lib/verificationStore'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json(
        { ok: false, error: 'Código requerido' },
        { status: 400 }
      )
    }

    // 1. Get current session from cookie
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Sesión no encontrada. Inicia sesión nuevamente.' },
        { status: 401 }
      )
    }

    const { uid, email } = session

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'Email no encontrado en sesión' },
        { status: 400 }
      )
    }

    // 2. Verify user is master_admin
    if (session.role !== 'master_admin') {
      return NextResponse.json(
        { ok: false, error: 'Solo master admin requiere 2FA' },
        { status: 403 }
      )
    }

    // 3. Fetch stored 2FA code from in-memory store (keyed by email)
    const emailKey = email.toLowerCase()
    const codeData = verificationCodes.get(emailKey)

    if (!codeData) {
      return NextResponse.json(
        { ok: false, error: 'Código no encontrado o expirado' },
        { status: 404 }
      )
    }

    const storedCode = codeData.code
    const expiresAt = codeData.expiresAt

    // 4. Validate code and expiration
    if (code !== storedCode) {
      // Increment attempts
      codeData.attempts++
      if (codeData.attempts >= 3) {
        verificationCodes.delete(emailKey)
        return NextResponse.json(
          { ok: false, error: 'Demasiados intentos. Solicita un nuevo código.' },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { ok: false, error: 'Código inválido' },
        { status: 401 }
      )
    }

    if (Date.now() > expiresAt) {
      verificationCodes.delete(emailKey)
      return NextResponse.json(
        { ok: false, error: 'Código expirado. Solicita uno nuevo.' },
        { status: 401 }
      )
    }

    // 5. Update custom claims (CRITICAL: Mark 2FA as verified)
    const adminAuth = getAdminAuth()
    if (!adminAuth) {
      return NextResponse.json(
        { ok: false, error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    await adminAuth.setCustomUserClaims(uid, {
      role: 'master_admin',
      twoFactorVerified: true, // NOW VERIFIED
      lastVerified: Date.now(),
    })

    // 6. Create custom token and exchange for ID token with updated claims
    const customToken = await adminAuth.createCustomToken(uid)
    
    console.log('✅ Created custom token for UID:', uid)
    
    // Import client auth to sign in with custom token
    const { signInWithCustomToken } = await import('firebase/auth')
    const { auth } = await import('@/lib/firebaseClient')
    
    if (!auth) {
      console.error('❌ Firebase client auth not initialized')
      return NextResponse.json(
        { ok: false, error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }
    
    console.log('🔐 Signing in with custom token...')
    
    // Sign in with custom token to get ID token with updated claims
    const userCredential = await signInWithCustomToken(auth, customToken)
    const idToken = await userCredential.user.getIdToken(true)
    
    console.log('✅ Got ID token with updated claims')
    
    // 7. Create new session cookie with updated claims
    const { value: sessionCookie, options } = await createSessionCookie(idToken)
    
    console.log('✅ Created new session cookie')

    // 8. Clean up 2FA code from in-memory store
    verificationCodes.delete(emailKey)

    // 9. Return success and set new session cookie
    const response = NextResponse.json({
      ok: true,
      user: {
        uid,
        email,
        role: 'master_admin',
      },
      redirect: '/master',
    })

    response.cookies.set('__session', sessionCookie, options)
    
    console.log('✅ 2FA verification complete - redirecting to /master')

    return response
  } catch (error) {
    console.error('2FA verification error:', error)
    return NextResponse.json(
      { ok: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
