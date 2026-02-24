import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { Timestamp } from 'firebase-admin/firestore'
import { sendEmail } from '@/lib/emailService'
import { rateLimit, keyFromRequest } from '@/lib/rateLimiter'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, interest } = await req.json()

    if (!name || !email) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Rate limit: 10 waitlist submissions per hour per email/IP
    const rlKey = keyFromRequest(req, email)
    const rl = rateLimit(rlKey, 10, 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Database not available' }, { status: 500 })
    }

    // Save waitlist entry to database (using waitlist_social collection for admin portal compatibility)
    await adminDb.collection('waitlist_social').add({
      name,
      email,
      phone: phone || '',
      interest,
      createdAt: Timestamp.now(),
      status: 'pending',
      source: 'popup',
      readBy: []
    })

    // Create admin notification
    await adminDb.collection('notifications').add({
      type: 'waitlist_submission',
      title: '🎯 New Waitlist Signup',
      message: `${name} (${email}) joined the waitlist as ${interest}`,
      createdAt: Timestamp.now(),
      audience: ['master_admin', 'admin'],
      readBy: [],
      metadata: {
        name,
        email,
        phone,
        interest
      }
    })

    // Send email notification to admin (uses email service)
    try {
      const to = process.env.ADMIN_EMAIL || process.env.MASTER_ADMIN_EMAIL || 'viventa.rd@gmail.com'
      const from = process.env.NEXT_PUBLIC_EMAIL_FROM || 'noreply@viventa.com'
      const subject = `🎯 Nueva Inscripción en Lista de Espera - ${name}`
      const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(to right, #004AAD, #00A676); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">¡Nueva Inscripción en Lista de Espera! 🎉</h1>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #0B2545; margin-top: 0;">Detalles de Contacto</h2>
                <table style="width: 100%; background: white; border-radius: 8px; padding: 20px;">
                  <tr>
                    <td style="padding: 10px; font-weight: bold; color: #666;">Nombre:</td>
                    <td style="padding: 10px; color: #333;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold; color: #666;">Email:</td>
                    <td style="padding: 10px; color: #333;"><a href="mailto:${email}" style="color: #00A676;">${email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold; color: #666;">Teléfono:</td>
                    <td style="padding: 10px; color: #333;">${phone || 'No proporcionado'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold; color: #666;">Interés:</td>
                    <td style="padding: 10px; color: #333;">${interest}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold; color: #666;">Fecha:</td>
                    <td style="padding: 10px; color: #333;">${new Date().toLocaleString('es-DO')}</td>
                  </tr>
                </table>
                <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196F3; border-radius: 4px;">
                  <p style="margin: 0; color: #0B2545;">
                    <strong>📊 Acción Rápida:</strong> Ver todas las inscripciones en tu 
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/master/leads?source=social_waitlist" style="color: #00A676;">Portal de Administración</a>
                  </p>
                </div>
              </div>
              <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
                <p>Esta es una notificación automática de la Plataforma VIVENTA</p>
              </div>
            </div>
          `
      await sendEmail({ to, from, subject, html, replyTo: email })
    } catch (emailError) {
      console.error('Email notification failed:', emailError)
      // Don't fail the request if email fails
    }

    // Send confirmation email to user
    try {
      const to = email
      const from = process.env.NEXT_PUBLIC_EMAIL_FROM || 'noreply@viventa.com'
      const replyTo = process.env.ADMIN_EMAIL || process.env.MASTER_ADMIN_EMAIL || 'viventa.rd@gmail.com'
      const subject = '🎉 ¡Bienvenido a la Lista de Espera de VIVENTA!'
      const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(to right, #004AAD, #00A676); padding: 40px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 32px;">¡Ya Estás Dentro! 🚀</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Bienvenido a la Comunidad VIVENTA</p>
              </div>
              <div style="padding: 40px; background: white;">
                <h2 style="color: #0B2545; margin-top: 0;">¡Hola ${name}! 👋</h2>
                <p style="color: #333; line-height: 1.6; font-size: 16px;">
                  ¡Gracias por unirte a la lista de espera de VIVENTA! Estamos emocionados de tenerte como parte de nuestra comunidad desde el inicio.
                </p>
                
                <div style="background: #f0f9ff; border-left: 4px solid #00A676; padding: 20px; margin: 25px 0; border-radius: 4px;">
                  <h3 style="margin: 0 0 15px 0; color: #0B2545;">¿Qué sigue ahora?</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #333;">
                    <li style="margin-bottom: 10px;"><strong>Actualizaciones Regulares:</strong> Te mantendremos al día sobre nuestro progreso</li>
                    <li style="margin-bottom: 10px;"><strong>Acceso Beta Anticipado:</strong> Serás el primero en probar nuevas funciones</li>
                    <li style="margin-bottom: 10px;"><strong>Beneficios de Lanzamiento:</strong> Ventajas exclusivas cuando lancemos oficialmente</li>
                    <li style="margin-bottom: 10px;"><strong>Tu Opinión Importa:</strong> Ayuda a dar forma a la plataforma con tus comentarios</li>
                  </ul>
                </div>

                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0;">
                  <p style="color: white; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">Tu Posición en la Lista</p>
                  <p style="color: white; margin: 0; font-size: 14px; opacity: 0.9;">¡Eres parte de nuestros primeros apoyadores! 🌟</p>
                </div>

                <p style="color: #333; line-height: 1.6;">
                  Estamos construyendo algo especial para el mercado inmobiliario dominicano, y tu apoyo desde el inicio significa mucho para nosotros.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}" 
                     style="display: inline-block; background: linear-gradient(to right, #004AAD, #00A676); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Visitar VIVENTA
                  </a>
                </div>

                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  ¿Preguntas? Simplemente responde a este correo - ¡nos encantaría escucharte!
                </p>
              </div>
              <div style="padding: 20px; text-align: center; background: #f9f9f9; color: #666; font-size: 12px;">
                <p style="margin: 0 0 10px 0;">VIVENTA - Tu Espacio, Tu Futuro</p>
                <p style="margin: 0;">Santo Domingo, República Dominicana</p>
              </div>
            </div>
          `
      await sendEmail({ to, from, subject, html, replyTo })
    } catch (confirmEmailError) {
      console.error('Confirmation email failed:', confirmEmailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ ok: true, message: 'Waitlist submission successful' })
  } catch (error) {
    console.error('Waitlist notification error:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
