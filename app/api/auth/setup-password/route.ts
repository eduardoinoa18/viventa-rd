import { NextRequest, NextResponse } from 'next/server'
import { verifyPasswordSetupToken } from '@/lib/credentialGenerator'
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin'
import { keyFromRequest, rateLimit } from '@/lib/rateLimiter'

export async function POST(req: NextRequest) {
  try {
    // Basic rate limit: 5 attempts per minute per IP/email
    const bodyText = await req.clone().text()
    let emailForKey = ''
    try { emailForKey = (JSON.parse(bodyText).email || '').toLowerCase() } catch {}
    const rl = rateLimit(keyFromRequest(req, emailForKey), 5, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
    }
  const { token, email, password } = await req.json()

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }

  // Verify token
  const userId = verifyPasswordSetupToken(token)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Update user password in Firebase Auth
    try {
      const adminAuth = getAdminAuth()
      if (!adminAuth) {
        throw new Error('Firebase Admin no disponible')
      }

      // Verify email-user match and ensure not already set
      const adminDb = getAdminDb()
      if (adminDb) {
        const userRef = adminDb.collection('users').doc(userId)
        const userSnap = await userRef.get()
        if (!userSnap.exists) {
          return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }
        const data = userSnap.data() as any
        const emailMatches = (data.email || '').toLowerCase() === (email || '').toLowerCase()
        if (!emailMatches) {
          return NextResponse.json({ error: 'Email no coincide con el usuario' }, { status: 401 })
        }
        if (data.passwordSet === true) {
          return NextResponse.json({ error: 'La contraseña ya fue configurada' }, { status: 409 })
        }
      }

      await adminAuth.updateUser(userId, {
        password,
        emailVerified: true
      })

      // Update user document to mark password as set
      const adminDb2 = getAdminDb()
      if (adminDb2) {
        await adminDb2.collection('users').doc(userId).update({
          passwordSet: true,
          passwordSetAt: new Date(),
          updatedAt: new Date()
        })
      }

      return NextResponse.json({ 
        success: true,
        message: 'Contraseña configurada exitosamente' 
      })
    } catch (authError: any) {
      console.error('Firebase Auth error:', authError)
      return NextResponse.json(
        { error: 'Error al actualizar contraseña en Firebase' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Password setup error:', error)
    return NextResponse.json(
      { error: 'Error al configurar contraseña' },
      { status: 500 }
    )
  }
}
