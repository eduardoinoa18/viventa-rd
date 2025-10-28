// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'

function initFirebase() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
  const valid = Boolean(
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.storageBucket &&
    config.messagingSenderId &&
    config.appId
  )
  if (!valid) return null
  if (!getApps().length) initializeApp(config as any)
  return getFirestore()
}

// GET /api/admin/users - list users with optional role filter
export async function GET(req: NextRequest) {
  try {
    const db = initFirebase()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const roleFilter = searchParams.get('role') // agent, broker, user, etc.

    let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    if (roleFilter) {
      q = query(collection(db, 'users'), where('role', '==', roleFilter), orderBy('createdAt', 'desc'))
    }

    const snapshot = await getDocs(q)
    const users = snapshot.docs.map((d: any) => ({
      id: d.id,
      ...d.data(),
    }))

    return NextResponse.json({ ok: true, data: users })
  } catch (e: any) {
    console.error('admin users GET error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/admin/users - create or invite a new user
export async function POST(req: NextRequest) {
  try {
    const db = initFirebase()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 })
    }

    const body = await req.json()
    const { name, email, phone, role, brokerage, company } = body

    if (!name || !email || !role) {
      return NextResponse.json({ ok: false, error: 'name, email, and role required' }, { status: 400 })
    }

    const userDoc = {
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      role: role || 'user', // user, agent, broker, admin
      status: 'pending', // pending, active, suspended
      brokerage: brokerage || '',
      company: company || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, 'users'), userDoc)

    return NextResponse.json({
      ok: true,
      data: { id: docRef.id, ...userDoc },
      message: 'User created successfully',
    })
  } catch (e: any) {
    console.error('admin users POST error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to create user' }, { status: 500 })
  }
}

// PATCH /api/admin/users - update user status or role
export async function PATCH(req: NextRequest) {
  try {
    const db = initFirebase()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 })
    }

    const body = await req.json()
    const { id, status, role, name, phone, brokerage, company } = body

    if (!id) {
      return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
    }

    const updates: any = { updatedAt: serverTimestamp() }
    if (status) updates.status = status // active, suspended, pending
    if (role) updates.role = role // user, agent, broker, admin
    if (name) updates.name = name
    if (phone !== undefined) updates.phone = phone
    if (brokerage !== undefined) updates.brokerage = brokerage
    if (company !== undefined) updates.company = company

    await updateDoc(doc(db, 'users', id), updates)

    return NextResponse.json({
      ok: true,
      message: 'User updated successfully',
    })
  } catch (e: any) {
    console.error('admin users PATCH error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/admin/users - delete a user
export async function DELETE(req: NextRequest) {
  try {
    const db = initFirebase()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 })
    }

    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
    }

    const { deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(db, 'users', id))

    return NextResponse.json({
      ok: true,
      message: 'User deleted successfully',
    })
  } catch (e: any) {
    console.error('admin users DELETE error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to delete user' }, { status: 500 })
  }
}
