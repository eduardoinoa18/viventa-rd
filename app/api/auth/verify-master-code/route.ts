// app/api/auth/verify-master-code/route.ts
import { NextResponse } from 'next/server'
import { verificationCodes } from '@/lib/verificationStore'

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Email and code are required' 
      }, { status: 400 })
    }

    const storedData = verificationCodes.get(email)

    if (!storedData) {
      return NextResponse.json({ 
        ok: false, 
        error: 'No verification code found. Please request a new code.' 
      }, { status: 404 })
    }

    // Check if code expired
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email)
      return NextResponse.json({ 
        ok: false, 
        error: 'Verification code expired. Please request a new code.' 
      }, { status: 401 })
    }

    // Check attempts (max 5)
    if (storedData.attempts >= 5) {
      verificationCodes.delete(email)
      return NextResponse.json({ 
        ok: false, 
        error: 'Too many failed attempts. Please request a new code.' 
      }, { status: 429 })
    }

    // Verify code
    if (storedData.code !== code.trim()) {
      storedData.attempts++
      return NextResponse.json({ 
        ok: false, 
        error: `Invalid code. ${5 - storedData.attempts} attempts remaining.` 
      }, { status: 401 })
    }

    // Success - delete code and return success
    verificationCodes.delete(email)

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
