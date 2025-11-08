import { NextRequest, NextResponse } from 'next/server'
import { verifyPasswordSetupToken } from '@/lib/credentialGenerator'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { rateLimit, keyFromRequest } from '@/lib/rateLimiter'

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.clone().text()
    let emailForKey = ''
    try { emailForKey = (JSON.parse(bodyText).email || '').toLowerCase() } catch {}
    const rl = rateLimit(keyFromRequest(req, emailForKey), 10, 60_000)
    if (!rl.allowed) return NextResponse.json({ ok: false, error: 'Too many attempts' }, { status: 429 })
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

    // Additional validation: check if email matches and password not already set
    const adminDb = getAdminDb()
    if (adminDb) {
      const userSnap = await adminDb.collection('users').doc(userId).get()
      if (!userSnap.exists) {
        return NextResponse.json({ valid: false, error: 'Usuario no encontrado' }, { status: 404 })
      }
      const data = userSnap.data() as any
      const emailMatches = (data.email || '').toLowerCase() === (email || '').toLowerCase()
      if (!emailMatches) {
        return NextResponse.json({ valid: false, error: 'Email no coincide con el usuario' }, { status: 401 })
      }
      if (data.passwordSet === true) {
        return NextResponse.json({ valid: false, error: 'La contraseña ya fue configurada' }, { status: 409 })
      }
    }

    return NextResponse.json({ valid: true, userId })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { valid: false, error: 'Error al validar token' },
      { status: 500 }
    )
  }
}
