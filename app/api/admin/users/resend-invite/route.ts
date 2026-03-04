import { NextRequest, NextResponse } from 'next/server'
import { requireMasterAdmin, AdminAuthError } from '@/lib/requireMasterAdmin'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { sendEmail } from '@/lib/emailService'
import { ActivityLogger } from '@/lib/activityLogger'
import { normalizeLifecycleStatus } from '@/lib/userLifecycle'
import crypto from 'crypto'
import { getPublicAppUrl } from '@/lib/publicAppUrl'

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
  const baseUrl = getPublicAppUrl()
  const inviteUrl = `${baseUrl}/auth/invite/${token}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0B2545 0%, #00A676 100%); color: #fff; padding: 28px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">VIVENTA</h1>
        <p style="margin: 8px 0 0 0; opacity: .95;">Invitación reenviada</p>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
        <p style="margin: 0 0 12px 0; color: #111827;">Hola ${name},</p>
        <p style="margin: 0 0 16px 0; color: #374151;">Tu invitación para el rol <strong>${role}</strong> fue reenviada.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${inviteUrl}" style="display:inline-block;background:#00A676;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;">Completar mi perfil</a>
        </div>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">Este enlace vence en ${expiresHours} horas.</p>
      </div>
    </div>
  `

  await sendEmail({
    to: email,
    subject: 'Invitación reenviada a VIVENTA',
    html,
    from: 'noreply@viventa.com',
  })
}

export async function POST(req: NextRequest) {
  try {
    await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'userId es requerido' }, { status: 400 })
    }

    const userSnap = await adminDb.collection('users').doc(userId).get()
    if (!userSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    const user = userSnap.data() as any
    if (!user?.email) {
      return NextResponse.json({ ok: false, error: 'El usuario no tiene email' }, { status: 400 })
    }

    const currentStatus = normalizeLifecycleStatus(user?.status)
    if (currentStatus === 'suspended' || currentStatus === 'archived') {
      return NextResponse.json(
        {
          ok: false,
          error: `No se puede reenviar invitación para un usuario en estado ${currentStatus}. Reactívalo primero.`,
        },
        { status: 409 }
      )
    }

    const pendingInvites = await adminDb
      .collection('invitations')
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .get()

    if (!pendingInvites.empty) {
      const batch = adminDb.batch()
      pendingInvites.docs.forEach((doc) => {
        batch.update(doc.ref, { status: 'revoked', used: true, updatedAt: new Date() })
      })
      await batch.commit()
    }

    const expiresHours = 72
    const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000)
    const token = generateInviteToken()

    const inviteRef = await adminDb.collection('invitations').add({
      token,
      userId,
      email: user.email,
      name: user.name || 'Viventa User',
      role: user.role || 'user',
      used: false,
      status: 'pending',
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await adminDb.collection('users').doc(userId).set(
      {
        status: currentStatus === 'invited' ? 'invited' : 'active',
        inviteId: inviteRef.id,
        inviteUsed: false,
        inviteExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
      { merge: true }
    )

    await sendInvitationEmail({
      email: user.email,
      name: user.name || 'Viventa User',
      role: user.role || 'user',
      token,
      expiresHours,
    })

    await ActivityLogger.inviteSent(userId, user.email, user.role || 'user')

    return NextResponse.json({ ok: true, message: 'Invitación reenviada correctamente' })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[admin/users/resend-invite] error:', error)
    return NextResponse.json({ ok: false, error: 'No se pudo reenviar la invitación' }, { status: 500 })
  }
}
