/**
 * Unified Login API
 * Handles all user types: master_admin, buyer, agent, broker, constructora
 * Uses httpOnly session cookies (NO localStorage)
 */

import { NextRequest, NextResponse } from 'next/server'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebaseClient'
import { getAdminAuth } from '@/lib/firebaseAdmin'
import { createSessionCookie } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // 1. Authenticate with Firebase Auth
    let userCredential
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password)
    } catch (authError: any) {
      console.error('Auth error full:', authError)
      console.error('Auth error code:', authError.code)
      console.error('Auth error message:', authError.message)
      
      const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Email inválido',
        'auth/user-disabled': 'Usuario deshabilitado',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/invalid-credential': 'Credenciales inválidas',
      }

      return NextResponse.json(
        { ok: false, error: errorMessages[authError.code] || authError.message || 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const uid = userCredential.user.uid

    // 2. Fetch role from Firestore (SOURCE OF TRUTH)
    const userDocRef = doc(db, 'users', uid)
    const userDoc = await getDoc(userDocRef)
    
    let role = 'buyer' // Default role
    let userData = userDoc.data()

    if (userDoc.exists()) {
      role = userData?.role || 'buyer'
    } else {
      // Create user document if doesn't exist
      userData = {
        email,
        role: 'buyer',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await setDoc(userDocRef, userData)
    }

    // 3. Set custom claims on Firebase Auth token
    // For master_admin: Initial 2FA state is FALSE
    // For others: No 2FA required
    const adminAuth = getAdminAuth()
    if (!adminAuth) {
      return NextResponse.json(
        { ok: false, error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    await adminAuth.setCustomUserClaims(uid, {
      role: role,
      twoFactorVerified: role !== 'master_admin', // Only master needs 2FA
      lastUpdated: Date.now(),
    })

    // 4. Get fresh ID token with updated claims
    const idToken = await userCredential.user.getIdToken(true) // Force refresh

    // 5. Create secure session cookie (httpOnly)
    const { value: sessionCookie, options } = await createSessionCookie(idToken)

    // 6. Determine flow based on role
    if (role === 'master_admin') {
      // Master admin requires 2FA
      // Send verification code
      const sendCodeRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/send-master-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, uid }),
      })

      if (!sendCodeRes.ok) {
        return NextResponse.json(
          { ok: false, error: 'Error al enviar código 2FA' },
          { status: 500 }
        )
      }

      const sendCodeData = await sendCodeRes.json()

      // Set session cookie (but twoFactorVerified=false, so middleware will redirect)
      const response = NextResponse.json({
        ok: true,
        requires2FA: true,
        email,
        devCode: sendCodeData.devCode, // Only in development
      })

      response.cookies.set('__session', sessionCookie, options)

      return response
    } else {
      // Buyers and professionals: Direct login
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
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { ok: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
