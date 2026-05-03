/**
 * 2FA Verification API
 * Verifies code, updates custom claims, and recreates session cookie.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebaseAdmin'
import { getServerSession, createSessionCookie } from '@/lib/auth/session'
import { verificationCodes } from '@/lib/verificationStore'
import { keyFromRequest, rateLimit } from '@/lib/rateLimiter'

function applyNoStoreHeaders(response: NextResponse) {
  response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

function noStoreJson(body: any, init?: ResponseInit) {
  return applyNoStoreHeaders(NextResponse.json(body, init))
}

async function signInWithCustomToken(apiKey: string, token: string): Promise<{ idToken: string }> {
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
    throw new Error(data?.error?.message || 'CUSTOM_TOKEN_EXCHANGE_FAILED')
  }

  return data as { idToken: string }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null)
    const code = String(payload?.code || '').trim()

    if (!code) {
      return noStoreJson({ ok: false, error: 'Codigo requerido' }, { status: 400 })
    }

    const session = await getServerSession()
    if (!session || !session.uid || !session.email) {
      return noStoreJson(
        { ok: false, error: 'Sesion no encontrada. Inicia sesion nuevamente.' },
        { status: 401 }
      )
    }

    if (session.role !== 'master_admin') {
      return noStoreJson({ ok: false, error: 'Solo master admin requiere 2FA' }, { status: 403 })
    }

    const rl = await rateLimit(keyFromRequest(req, session.email), 8, 60_000)
    if (!rl.allowed) {
      return noStoreJson(
        { ok: false, error: 'Demasiados intentos. Intenta mas tarde.' },
        { status: 429 }
      )
    }

    const emailKey = session.email.toLowerCase()
    const codeData = verificationCodes.get(emailKey)
    if (!codeData) {
      return noStoreJson({ ok: false, error: 'Codigo no encontrado o expirado' }, { status: 404 })
    }

    if (Date.now() > codeData.expiresAt) {
      verificationCodes.delete(emailKey)
      return noStoreJson({ ok: false, error: 'Codigo expirado. Solicita uno nuevo.' }, { status: 401 })
    }

    if (code !== codeData.code) {
      codeData.attempts += 1
      if (codeData.attempts >= 3) {
        verificationCodes.delete(emailKey)
        return noStoreJson(
          { ok: false, error: 'Demasiados intentos. Solicita un nuevo codigo.' },
          { status: 401 }
        )
      }
      return noStoreJson({ ok: false, error: 'Codigo invalido' }, { status: 401 })
    }

    const adminAuth = getAdminAuth()
    if (!adminAuth) {
      return noStoreJson(
        { ok: false, error: 'Error de configuracion del servidor' },
        { status: 500 }
      )
    }

    await adminAuth.setCustomUserClaims(session.uid, {
      role: 'master_admin',
      twoFactorVerified: true,
      lastVerified: Date.now(),
    })

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    if (!apiKey) {
      return noStoreJson(
        { ok: false, error: 'Configuracion de Firebase incompleta' },
        { status: 500 }
      )
    }

    const customToken = await adminAuth.createCustomToken(session.uid)
    const tokenData = await signInWithCustomToken(apiKey, customToken)
    const { value: sessionCookie, options } = await createSessionCookie(tokenData.idToken)

    verificationCodes.delete(emailKey)

    const response = NextResponse.json({
      ok: true,
      user: {
        uid: session.uid,
        email: session.email,
        role: 'master_admin',
      },
      redirect: '/master',
    })

    response.cookies.set('__session', sessionCookie, options)
    return applyNoStoreHeaders(response)
  } catch (error) {
    console.error('2FA verification error:', error)
    return noStoreJson({ ok: false, error: 'Error del servidor' }, { status: 500 })
  }
}
