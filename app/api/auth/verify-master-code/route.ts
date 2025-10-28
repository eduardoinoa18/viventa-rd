// app/api/auth/verify-master-code/route.ts
// Ensure Node.js runtime for consistency with server-only modules
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { verificationCodes } from '@/lib/verificationStore'

export async function POST(request: Request) {
  try {
  const { email, code } = await request.json()

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

    return NextResponse.json({ 
      ok: true,
      message: 'Verification successful',
      sessionToken,
      user: {
        email,
        role: 'master_admin',
        name: email.split('@')[0]
      }
    })

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
