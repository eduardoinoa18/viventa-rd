// app/api/admin/roles/users/route.ts
import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
// NOTE: Creating Firebase Auth users server-side requires the Firebase Admin SDK.
// For now, we will create a pending admin user record in Firestore.

// GET - List all admin users
export async function GET() {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    const snapshot = await db
      .collection('users')
      .where('role', 'in', ['master_admin', 'support', 'moderator', 'content_manager'])
      .get()
    const users = snapshot.docs.map((d: any) => {
      const data = d.data()
      return {
        id: d.id,
        email: data.email,
        name: data.name,
        role: data.role,
        roleName: data.roleName || data.role,
        createdAt: data.createdAt,
        lastLogin: data.lastLogin,
        active: data.active !== false
      }
    })

    return NextResponse.json({ ok: true, users })
  } catch (error: any) {
    console.error('Error fetching admin users:', error)
    // Return empty array if no users match or permission denied
    if (error?.code === 'permission-denied' || error?.message?.includes('index')) {
      return NextResponse.json({ ok: true, users: [] })
    }
    return NextResponse.json({ ok: false, error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

// POST - Create new admin user
export async function POST(request: Request) {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    const { email, name, role, password } = await request.json()

    if (!email || !name || !role || !password) {
      return NextResponse.json({ ok: false, error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ ok: false, error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    // Create pending admin invitation (without Auth user creation)
    const pendingRef = db.collection('admin_invitations').doc()
    await pendingRef.set({
      email,
      name,
      role,
      status: 'pending',
      createdAt: new Date(),
      createdBy: 'master_admin', // TODO: Get from session
    })

    return NextResponse.json({ ok: true, invitationId: pendingRef.id })
  } catch (error: any) {
    console.error('Error creating admin user:', error)
    
    const errorMessage = 'Error al crear usuario'
    // Additional error mapping can be added once Admin SDK is integrated
    
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 })
  }
}
