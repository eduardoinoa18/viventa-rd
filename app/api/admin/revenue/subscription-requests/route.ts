import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin'
import { sendEmail } from '@/lib/emailService'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'

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

  await sendEmail({
    to: email,
    subject: 'Your Viventa account invitation',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#0B2545 0%, #00A676 100%);color:#fff;padding:24px;border-radius:10px 10px 0 0;">
          <h2 style="margin:0;">Viventa Invitation</h2>
          <p style="margin:8px 0 0;opacity:.95;">${role} account has been provisioned</p>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 10px 10px;">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your account is ready. Set your password and complete your profile:</p>
          <p><a href="${inviteUrl}" style="display:inline-block;background:#00A676;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">Complete onboarding</a></p>
          <p style="font-size:12px;color:#666;">This link expires in ${expiresHours} hours.</p>
        </div>
      </div>
    `,
  })
}

export async function GET(req: NextRequest) {
  try {
    await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    if (!adminDb) return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })

    let snap
    try {
      snap = await adminDb.collection('subscription_requests').orderBy('createdAt', 'desc').limit(200).get()
    } catch {
      snap = await adminDb.collection('subscription_requests').limit(200).get()
    }

    const data = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[admin/revenue/subscription-requests][GET] error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load subscription requests' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    const adminAuth = getAdminAuth()
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const {
      name,
      email,
      role,
      planId,
      notes,
      createCredentials,
      phone,
      company,
      contactPerson,
    } = await req.json()

    if (!name || !email || !role || !planId) {
      return NextResponse.json({ ok: false, error: 'name, email, role and planId are required' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const now = new Date()

    const payload: any = {
      name: String(name).trim(),
      email: normalizedEmail,
      role: String(role).trim(),
      planId: String(planId).trim(),
      notes: String(notes || '').trim(),
      status: 'pending',
      createdBy: admin.email,
      createdAt: now,
      updatedAt: now,
      createCredentials: !!createCredentials,
    }

    let userId: string | null = null

    if (createCredentials) {
      try {
        const existing = await adminAuth.getUserByEmail(normalizedEmail)
        userId = existing.uid
      } catch {
        const created = await adminAuth.createUser({
          email: normalizedEmail,
          displayName: String(name).trim(),
          disabled: false,
          emailVerified: false,
        })
        userId = created.uid
      }

      if (userId) {
        await adminDb.collection('users').doc(userId).set(
          {
            name: String(name).trim(),
            email: normalizedEmail,
            role: String(role).trim(),
            status: 'invited',
            phone: String(phone || '').trim(),
            company: String(company || '').trim(),
            contactPerson: String(contactPerson || '').trim(),
            updatedAt: now,
            createdAt: now,
          },
          { merge: true }
        )

        const expiresHours = 72
        const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000)
        const token = generateInviteToken()
        const inviteRef = await adminDb.collection('invitations').add({
          token,
          userId,
          email: normalizedEmail,
          name: String(name).trim(),
          role: String(role).trim(),
          used: false,
          status: 'pending',
          expiresAt,
          createdAt: now,
          updatedAt: now,
        })

        await adminDb.collection('users').doc(userId).set(
          {
            inviteId: inviteRef.id,
            inviteExpiresAt: expiresAt,
            inviteUsed: false,
          },
          { merge: true }
        )

        await sendInvitationEmail({
          email: normalizedEmail,
          name: String(name).trim(),
          role: String(role).trim(),
          token,
          expiresHours,
        })
      }
    }

    payload.userId = userId
    const createdRequest = await adminDb.collection('subscription_requests').add(payload)

    return NextResponse.json({ ok: true, data: { id: createdRequest.id, ...payload } })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[admin/revenue/subscription-requests][POST] error', error)
    return NextResponse.json({ ok: false, error: 'Failed to create subscription request' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    if (!adminDb) return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })

    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ ok: false, error: 'id and status are required' }, { status: 400 })
    }

    await adminDb.collection('subscription_requests').doc(String(id)).set(
      {
        status: String(status),
        reviewedBy: admin.email,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    )

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[admin/revenue/subscription-requests][PATCH] error', error)
    return NextResponse.json({ ok: false, error: 'Failed to update subscription request' }, { status: 500 })
  }
}
