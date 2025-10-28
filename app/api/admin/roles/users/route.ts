// app/api/admin/roles/users/route.ts
import { NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebaseClient'
import { collection, addDoc, getDocs, doc, setDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'

// GET - List all admin users
export async function GET() {
  try {
    const q = query(collection(db, 'users'), where('role', 'in', ['master_admin', 'support', 'moderator', 'content_manager']))
    const snapshot = await getDocs(q)
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
  } catch (error) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json({ ok: false, error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

// POST - Create new admin user
export async function POST(request: Request) {
  try {
    const { email, name, role, password } = await request.json()

    if (!email || !name || !role || !password) {
      return NextResponse.json({ ok: false, error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ ok: false, error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const uid = userCredential.user.uid

    // Create Firestore user document
    await setDoc(doc(db, 'users', uid), {
      email,
      name,
      role,
      roleName: role,
      active: true,
      profileComplete: true,
      requirePasswordChange: true,
      createdAt: serverTimestamp(),
      createdBy: 'master_admin' // TODO: Get from session
    })

    return NextResponse.json({ ok: true, uid })
  } catch (error: any) {
    console.error('Error creating admin user:', error)
    
    let errorMessage = 'Error al crear usuario'
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este email ya está registrado'
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña es muy débil'
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido'
    }
    
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 })
  }
}
