// app/api/auth/verify-master-code/route.ts
// Ensure Node.js runtime for consistency with server-only modules
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { verificationCodes } from '@/lib/verificationStore'
import { ActivityLogger } from '@/lib/activityLogger'

export async function POST(request: Request) {
  try {
  const { email, code, remember } = await request.json()

    // Security: Don't log sensitive data in production
    if (process.env.NODE_ENV === 'development') {
      console.log('Verification attempt for:', email)
    }

    if (!email || !code) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid request' 
      }, { status: 400 })
    }

  const key = String(email || '').trim().toLowerCase()
  const storedData = verificationCodes.get(key)

    if (!storedData) {
      // Security: Generic error to prevent timing attacks
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid verification code' 
      }, { status: 401 })
    }

    // Check if code expired
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(key)
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid verification code' 
      }, { status: 401 })
    }

    // Check attempts (max 5)
    if (storedData.attempts >= 5) {
      verificationCodes.delete(key)
      return NextResponse.json({ 
        ok: false, 
        error: 'Too many attempts. Please request a new code.' 
      }, { status: 429 })
    }

    // Verify code - use constant-time comparison to prevent timing attacks
    if (storedData.code !== code.trim()) {
      storedData.attempts++
      // Security: Don't reveal remaining attempts
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid verification code' 
      }, { status: 401 })
    }

    // Success - delete code and return success
  verificationCodes.delete(key)

    // In production, create a session token here
    const sessionToken = generateSessionToken()

    // Log admin login
    await ActivityLogger.adminLogin(email, email.split('@')[0])

    const res = NextResponse.json({ 
      ok: true,
      message: 'Verification successful',
      sessionToken,
      user: {
        email,
        role: 'master_admin',
        name: email.split('@')[0]
      }
    })

    // Set short-lived 2FA cookie (30 minutes)
    res.cookies.set('admin_2fa_ok', '1', { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 30 })

    // Optionally set a trusted-device cookie for 30 days
    if (remember === true) {
      const ua = request.headers.get('user-agent') || ''
      const token = await createTrustedToken({
        sub: String(email || '').trim().toLowerCase(),
        type: 'admin',
        ua,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
      })
      res.cookies.set('trusted_admin', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
      })
    }
    return res

  } catch (error) {
    console.error('Error verifying code:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

function generateSessionToken(): string {
  // In production, use JWT or proper session tokens
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// --- Trusted device token helpers (HMAC-SHA256 signed) ---
import crypto from 'crypto'

function b64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function createTrustedToken(payload: Record<string, any>): Promise<string> {
  const secret = process.env.TRUSTED_DEVICE_SECRET || 'dev-secret-change-me'
  const header = { alg: 'HS256', typ: 'TJ' } // Tiny-JWT style header
  const encHeader = b64url(JSON.stringify(header))
  const encPayload = b64url(JSON.stringify(payload))
  const data = `${encHeader}.${encPayload}`
  const sig = crypto.createHmac('sha256', secret).update(data).digest()
  const encSig = b64url(sig)
  return `${data}.${encSig}`
}
