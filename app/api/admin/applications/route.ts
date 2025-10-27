import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebaseClient'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { sendEmail } from '../../../../lib/emailService'

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
    
    if (notes) {
      updateData.reviewNotes = notes
    }

    await updateDoc(appRef, updateData)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error updating application:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

// Send notification email
export async function POST(req: NextRequest) {
  try {
    const { applicationId, email, name, status, notes, type } = await req.json()

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
          ${notes ? `<div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Nota del equipo:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">${notes}</p>
          </div>` : ''}
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://viventa.com/login" style="background: #00A676; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Iniciar sesión</a>
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
