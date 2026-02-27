import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin'
import { requireMasterAdmin } from '@/lib/requireMasterAdmin'
import { sendEmail } from '@/lib/emailService'
import { ActivityLogger } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

type BootstrapUser = {
  name: string
  email: string
  phone?: string
}

type BootstrapPayload = {
  broker: BootstrapUser & { company?: string }
  agents?: BootstrapUser[]
}

function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

async function sendInvitationEmail(params: {
  email: string
  name: string
  role: string
  token: string
}) {
  const { email, name, role, token } = params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/auth/invite/${token}`
  const roleLabel = role === 'constructora' ? 'Constructora' : role.charAt(0).toUpperCase() + role.slice(1)

  await sendEmail({
    to: email,
    subject: `Viventa Beta Invite: ${roleLabel}`,
    from: 'noreply@viventa.com',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto;">
        <h2 style="color:#0B2545;">Viventa Beta Access</h2>
        <p>Hi ${name},</p>
        <p>Your <strong>${roleLabel}</strong> account has been prepared for Viventa Beta (Paraiso Inmobiliario).</p>
        <p>Complete your profile and set your password:</p>
        <p><a href="${inviteUrl}" style="color:#00A676; font-weight:bold;">${inviteUrl}</a></p>
      </div>
    `,
  })
}

async function upsertInvitedUser(params: {
  name: string
  email: string
  phone?: string
  role: 'broker' | 'agent'
  company?: string
  brokerage?: string
}) {
  const adminDb = getAdminDb()
  const adminAuth = getAdminAuth()
  if (!adminDb || !adminAuth) {
    throw new Error('Admin SDK not configured')
  }

  const normalizedEmail = params.email.trim().toLowerCase()
  const existing = await adminDb.collection('users').where('email', '==', normalizedEmail).limit(1).get()
  if (!existing.empty) {
    return { id: existing.docs[0].id, existed: true }
  }

  const authUser = await adminAuth.createUser({
    email: normalizedEmail,
    displayName: params.name,
    disabled: false,
    emailVerified: false,
  })

  const userId = authUser.uid
  await adminDb.collection('users').doc(userId).set({
    name: params.name,
    email: normalizedEmail,
    phone: params.phone || '',
    role: params.role,
    status: 'invited',
    company: params.company || '',
    brokerage: params.brokerage || '',
    emailVerified: false,
    inviteUsed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)
  const token = generateInviteToken()
  const inviteRef = await adminDb.collection('invitations').add({
    token,
    userId,
    email: normalizedEmail,
    name: params.name,
    role: params.role,
    used: false,
    status: 'pending',
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await adminDb.collection('users').doc(userId).set(
    {
      inviteId: inviteRef.id,
      inviteExpiresAt: expiresAt,
    },
    { merge: true }
  )

  await sendInvitationEmail({
    email: normalizedEmail,
    name: params.name,
    role: params.role,
    token,
  })

  await ActivityLogger.inviteSent(userId, normalizedEmail, params.role)
  await ActivityLogger.userCreated(normalizedEmail, params.name, params.role)

  return { id: userId, existed: false }
}

export async function POST(req: NextRequest) {
  try {
    await requireMasterAdmin(req)

    const body = (await req.json()) as BootstrapPayload
    if (!body?.broker?.name || !body?.broker?.email) {
      return NextResponse.json({ ok: false, error: 'broker name and email are required' }, { status: 400 })
    }

    const brokerCompany = body.broker.company?.trim() || 'Paraiso Inmobiliario'
    const brokerResult = await upsertInvitedUser({
      name: body.broker.name.trim(),
      email: body.broker.email,
      phone: body.broker.phone,
      role: 'broker',
      company: brokerCompany,
    })

    const agents = Array.isArray(body.agents) ? body.agents : []
    const agentResults: Array<{ id: string; email: string; existed: boolean }> = []

    for (const agent of agents) {
      if (!agent?.name || !agent?.email) continue
      const created = await upsertInvitedUser({
        name: agent.name.trim(),
        email: agent.email,
        phone: agent.phone,
        role: 'agent',
        brokerage: brokerCompany,
      })
      agentResults.push({
        id: created.id,
        email: agent.email.trim().toLowerCase(),
        existed: created.existed,
      })
    }

    await ActivityLogger.log({
      type: 'system',
      action: 'paraiso_beta_bootstrap',
      metadata: {
        brokerEmail: body.broker.email.trim().toLowerCase(),
        brokerExisted: brokerResult.existed,
        agentsTotal: agents.length,
        agentsCreated: agentResults.filter((r) => !r.existed).length,
      },
    })

    return NextResponse.json({
      ok: true,
      data: {
        broker: brokerResult,
        agents: agentResults,
      },
      message: 'Paraiso beta bootstrap completed',
    })
  } catch (error: any) {
    console.error('[admin/bootstrap/paraiso] error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Bootstrap failed' }, { status: 500 })
  }
}