// app/api/notify/social/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { sendEmail } from '@/lib/emailService'

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const emailLower = String(email || '').trim().toLowerCase()

    if (!validateEmail(emailLower)) {
      return NextResponse.json({ ok: false, error: 'Email inválido' }, { status: 400 })
    }

    const headers = req.headers
    const ip = headers.get('x-forwarded-for') || headers.get('cf-connecting-ip') || ''
    const userAgent = headers.get('user-agent') || ''
    const referer = headers.get('referer') || ''

    // Use email as document id to dedupe
    const ref = doc(collection(db, 'waitlist_social'), emailLower)

    await setDoc(ref, {
      email: emailLower,
      ip,
      userAgent,
      referer,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      source: 'social_coming_soon',
      status: 'waitlist'
    }, { merge: true })

    // Send admin email notification
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
            <p style="color: white; margin: 10px 0 0 0;">Nueva Suscripción - Red Social Waitlist</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <div style="background: white; border-left: 4px solid #00A676; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #0B2545; margin-top: 0;">Nuevo Registro en Waitlist</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #666;">Email:</td>
                  <td style="padding: 10px 0; color: #333;">${emailLower}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #666;">Origen:</td>
                  <td style="padding: 10px 0; color: #333;">Red Social - Coming Soon Page</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #666;">IP:</td>
                  <td style="padding: 10px 0; color: #333;">${ip || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #666;">Fecha:</td>
                  <td style="padding: 10px 0; color: #333;">${new Date().toLocaleString('es-DO')}</td>
                </tr>
              </table>
            </div>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #0B2545; font-size: 14px;">
                📋 Esta dirección está ahora en la lista de espera para recibir actualizaciones sobre la Red Social de VIVENTA
              </p>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
                Ver en Admin Dashboard → Waitlist Social
              </p>
            </div>
          </div>
          <div style="background: #0B2545; padding: 20px; text-align: center; color: #fff; font-size: 12px;">
            © ${new Date().getFullYear()} VIVENTA. Todos los derechos reservados.
          </div>
        </div>
      `

      for (const to of notifyEmails) {
        await sendEmail({
          to,
          subject: '🔔 Nueva Suscripción - Waitlist Red Social VIVENTA',
          html,
          from: 'noreply@viventa.com',
          replyTo: emailLower
        })
      }

      // Send confirmation to user
      const userHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #00A676 0%, #00A6A6 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">VIVENTA</h1>
            <p style="color: white; margin: 10px 0 0 0;">¡Bienvenido a la Lista de Espera!</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h2 style="color: #0B2545; margin-top: 0;">¡Gracias por tu interés! 🎉</h2>
              <p style="color: #333; line-height: 1.6;">
                Estamos emocionados de que formes parte de la lista de espera para la <strong>Red Social de VIVENTA</strong>.
              </p>
              <p style="color: #333; line-height: 1.6;">
                Serás uno de los primeros en saber cuando lancemos esta increíble plataforma donde podrás:
              </p>
              <ul style="color: #333; line-height: 1.8;">
                <li>Ver videos y tours de propiedades</li>
                <li>Interactuar con agentes y otros usuarios</li>
                <li>Descubrir listados destacados</li>
                <li>Acceder a contenido educativo exclusivo</li>
              </ul>
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px; text-center;">
                <p style="margin: 0; color: #0B2545;">
                  📧 Te enviaremos actualizaciones a <strong>${emailLower}</strong>
                </p>
              </div>
            </div>
            <div style="background: #FFF4ED; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
              <p style="margin: 0; color: #6B7280; font-size: 14px;">
                <strong>Nota:</strong> Este correo es enviado automáticamente. No respondas a este email.
              </p>
            </div>
          </div>
          <div style="background: #0B2545; padding: 20px; text-align: center; color: #fff; font-size: 12px;">
            <p style="margin: 0;"><strong>VIVENTA</strong> - Tu Espacio, Tu Futuro</p>
            <p style="margin: 5px 0 0 0;">República Dominicana</p>
            <p style="margin: 10px 0 0 0;">📧 Correo de confirmación automática - No responder</p>
          </div>
        </div>
      `

      await sendEmail({
        to: emailLower,
        subject: '✅ ¡Estás en la Lista de Espera! - Red Social VIVENTA',
        html: userHtml,
        from: 'noreply@viventa.com',
        replyTo: masterEmail
      })

    } catch (emailError) {
      console.error('Failed to send waitlist notification email', emailError)
      // Don't fail the request if email fails
    }

    // Create in-app notification for admins
    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'social_waitlist',
        title: 'Nueva suscripción - Red Social',
        message: `${emailLower} se unió a la lista de espera`,
        refId: emailLower,
        createdAt: serverTimestamp(),
        audience: ['admin', 'master'],
        readBy: [],
      })
    } catch (e) {
      console.warn('Failed to save admin notification:', e)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('notify/social POST error', e)
    return NextResponse.json({ ok: false, error: 'No se pudo registrar tu interés' }, { status: 500 })
  }
}
