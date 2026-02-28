// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { ActivityLogger } from '@/lib/activityLogger'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'
import { getAdminAuth } from '@/lib/firebaseAdmin'
import { sendEmail } from '@/lib/emailService'
import { FieldValue } from 'firebase-admin/firestore'
import { validateLifecycleTransition } from '@/lib/userLifecycle'
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

async function applyLifecycleSideEffects(params: {
  adminDb: any
  userId: string
  fromStatus: string
  toStatus: string
  actorEmail: string
  reason?: string
}) {
  const { adminDb, userId, fromStatus, toStatus, actorEmail, reason = 'not_provided' } = params
  const now = new Date()

  const impacts = {
    openLeadsUnassigned: 0,
    buyersDetached: 0,
    conversationsFlagged: 0,
    commissionPipelineFlagged: 0,
  }

  if (!(toStatus === 'suspended' || toStatus === 'archived')) {
    return impacts
  }

  const leadSnap = await adminDb.collection('leads').where('assignedTo', '==', userId).get()
  if (!leadSnap.empty) {
    const batch = adminDb.batch()
    for (const leadDoc of leadSnap.docs) {
      const lead = leadDoc.data() || {}
      const leadStatus = String(lead.status || 'unassigned')
      if (leadStatus === 'won' || leadStatus === 'lost') continue

      impacts.openLeadsUnassigned += 1
      batch.update(leadDoc.ref, {
        assignedTo: null,
        leadStage: 'new',
        status: 'unassigned',
        previousStage: String(lead.leadStage || lead.status || 'assigned'),
        stageChangedAt: now,
        stageChangeReason: 'assignee_lifecycle_change',
        assignedAt: null,
        slaResetAt: now,
        reassignmentRequired: true,
        reassignmentReason: 'assignee_lifecycle_change',
        reassignmentMeta: {
          userId,
          fromStatus,
          toStatus,
          actorEmail,
          reason,
          at: now,
        },
        updatedAt: now,
      })

      const logRef = adminDb.collection('lead_assignment_logs').doc()
      batch.set(logRef, {
        leadId: leadDoc.id,
        previousAssignedTo: userId,
        newAssignedTo: null,
        eventType: 'unassigned_lifecycle',
        note: `Lead unassigned due to user lifecycle transition ${fromStatus} -> ${toStatus}. reason=${reason}`,
        createdAt: now,
      })
    }
    await batch.commit()
  }

  try {
    const buyersSnap = await adminDb
      .collection('users')
      .where('role', '==', 'buyer')
      .where('assignedTo', '==', userId)
      .get()

    if (!buyersSnap.empty) {
      const batch = adminDb.batch()
      for (const buyerDoc of buyersSnap.docs) {
        impacts.buyersDetached += 1
        batch.update(buyerDoc.ref, {
          assignedTo: null,
          reassignmentRequired: true,
          reassignmentReason: 'assignee_lifecycle_change',
          updatedAt: now,
        })
      }
      await batch.commit()
    }
  } catch (buyerAssignmentError) {
    console.warn('[admin/users] buyer detachment skipped:', (buyerAssignmentError as any)?.message)
  }

  const conversationsSnap = await adminDb
    .collection('conversations')
    .where('participantIds', 'array-contains', userId)
    .get()

  if (!conversationsSnap.empty) {
    const batch = adminDb.batch()
    for (const conversationDoc of conversationsSnap.docs) {
      impacts.conversationsFlagged += 1
      batch.update(conversationDoc.ref, {
        needsParticipantReassignment: true,
        participantLifecycleBlockedIds: FieldValue.arrayUnion(userId),
        lifecycleReassignmentReason: 'assignee_lifecycle_change',
        updatedAt: now,
      })
    }
    await batch.commit()
  }

  if (impacts.openLeadsUnassigned > 0 || impacts.conversationsFlagged > 0) {
    await adminDb.collection('operational_alerts').add({
      type: 'user_lifecycle_impact',
      severity: toStatus === 'archived' ? 'high' : 'medium',
      userId,
      fromStatus,
      toStatus,
      actorEmail,
      reason,
      impacts,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    })
  }

  return impacts
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
    const { name, email, phone, role, brokerage, company, contactPerson, criteria, sendInvite } = body

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
      contactPerson: contactPerson || '',
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

      await ActivityLogger.inviteSent(userId, normalizedEmail, role)

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
    const admin = await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    const adminAuth = getAdminAuth()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }
    if (!adminAuth) {
      return NextResponse.json({ ok: false, error: 'Admin Auth not configured' }, { status: 503 })
    }

    const body = await req.json()
    const { id, status, role, name, phone, brokerage, company, email, disabled, emailVerified, verified, approved, forcePasswordReset, lifecycleReason } = body
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

    const userRef = adminDb.collection('users').doc(id)
    const existingSnap = await userRef.get()
    if (!existingSnap.exists) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    const existingData = existingSnap.data() as any
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : undefined

    if (normalizedEmail && normalizedEmail !== existingData?.email) {
      const dupSnap = await adminDb
        .collection('users')
        .where('email', '==', normalizedEmail)
        .limit(1)
        .get()
      if (!dupSnap.empty && dupSnap.docs[0].id !== id) {
        return NextResponse.json({ ok: false, error: 'User email already exists' }, { status: 409 })
      }
    }

    const lifecycleTransition =
      typeof status === 'string'
        ? validateLifecycleTransition({
            currentStatus: existingData?.status,
            nextStatus: status,
            role: existingData?.role,
          })
        : null

    if (lifecycleTransition && !lifecycleTransition.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: lifecycleTransition.error,
          code: lifecycleTransition.code,
        },
        { status: 400 }
      )
    }

    const updates: any = { updatedAt: new Date() }
    if (lifecycleTransition?.ok) {
      updates.status = lifecycleTransition.nextStatus
      updates.lifecycleStatusChangedAt = new Date()
      updates.lifecycleStatusChangedBy = admin.email
    }
    if (role) updates.role = role
    if (name) updates.name = name
    if (normalizedEmail) updates.email = normalizedEmail
    if (phone !== undefined) updates.phone = phone
    if (brokerage !== undefined) updates.brokerage = brokerage
    if (company !== undefined) updates.company = company
    if (typeof disabled === 'boolean') updates.disabled = disabled
    if (typeof emailVerified === 'boolean') updates.emailVerified = emailVerified
    if (typeof verified === 'boolean') updates.verified = verified
    if (typeof approved === 'boolean') updates.approved = approved
    if (typeof forcePasswordReset === 'boolean') updates.forcePasswordReset = forcePasswordReset

    if (lifecycleTransition?.ok) {
      if (lifecycleTransition.nextStatus === 'suspended' || lifecycleTransition.nextStatus === 'archived') {
        updates.disabled = true
      }
      if (lifecycleTransition.nextStatus === 'active' && lifecycleTransition.currentStatus === 'suspended') {
        if (typeof disabled !== 'boolean') updates.disabled = false
      }
      if (lifecycleTransition.nextStatus === 'archived') {
        updates.archivedAt = new Date()
      }
    }

    await userRef.update(updates)

    let sideEffects: any = null
    if (lifecycleTransition?.ok && lifecycleTransition.currentStatus !== lifecycleTransition.nextStatus) {
      sideEffects = await applyLifecycleSideEffects({
        adminDb,
        userId: id,
        fromStatus: lifecycleTransition.currentStatus,
        toStatus: lifecycleTransition.nextStatus,
        actorEmail: admin.email,
        reason: typeof lifecycleReason === 'string' && lifecycleReason.trim() ? lifecycleReason.trim() : 'status_change',
      })

      await adminDb.collection('user_lifecycle_events').add({
        userId: id,
        previousState: lifecycleTransition.currentStatus,
        newState: lifecycleTransition.nextStatus,
        fromStatus: lifecycleTransition.currentStatus,
        toStatus: lifecycleTransition.nextStatus,
        actorUserId: admin.uid,
        actorEmail: admin.email,
        reason: typeof lifecycleReason === 'string' && lifecycleReason.trim() ? lifecycleReason.trim() : 'status_change',
        sideEffectsSummary: sideEffects,
        impacts: sideEffects,
        timestamp: new Date(),
        createdAt: new Date(),
      })
    }

    const authUpdates: any = {}
    if (normalizedEmail) authUpdates.email = normalizedEmail
    if (name) authUpdates.displayName = name
    if (typeof disabled === 'boolean') authUpdates.disabled = disabled
    if (typeof updates.disabled === 'boolean') authUpdates.disabled = updates.disabled
    if (typeof emailVerified === 'boolean') authUpdates.emailVerified = emailVerified
    if (Object.keys(authUpdates).length > 0) {
      await adminAuth.updateUser(id, authUpdates)
    }

    const mustRevokeTokens =
      (lifecycleTransition?.ok &&
        (lifecycleTransition.nextStatus === 'suspended' || lifecycleTransition.nextStatus === 'archived')) ||
      (typeof forcePasswordReset === 'boolean' && forcePasswordReset)

    if (mustRevokeTokens) {
      await adminAuth.revokeRefreshTokens(id)
    }

    if (role || lifecycleTransition?.ok) {
      const authUser = await adminAuth.getUser(id)
      await adminAuth.setCustomUserClaims(id, {
        ...(authUser.customClaims || {}),
        role: role || existingData?.role,
        status: lifecycleTransition?.ok ? lifecycleTransition.nextStatus : existingData?.status,
      })
    }

    const userDoc = await userRef.get()
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
          status: userData.status,
          lifecycleTransition: lifecycleTransition?.ok
            ? {
                from: lifecycleTransition.currentStatus,
                to: lifecycleTransition.nextStatus,
              }
            : null,
          sideEffects,
          forcePasswordReset: !!forcePasswordReset,
          updatedFields: Object.keys(updates).filter(k => k !== 'updatedAt')
        }
      })
    }

    return NextResponse.json({
      ok: true,
      message: 'User updated successfully',
      lifecycle: lifecycleTransition?.ok
        ? {
            from: lifecycleTransition.currentStatus,
            to: lifecycleTransition.nextStatus,
            sideEffects,
          }
        : null,
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
