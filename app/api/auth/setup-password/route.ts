import { NextRequest, NextResponse } from 'next/server'
import { verifyPasswordSetupToken } from '@/lib/credentialGenerator'
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin'

export async function POST(req: NextRequest) {
  try {
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

      await adminAuth.updateUser(userId, {
        password,
        emailVerified: true
      })

      // Update user document to mark password as set
      const adminDb = getAdminDb()
      if (adminDb) {
        await adminDb.collection('users').doc(userId).update({
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
