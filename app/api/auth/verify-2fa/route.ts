/**
 * 2FA Verification API
 * Verifies code and updates custom claims
 * Recreates session cookie with twoFactorVerified=true
 */

import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { getAdminAuth } from '@/lib/firebaseAdmin'
import { getServerSession, createSessionCookie } from '@/lib/auth/session'

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

    // 2. Verify user is master_admin
    if (session.role !== 'master_admin') {
      return NextResponse.json(
        { ok: false, error: 'Solo master admin requiere 2FA' },
        { status: 403 }
      )
    }

    // 3. Fetch stored 2FA code from Firestore
    const codeDocRef = doc(db, 'twoFactorCodes', uid)
    const codeDoc = await getDoc(codeDocRef)

    if (!codeDoc.exists()) {
      return NextResponse.json(
        { ok: false, error: 'Código no encontrado o expirado' },
        { status: 404 }
      )
    }

    const codeData = codeDoc.data()
    const storedCode = codeData?.code
    const expiresAt = codeData?.expiresAt

    // 4. Validate code and expiration
    if (code !== storedCode) {
      return NextResponse.json(
        { ok: false, error: 'Código inválido' },
        { status: 401 }
      )
    }

    if (Date.now() > expiresAt) {
      await deleteDoc(codeDocRef)
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

    // 6. Get fresh ID token with updated claims
    const user = await adminAuth.getUser(uid)
    const customToken = await adminAuth.createCustomToken(uid)
    
    // Sign in with custom token to get ID token
    // Note: This is server-side, so we use Admin SDK to create the token
    // Client will need to refresh their token, but we can force it via session cookie
    
    // 7. CRITICAL: Recreate session cookie with new claims
    // We need to generate a new ID token with updated claims
    // Admin SDK doesn't directly give us ID tokens, so we use a workaround:
    // Create a new session cookie from a fresh custom token
    
    // The user's existing session cookie will have stale claims
    // We need to create a completely new session cookie
    
    // For now, we'll use the custom token approach
    // In production, you might want to have the client re-authenticate
    // But for seamless UX, we can create a new session cookie
    
    // Actually, we need to be smarter here. Let me use a different approach:
    // We'll create a short-lived custom token, and the client will use it to sign in
    // But we're server-side, so we need to create the session cookie directly
    
    // Best approach: Create a new custom token, exchange it for an ID token server-side
    // Using firebase-admin's session cookie creation
    
    // Import necessary for token exchange (client-side auth on server)
    const { signInWithCustomToken } = await import('firebase/auth')
    const { auth } = await import('@/lib/firebaseClient')
    
    // Sign in with custom token to get ID token
    const userCredential = await signInWithCustomToken(auth, customToken)
    const idToken = await userCredential.user.getIdToken(true)
    
    // Create new session cookie with updated claims
    const { value: sessionCookie, options } = await createSessionCookie(idToken)

    // 8. Clean up 2FA code
    await deleteDoc(codeDocRef)

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

    return response
  } catch (error) {
    console.error('2FA verification error:', error)
    return NextResponse.json(
      { ok: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
