// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { ActivityLogger } from '@/lib/activityLogger'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'
import { getAdminAuth } from '@/lib/firebaseAdmin'
import { sendEmail } from '@/lib/emailService'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

async function sendInvitationEmail(params: {
  email: string
  name: string
  role: string
  token: string
  expiresHours: number
}) {
  const { email, name, role, token, expiresHours } = params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/auth/invite/${token}`
  const roleLabel = role === 'constructora' ? 'Constructora' : role.charAt(0).toUpperCase() + role.slice(1)

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0B2545 0%, #00A676 100%); color: #fff; padding: 28px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">VIVENTA</h1>
        <p style="margin: 8px 0 0 0; opacity: .95;">You've been invited to join the platform</p>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
        <p style="margin: 0 0 12px 0; color: #111827;">Hi ${name},</p>
        <p style="margin: 0 0 16px 0; color: #374151;">An admin has created your <strong>${roleLabel}</strong> account on VIVENTA.</p>
        <p style="margin: 0 0 16px 0; color: #374151;">Click below to set your password and complete your profile.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${inviteUrl}" style="display:inline-block;background:#00A676;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;">Complete Your Profile</a>
        </div>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">This link expires in ${expiresHours} hours.</p>
        <p style="margin: 0; color: #6b7280; font-size: 12px; word-break: break-all;">${inviteUrl}</p>
      </div>
    </div>
  `

  await sendEmail({
    to: email,
    subject: 'You\'ve been invited to Viventa',
    html,
    from: 'noreply@viventa.com',
  })
}

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
}

// GET /api/admin/users - list users with optional role filter
export async function GET(req: NextRequest) {
  try {
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
  }
}

// POST /api/admin/users - create or invite a new user
export async function POST(req: NextRequest) {
  try {
    await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    const adminAuth = getAdminAuth()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }
    if (!adminAuth) {
      return NextResponse.json({ ok: false, error: 'Admin Auth not configured' }, { status: 503 })
    }

    const body = await req.json()
    const { name, email, phone, role, brokerage, company, criteria, sendInvite } = body

    if (!name || !email || !role) {
      return NextResponse.json({ ok: false, error: 'name, email, and role required' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    // avoid duplicate email in users collection
    const existingUser = await adminDb.collection('users').where('email', '==', normalizedEmail).limit(1).get()
    if (!existingUser.empty) {
      return NextResponse.json({ ok: false, error: 'User email already exists' }, { status: 409 })
    }

    const createdAuthUser = await adminAuth.createUser({
      email: normalizedEmail,
      displayName: String(name).trim(),
      disabled: false,
      emailVerified: false,
    })

    const userId = createdAuthUser.uid

    const userDoc: any = {
      name,
      email: normalizedEmail,
      phone: phone || '',
      role: role || 'user',
      status: 'invited',
      brokerage: brokerage || '',
      company: company || '',
      criteria: criteria || {},
      emailVerified: false,
      inviteUsed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await adminDb.collection('users').doc(userId).set(userDoc)

    // Create invitation by default for admin-created users
    const shouldSendInvite = typeof sendInvite === 'boolean' ? sendInvite : true
    let invitationId: string | null = null
    if (shouldSendInvite) {
      const expiresHours = 72
      const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000)
      const token = generateInviteToken()
      const inviteRef = await adminDb.collection('invitations').add({
        token,
        userId,
        email: normalizedEmail,
        name: String(name).trim(),
        role,
        used: false,
        status: 'pending',
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      invitationId = inviteRef.id
      await sendInvitationEmail({
        email: normalizedEmail,
        name: String(name).trim(),
        role,
        token,
        expiresHours,
      })
      await adminDb.collection('users').doc(userId).set({
        inviteId: inviteRef.id,
        inviteExpiresAt: expiresAt,
      }, { merge: true })
    }

    await ActivityLogger.userCreated(String(email).trim().toLowerCase(), name, role)

    return NextResponse.json({
      ok: true,
      data: { id: userId, ...userDoc },
      invitationId,
      message: shouldSendInvite ? 'User created and invitation sent' : 'User created successfully',
    })
  } catch (error: any) {
    return usersApiError(error, 'Failed to create user')
  }
}

// PATCH /api/admin/users - update user status or role
export async function PATCH(req: NextRequest) {
  try {
    await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const body = await req.json()
    const { id, status, role, name, phone, brokerage, company, emailVerified, verified, approved } = body
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
    if (typeof approved === 'boolean') updates.approved = approved

    await adminDb.collection('users').doc(id).update(updates)

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

    return NextResponse.json({
      ok: true,
      message: 'User updated successfully',
    })
  } catch (error: any) {
    return usersApiError(error, 'Failed to update user')
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
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const userDoc = await adminDb.collection('users').doc(id).get()
    const userData = userDoc.data()

    await adminDb.collection('users').doc(id).delete()

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
  } catch (error: any) {
    return usersApiError(error, 'Failed to delete user')
  }
}
