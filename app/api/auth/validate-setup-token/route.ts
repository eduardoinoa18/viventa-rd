import { NextRequest, NextResponse } from 'next/server'
import { verifyPasswordSetupToken } from '@/lib/credentialGenerator'

export async function POST(req: NextRequest) {
  try {
    const { token, email } = await req.json()

    if (!token || !email) {
      return NextResponse.json(
        { valid: false, error: 'Token y email requeridos' },
        { status: 400 }
      )
    }

    // Verify the token
    const userId = verifyPasswordSetupToken(token)

    if (!userId) {
      return NextResponse.json(
        { valid: false, error: 'Token inválido o expirado' },
        { status: 401 }
      )
    }

    // Additional validation: check if email matches
    // In production, verify against database
    return NextResponse.json({ valid: true, userId })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { valid: false, error: 'Error al validar token' },
      { status: 500 }
    )
  }
}
