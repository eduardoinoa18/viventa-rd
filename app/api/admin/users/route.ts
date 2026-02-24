// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { ActivityLogger } from '@/lib/activityLogger'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'

<<<<<<< HEAD
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
=======
function usersApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json(
      { ok: false, error: error.message, code: error.code },
      { status: error.status }
    )
  }

  const message = error instanceof Error ? error.message : fallbackMessage
  console.error('[admin/users] error:', message)
  return NextResponse.json({ ok: false, error: fallbackMessage }, { status: 500 })
>>>>>>> origin/copilot/implement-project-review-plan
}

// GET /api/admin/users - list users with optional role filter
export async function GET(req: NextRequest) {
  try {
<<<<<<< HEAD
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
=======
    await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const roleFilter = searchParams.get('role')?.trim().toLowerCase()
    const allowedRoles = new Set(['user', 'buyer', 'agent', 'broker', 'admin', 'master_admin', 'constructora'])
    if (roleFilter && !allowedRoles.has(roleFilter)) {
      return NextResponse.json({ ok: false, error: 'Invalid role filter' }, { status: 400 })
    }

    let ref: any = adminDb.collection('users')
    if (roleFilter) ref = ref.where('role', '==', roleFilter)

    try {
      const snap = await ref.orderBy('createdAt', 'desc').get()
      const users = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
      return NextResponse.json({ ok: true, data: users })
    } catch (orderError: any) {
      console.warn('[admin/users] orderBy failed, fetching unordered:', orderError?.message)
      const snap = await ref.get()
      const users = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
      return NextResponse.json({ ok: true, data: users })
    }
  } catch (error: any) {
    return usersApiError(error, 'Failed to fetch users')
>>>>>>> origin/copilot/implement-project-review-plan
  }
}

// POST /api/admin/users - create or invite a new user
export async function POST(req: NextRequest) {
  try {
    await requireMasterAdmin(req)
    const adminDb = getAdminDb()
<<<<<<< HEAD
    if (!adminDb) return jsonError(503, 'Admin database is not configured')
=======
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }
>>>>>>> origin/copilot/implement-project-review-plan

    const body = await req.json()
    const { name, email, phone, role, brokerage, company } = body

    if (!name || !email || !role) {
      return NextResponse.json({ ok: false, error: 'name, email, and role required' }, { status: 400 })
    }

    const userDoc: any = {
      name,
<<<<<<< HEAD
      email: String(email).toLowerCase(),
=======
      email: String(email).trim().toLowerCase(),
>>>>>>> origin/copilot/implement-project-review-plan
      phone: phone || '',
      role: role || 'user',
      status: 'pending',
      brokerage: brokerage || '',
      company: company || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const docRef = await adminDb.collection('users').add(userDoc)

    await ActivityLogger.userCreated(String(email).trim().toLowerCase(), name, role)

<<<<<<< HEAD
    return NextResponse.json({ ok: true, data: { id: docRef.id, ...userDoc }, message: 'User created successfully' })
  } catch (e: any) {
    console.error('admin users POST error', e)
    const { status, error } = mapFirebaseError(e, 'Failed to create user')
    return jsonError(status, error)
=======
    return NextResponse.json({
      ok: true,
      data: { id: docRef.id, ...userDoc },
      message: 'User created successfully',
    })
  } catch (error: any) {
    return usersApiError(error, 'Failed to create user')
>>>>>>> origin/copilot/implement-project-review-plan
  }
}

// PATCH /api/admin/users - update user status or role
export async function PATCH(req: NextRequest) {
  try {
    await requireMasterAdmin(req)
    const adminDb = getAdminDb()
<<<<<<< HEAD
    if (!adminDb) return jsonError(503, 'Admin database is not configured')
    // Parse once; reuse across both admin and client paths
    const body = await req.json()
    const { id, status, role, name, phone, brokerage, company, emailVerified, verified } = body
=======
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const body = await req.json()
    const { id, status, role, name, phone, brokerage, company, emailVerified, verified, approved } = body
>>>>>>> origin/copilot/implement-project-review-plan
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
<<<<<<< HEAD
    await adminDb.collection('users').doc(id).update(updates)

    // Log user update
=======
    if (typeof approved === 'boolean') updates.approved = approved

    await adminDb.collection('users').doc(id).update(updates)

>>>>>>> origin/copilot/implement-project-review-plan
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

<<<<<<< HEAD
    return NextResponse.json({ ok: true, message: 'User updated successfully' })
  } catch (e: any) {
    console.error('admin users PATCH error', e)
    const { status, error } = mapFirebaseError(e, 'Failed to update user')
    return jsonError(status, error)
=======
    return NextResponse.json({
      ok: true,
      message: 'User updated successfully',
    })
  } catch (error: any) {
    return usersApiError(error, 'Failed to update user')
>>>>>>> origin/copilot/implement-project-review-plan
  }
}

// DELETE /api/admin/users - delete a user
export async function DELETE(req: NextRequest) {
  try {
    await requireMasterAdmin(req)
    const body = await req.json()
    const { id } = body
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

    const adminDb = getAdminDb()
<<<<<<< HEAD
    if (!adminDb) return jsonError(503, 'Admin database is not configured')

    // Get user data before deletion for logging
=======
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

>>>>>>> origin/copilot/implement-project-review-plan
    const userDoc = await adminDb.collection('users').doc(id).get()
    const userData = userDoc.data()

    await adminDb.collection('users').doc(id).delete()

<<<<<<< HEAD
    // Log user deletion
=======
>>>>>>> origin/copilot/implement-project-review-plan
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
<<<<<<< HEAD
  } catch (e: any) {
    console.error('admin users DELETE error', e)
    const { status, error } = mapFirebaseError(e, 'Failed to delete user')
    return jsonError(status, error)
=======
  } catch (error: any) {
    return usersApiError(error, 'Failed to delete user')
>>>>>>> origin/copilot/implement-project-review-plan
  }
}
