// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { ActivityLogger } from '@/lib/activityLogger'
import { requireMasterAdmin } from '@/lib/requireMasterAdmin'
import { adminErrorResponse, handleAdminError } from '@/lib/adminErrors'
import { logAdminAction } from '@/lib/logAdminAction'

export const dynamic = 'force-dynamic'

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
    const admin = await requireMasterAdmin(req)
    // Prefer Admin SDK for server-side reads (bypass client auth rules)
    const adminDb = getAdminDb()
    if (adminDb) {
      const { searchParams } = new URL(req.url)
      const roleFilter = searchParams.get('role')
      let ref: any = adminDb.collection('users')
      if (roleFilter) ref = ref.where('role', '==', roleFilter)
      
      // Try with orderBy, fall back to unordered if index doesn't exist
      try {
        const snap = await ref.orderBy('createdAt', 'desc').get()
        const users = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
        return NextResponse.json({ ok: true, data: users })
      } catch (orderError: any) {
        // If orderBy fails (missing index), just get all docs
        console.warn('OrderBy failed, fetching without ordering:', orderError.message)
        const snap = await ref.get()
        const users = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
        return NextResponse.json({ ok: true, data: users })
      }
    }

    const db = initFirebase()
    if (!db) return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 })

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
    const admin = await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    if (adminDb) {
      const body = await req.json()
      const { name, email, phone, role, brokerage, company } = body
      if (!name || !email || !role) {
        return NextResponse.json({ ok: false, error: 'name, email, and role required' }, { status: 400 })
      }
      const userDoc = {
        name,
        email: String(email).toLowerCase(),
        phone: phone || '',
        role: role || 'user',
        status: 'pending',
        brokerage: brokerage || '',
        company: company || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const docRef = await adminDb.collection('users').add(userDoc)
      
      // Log user creation
      await ActivityLogger.userCreated(email, name, role)
      
      return NextResponse.json({ ok: true, data: { id: docRef.id, ...userDoc }, message: 'User created successfully' })
    }

    const db = initFirebase()
    if (!db) return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 })

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

    // Log user creation
    await ActivityLogger.userCreated(email, name, role)

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
    const admin = await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    // Parse once; reuse across both admin and client paths
  const body = await req.json()
  const { id, status, role, name, phone, brokerage, company, emailVerified, verified } = body
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

    if (adminDb) {
  const updates: any = { updatedAt: new Date() }
      if (status) updates.status = status
      if (role) updates.role = role
      if (name) updates.name = name
      if (phone !== undefined) updates.phone = phone
      if (brokerage !== undefined) updates.brokerage = brokerage
  if (company !== undefined) updates.company = company
  if (typeof emailVerified === 'boolean') updates.emailVerified = emailVerified
  if (typeof verified === 'boolean') updates.verified = verified
      await adminDb.collection('users').doc(id).update(updates)
      
      // Log user update
      const userDoc = await adminDb.collection('users').doc(id).get()
      const userData = userDoc.data()
      if (userData) {
        await ActivityLogger.log({
          type: 'user',
          action: 'User Updated',
          userId: id,
          userName: userData.name,
          userEmail: userData.email,
          metadata: {
            role: userData.role,
            status: updates.status || userData.status,
            updatedFields: Object.keys(updates).filter(k => k !== 'updatedAt')
          }
        })
      }
      
      return NextResponse.json({ ok: true, message: 'User updated successfully' })
    }

    const db = initFirebase()
    if (!db) return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 })

    // Use same parsed body vars above; no re-declare

  const updates: any = { updatedAt: serverTimestamp() }
    if (status) updates.status = status // active, suspended, pending
    if (role) updates.role = role // user, agent, broker, admin
    if (name) updates.name = name
    if (phone !== undefined) updates.phone = phone
    if (brokerage !== undefined) updates.brokerage = brokerage
  if (company !== undefined) updates.company = company
  if (typeof emailVerified === 'boolean') updates.emailVerified = emailVerified
  if (typeof verified === 'boolean') updates.verified = verified

    await updateDoc(doc(db, 'users', id), updates)

    // Log user update
    const { getDoc } = await import('firebase/firestore')
    const userDoc = await getDoc(doc(db, 'users', id))
    const userData = userDoc.data()
    if (userData) {
      await ActivityLogger.log({
        type: 'user',
        action: 'User Updated',
        userId: id,
        userName: userData.name,
        userEmail: userData.email,
        metadata: {
          role: userData.role,
          status: updates.status || userData.status,
          updatedFields: Object.keys(updates).filter(k => k !== 'updatedAt')
        }
      })
    }

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
    const admin = await requireMasterAdmin(req)
    const body = await req.json()
    const { id } = body
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

    const adminDb = getAdminDb()
    if (adminDb) {
      // Get user data before deletion for logging
      const userDoc = await adminDb.collection('users').doc(id).get()
      const userData = userDoc.data()
      
      await adminDb.collection('users').doc(id).delete()
      
      // Log user deletion
      if (userData) {
        await ActivityLogger.log({
          type: 'user',
          action: 'User Deleted',
          userId: id,
          userName: userData.name,
          userEmail: userData.email,
          metadata: { role: userData.role }
        })
      }
      
      return NextResponse.json({ ok: true, message: 'User deleted successfully' })
    }

    const db = initFirebase()
    if (!db) return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 })
    
    // Get user data before deletion for logging
    const { deleteDoc, getDoc } = await import('firebase/firestore')
    const userDoc = await getDoc(doc(db, 'users', id))
    const userData = userDoc.data()
    
    await deleteDoc(doc(db, 'users', id))
    
    // Log user deletion
    if (userData) {
      await ActivityLogger.log({
        type: 'user',
        action: 'User Deleted',
        userId: id,
        userName: userData.name,
        userEmail: userData.email,
        metadata: { role: userData.role }
      })
    }
    
    return NextResponse.json({ ok: true, message: 'User deleted successfully' })
  } catch (e: any) {
    console.error('admin users DELETE error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to delete user' }, { status: 500 })
  }
}
