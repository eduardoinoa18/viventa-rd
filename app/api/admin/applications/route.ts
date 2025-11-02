import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { doc, updateDoc, serverTimestamp, getDoc, addDoc, collection } from 'firebase/firestore'
import { sendEmail } from '@/lib/emailService'
import { getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin'
import { ActivityLogger } from '@/lib/activityLogger'
import { generateProfessionalId, createPasswordSetupToken } from '@/lib/credentialGenerator'
import { sendProfessionalCredentials } from '@/lib/emailTemplates'
import { logger } from '@/lib/logger'

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, notes, adminEmail } = await req.json()

    if (!id || !status) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Update application in Firestore
    const appRef = doc(db, 'applications', id)
    const updateData: any = {
      status,
      reviewedAt: serverTimestamp(),
      reviewedBy: adminEmail || 'admin',
    }
    if (notes) updateData.reviewNotes = notes

    // Read application data for logging
    const appSnap = await getDoc(appRef)
    const appData = appSnap.exists() ? (appSnap.data() as any) : null

    // If approved, try to generate credentials and upsert user profile via Admin SDK
    let code: string | undefined
    let resetLink: string | undefined
    if (status === 'approved') {
      const adminDb = getAdminDb()
      const adminAuth = getAdminAuth()
      if (appData && adminDb && adminAuth) {
        const email: string = (appData.email || '').toLowerCase()
        const name: string = appData.contact || ''
        const phone: string = appData.phone || ''
        const type: 'agent' | 'broker' | string = appData.type || 'agent'

        // Generate unique code: A##### or B#####
        const prefix = type === 'broker' ? 'B' : 'A'
        const adminDbSafe = adminDb as any
        const generateUniqueCode = async (): Promise<string> => {
          for (let i = 0; i < 5; i++) {
            const candidate = `${prefix}${Math.floor(10000 + Math.random() * 90000)}`
            const exists = await adminDbSafe
              .collection('users')
              .where(prefix === 'A' ? 'agentCode' : 'brokerCode', '==', candidate)
              .limit(1)
              .get()
            if (exists.empty) return candidate
          }
          // Fallback: timestamp-based
          return `${prefix}${Date.now().toString().slice(-5)}`
        }
        code = await generateUniqueCode()

        // Ensure Auth user exists
        let uid: string
        try {
          const rec = await adminAuth.getUserByEmail(email)
          uid = rec.uid
        } catch {
          const created = await adminAuth.createUser({ email, displayName: name, phoneNumber: phone || undefined, emailVerified: false, disabled: false })
          uid = created.uid
        }

        // Generate password reset link for the user
        try {
          resetLink = await adminAuth.generatePasswordResetLink(email)
        } catch (e) {
          // Non-fatal
          resetLink = undefined
        }

        // Upsert user profile in Firestore (Admin)
        const role = type === 'broker' ? 'broker' : 'agent'
        const payload: any = {
          uid,
          email,
          name,
          phone,
          role,
          status: 'active',
          approvedAt: new Date(),
          updatedAt: new Date(),
        }
        if (role === 'agent') payload.agentCode = code
        if (role === 'broker') payload.brokerCode = code
        if (appData.company) payload.brokerage = appData.company

        await adminDb.collection('users').doc(uid).set(payload, { merge: true })

        // Build password setup link (fallback to our custom flow if admin reset link not available)
        try {
          if (!resetLink) {
            const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com'
            const token = createPasswordSetupToken(uid)
            resetLink = `${site}/auth/setup-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}&id=${code}`
          }

          // Send professional credentials email (Spanish, Caribbean styling)
          const roleEs: 'agent' | 'broker' = (role === 'broker' ? 'broker' : 'agent')
          if (code && resetLink) {
            await sendProfessionalCredentials(email, name || 'Profesional', roleEs, code, resetLink)
            logger.info('Professional credentials email sent', { email, role: roleEs, code })
          }
        } catch (e) {
          logger.error('Failed to send professional credentials email', e)
        }

        // Annotate application doc
        updateData.approvedAt = serverTimestamp()
        updateData.assignedCode = code
        updateData.linkedUid = uid
      }
    }

    await updateDoc(appRef, updateData)

    // Log activity
    if (status === 'approved' && appData) {
      ActivityLogger.applicationApproved(id, appData.email, appData.contact, appData.type, code)
    } else if (status === 'rejected' && appData) {
      ActivityLogger.applicationRejected(id, appData.email, appData.contact, appData.type)
    }

    return NextResponse.json({ ok: true, code, resetLink })
  } catch (error: any) {
    console.error('Error updating application:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

// Send notification email
export async function POST(req: NextRequest) {
  try {
    const { applicationId, email, name, status, notes, type, resetLink, code } = await req.json()

    if (!email || !status) {
      return NextResponse.json({ ok: false, error: 'Missing email or status' }, { status: 400 })
    }

    const typeLabel = type === 'broker' ? 'Brokerage' : type === 'agent' ? 'Agente' : 'Desarrollador'
    const subject = status === 'approved' 
      ? `✅ Tu aplicación a VIVENTA ha sido aprobada`
      : `Actualización sobre tu aplicación a VIVENTA`

    const htmlContent = status === 'approved' ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0B2545 0%, #00A676 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">¡Bienvenido a VIVENTA!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px;">Hola <strong>${name || 'Profesional'}</strong>,</p>
          <p style="font-size: 16px;">¡Excelentes noticias! Tu aplicación como <strong>${typeLabel}</strong> ha sido aprobada.</p>
          <p style="font-size: 16px;">Ya puedes acceder a tu cuenta y comenzar a usar todas las herramientas de VIVENTA:</p>
          <ul style="font-size: 14px; line-height: 1.8;">
            <li>Panel de control personalizado</li>
            <li>Gestión de listados</li>
            <li>CRM integrado</li>
            <li>Reportes y estadísticas</li>
          </ul>
          ${code ? `<p style="font-size: 16px;">Tu código de ${typeLabel.toLowerCase()}: <strong>${code}</strong></p>` : ''}
          ${notes ? `<div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Nota del equipo:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">${notes}</p>
          </div>` : ''}
          <div style="text-align: center; margin: 30px 0;">
            ${resetLink ? `<a href="${resetLink}" style="background: #00A676; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Configurar contraseña</a>` : `<a href="https://viventa.com/login" style="background: #00A676; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Iniciar sesión</a>`}
          </div>
          <p style="font-size: 14px; color: #666;">Si tienes alguna pregunta, contáctanos respondiendo a este correo.</p>
          <p style="font-size: 14px; color: #666;">Saludos,<br><strong>El equipo de VIVENTA</strong></p>
        </div>
        <div style="background: #0B2545; padding: 20px; text-align: center; color: white; font-size: 12px;">
          <p style="margin: 0;">© 2025 VIVENTA. Todos los derechos reservados.</p>
        </div>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0B2545; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Actualización de tu aplicación</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px;">Hola <strong>${name || 'Profesional'}</strong>,</p>
          <p style="font-size: 16px;">Gracias por tu interés en unirte a VIVENTA como <strong>${typeLabel}</strong>.</p>
          <p style="font-size: 16px;">En este momento no podemos aprobar tu aplicación.</p>
          ${notes ? `<div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">${notes}</p>
          </div>` : ''}
          <p style="font-size: 14px; color: #666;">Si crees que esto es un error o deseas más información, contáctanos respondiendo a este correo.</p>
          <p style="font-size: 14px; color: #666;">Saludos,<br><strong>El equipo de VIVENTA</strong></p>
        </div>
        <div style="background: #0B2545; padding: 20px; text-align: center; color: white; font-size: 12px;">
          <p style="margin: 0;">© 2025 VIVENTA. Todos los derechos reservados.</p>
        </div>
      </div>
    `

    await sendEmail({
      to: email,
      subject,
      html: htmlContent,
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error sending notification email:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
