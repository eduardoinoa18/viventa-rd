// app/api/contact/submit/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { sendEmail } from '@/lib/emailService'
import { sendContactConfirmation } from '@/lib/emailTemplates'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { name, email, phone, type, message, source } = data

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Save to Firestore contact_submissions collection
    const docRef = await addDoc(collection(db, 'contact_submissions'), {
      name,
      email,
      phone: phone || '',
      type: type || 'general',
      message,
      source: source || 'website',
      status: 'new',
      createdAt: serverTimestamp(),
      readBy: [],
    })

    // Send email notification to admin(s)
    const masterEmail = process.env.MASTER_ADMIN_EMAIL || 'viventa.rd@gmail.com'
    const adminList = (process.env.ADMIN_NOTIFICATION_EMAILS || '')
      .split(',')
      .map(e => e.trim())
      .filter(Boolean)
    const notifyEmails = Array.from(new Set([masterEmail, ...adminList]))

    try {
      const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0B2545 0%, #00A676 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">VIVENTA</h1>
              <p style="color: white; margin: 10px 0 0 0;">Nuevo Mensaje de Contacto</p>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <div style="background: white; border-left: 4px solid #00A676; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #0B2545; margin-top: 0;">Detalles del Contacto</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #666;">Nombre:</td>
                    <td style="padding: 10px 0; color: #333;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #666;">Email:</td>
                    <td style="padding: 10px 0; color: #333;">${email}</td>
                  </tr>
                  ${phone ? `
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #666;">Teléfono:</td>
                    <td style="padding: 10px 0; color: #333;">${phone}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #666;">Tipo:</td>
                    <td style="padding: 10px 0; color: #333;">${type || 'General'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #666;">Origen:</td>
                    <td style="padding: 10px 0; color: #333;">${source || 'Website'}</td>
                  </tr>
                </table>
              </div>
              <div style="background: white; padding: 20px; border-radius: 8px;">
                <h3 style="color: #0B2545; margin-top: 0;">Mensaje:</h3>
                <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              </div>
              <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #0B2545; font-size: 14px;">
                  📋 ID de Submission: <strong>${docRef.id}</strong>
                </p>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
                  Ver en Admin Dashboard → Contact Submissions
                </p>
              </div>
            </div>
            <div style="background: #0B2545; padding: 20px; text-align: center; color: #fff; font-size: 12px;">
              © ${new Date().getFullYear()} VIVENTA. Todos los derechos reservados.
            </div>
          </div>
        `

      for (const to of notifyEmails) {
        await sendEmail({ to, subject: `🔔 Nuevo Contacto desde ${source || 'Website'} - ${type || 'General'}`, html })
      }

      // Auto-reply to the sender with Caribbean-styled template
      await sendContactConfirmation(email, name)
      
      logger.info('Contact form submitted', { email, name, type, source })
    }
    catch (emailError) {
      logger.error('Failed to send notification email', emailError)
      // Don't fail the request if email fails
    }

    // In-app notification for admins
    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'contact_submission',
        title: 'Nuevo contacto recibido',
        message: `${name} (${email}) - ${type || 'General'}`,
        refId: docRef.id,
        createdAt: serverTimestamp(),
        audience: ['admin', 'master'],
        readBy: [],
      })
    } catch (e) {
      console.warn('Failed to save admin notification:', e)
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Mensaje enviado exitosamente',
      id: docRef.id 
    })

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Error al procesar solicitud' 
    }, { status: 500 })
  }
}
