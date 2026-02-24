import { NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebaseAdmin'

const FIREBASE_AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword'

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status })
}

async function signInWithPassword(email: string, password: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) {
    throw new Error('FIREBASE_API_KEY_NOT_CONFIGURED')
  }

  const res = await fetch(`${FIREBASE_AUTH_BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  })

  const body = await res.json()
  if (!res.ok) {
    const reason = body?.error?.message || 'INVALID_CREDENTIALS'
    const status = reason === 'INVALID_PASSWORD' || reason === 'EMAIL_NOT_FOUND' ? 401 : 400
    return { ok: false as const, status, reason }
  }

  return {
    ok: true as const,
    uid: body.localId as string,
    idToken: body.idToken as string,
    refreshToken: body.refreshToken as string,
    email: body.email as string,
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const idToken = String(body?.idToken || '')

    if (!idToken && (!email || !password)) {
      return jsonError(400, 'email and password are required (or provide idToken)')
    }

    const adminAuth = getAdminAuth()

    // Path 1: Client already authenticated and sends ID token for verification.
    if (idToken) {
      if (!adminAuth) return jsonError(503, 'Admin auth not configured for token verification')
      const decoded = await adminAuth.verifyIdToken(idToken)
      return NextResponse.json({
        ok: true,
        uid: decoded.uid,
        email: decoded.email || null,
        token: idToken,
        role: String(decoded.role || decoded.userRole || 'user'),
      })
    }

    // Path 2: Credential login via Firebase Auth REST API.
    const login = await signInWithPassword(email, password)
    if (!login.ok) {
      return jsonError(login.status, login.reason)
    }

    let role = 'user'
    if (adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(login.idToken)
        role = String(decoded.role || decoded.userRole || 'user')
      } catch {
        // Non-fatal: role remains default
      }
    }

    return NextResponse.json({
      ok: true,
      uid: login.uid,
      email: login.email,
      role,
      token: login.idToken,
      refreshToken: login.refreshToken,
    })
  } catch (e: any) {
    const message = String(e?.message || 'SERVER_ERROR')
    if (message.includes('FIREBASE_API_KEY_NOT_CONFIGURED')) {
      return jsonError(503, 'Firebase API key is not configured')
    }
    return jsonError(500, message)
  }
}
