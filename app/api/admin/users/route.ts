// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { ActivityLogger } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status })
}

function mapFirebaseError(e: any, fallback = 'Unexpected server error') {
  const code = String(e?.code || '')
  if (code.includes('permission-denied')) return { status: 403, error: 'Insufficient permissions' }
  if (code.includes('unauthenticated')) return { status: 401, error: 'Authentication required' }
  if (code.includes('not-found')) return { status: 404, error: 'Resource not found' }
  if (code.includes('invalid-argument')) return { status: 400, error: e?.message || 'Invalid request' }
  return { status: 500, error: e?.message || fallback }
}

// GET /api/admin/users - list users with optional role filter
export async function GET(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) return jsonError(503, 'Admin database is not configured')

    const { searchParams } = new URL(req.url)
    const roleFilter = searchParams.get('role') // agent, broker, user, etc.

    let ref: any = adminDb.collection('users')
    if (roleFilter) ref = ref.where('role', '==', roleFilter)

    try {
      const snap = await ref.orderBy('createdAt', 'desc').get()
      const users = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
      return NextResponse.json({ ok: true, data: users })
    } catch (orderError: any) {
      console.warn('OrderBy failed, fetching without ordering:', orderError?.message)
      const snap = await ref.get()
      const users = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
      return NextResponse.json({ ok: true, data: users })
    }
  } catch (e: any) {
    console.error('admin users GET error', e)
    const { status, error } = mapFirebaseError(e, 'Failed to fetch users')
    return jsonError(status, error)
  }
}

// POST /api/admin/users - create or invite a new user
export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) return jsonError(503, 'Admin database is not configured')

    const body = await req.json()
    const { name, email, phone, role, brokerage, company } = body

    if (!name || !email || !role) {
      return NextResponse.json({ ok: false, error: 'name, email, and role required' }, { status: 400 })
    }

    const userDoc: any = {
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
  } catch (e: any) {
    console.error('admin users POST error', e)
    const { status, error } = mapFirebaseError(e, 'Failed to create user')
    return jsonError(status, error)
  }
}

// PATCH /api/admin/users - update user status or role
export async function PATCH(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) return jsonError(503, 'Admin database is not configured')
    // Parse once; reuse across both admin and client paths
    const body = await req.json()
    const { id, status, role, name, phone, brokerage, company, emailVerified, verified } = body
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

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
  } catch (e: any) {
    console.error('admin users PATCH error', e)
    const { status, error } = mapFirebaseError(e, 'Failed to update user')
    return jsonError(status, error)
  }
}

// DELETE /api/admin/users - delete a user
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

    const adminDb = getAdminDb()
    if (!adminDb) return jsonError(503, 'Admin database is not configured')

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
  } catch (e: any) {
    console.error('admin users DELETE error', e)
    const { status, error } = mapFirebaseError(e, 'Failed to delete user')
    return jsonError(status, error)
  }
}
