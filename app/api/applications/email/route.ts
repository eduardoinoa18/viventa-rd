/**
 * API: Send Application Received Email
 * Sends professional email to applicant confirming receipt
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendApplicationConfirmation } from '@/lib/emailTemplates'
import { logger } from '@/lib/logger'
import { rateLimit, keyFromRequest } from '@/lib/rateLimiter'

export async function POST(req: NextRequest) {
  try {
    const { email, name, type } = await req.json()
    
    // Rate limit: 3 applications per hour per email/IP
    const rlKey = email ? keyFromRequest(req, email) : keyFromRequest(req)
    const rl = rateLimit(rlKey, 3, 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
    }

    if (!email || !name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const normalizedType = String(type || '').toLowerCase()
    const isAgent = normalizedType === 'agent' || normalizedType === 'new-agent'
    const isConstructora = normalizedType === 'constructora' || normalizedType === 'developer'
    const subject = `Solicitud Recibida - VIVENTA ${isConstructora ? 'Constructora' : isAgent ? 'Agente' : 'Bróker'}`

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #0B2545 0%, #134074 50%, #00A676 100%); padding: 40px 20px; text-align: center; }
    .header img { max-width: 150px; height: auto; margin-bottom: 20px; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; color: #333; line-height: 1.6; }
    .content h2 { color: #0B2545; margin-top: 0; }
    .highlight-box { background: #f0f9ff; border-left: 4px solid #00A676; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .timeline { background: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .timeline-item { display: flex; align-items: center; margin: 10px 0; }
    .timeline-icon { width: 30px; height: 30px; background: #00A676; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; margin-right: 15px; font-size: 14px; font-weight: bold; }
    .cta-button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #00A676, #00A6A6); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
    .caribbean-house { width: 100%; max-width: 500px; height: auto; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="https://viventa-rd.com/logo.png" alt="VIVENTA" />
      <h1>¡Solicitud Recibida!</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <h2>Hola ${name} 👋</h2>
      
      <p>
        Gracias por tu interés en unirte a <strong>VIVENTA</strong>, la plataforma inmobiliaria líder en República Dominicana.
      </p>

      <div class="highlight-box">
        <p style="margin: 0; font-size: 16px;">
          ✅ Tu solicitud como <strong>${isConstructora ? 'Constructora / Desarrollador' : isAgent ? 'Agente Inmobiliario' : 'Bróker'}</strong> ha sido recibida exitosamente y está siendo revisada por nuestro equipo.
        </p>
      </div>

      <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=300&fit=crop" alt="Caribbean Villa" class="caribbean-house" />

      <h3 style="color: #0B2545;">📋 Próximos Pasos:</h3>
      
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-icon">1</div>
          <div><strong>Revisión de Documentación</strong> - 24-48 horas</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon">2</div>
          <div><strong>Verificación de Referencias</strong></div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon">3</div>
          <div><strong>Aprobación y Credenciales</strong></div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon">4</div>
          <div><strong>Acceso a la Plataforma</strong></div>
        </div>
      </div>

      <p>
        <strong>Nuestro equipo revisará tu solicitud en un plazo de 24 a 48 horas hábiles.</strong> 
        Te contactaremos por correo electrónico y/o teléfono con el resultado de la revisión.
      </p>

      <div class="highlight-box">
        <p style="margin: 0;">
          <strong>💡 Consejo:</strong> Mientras esperas, puedes explorar propiedades disponibles en nuestra plataforma y familiarizarte con nuestros servicios.
        </p>
      </div>

      <center>
        <a href="https://viventa-rd.com/search" class="cta-button" style="color: white;">
          🏠 Explorar Propiedades
        </a>
      </center>

      <h3 style="color: #0B2545;">¿Tienes preguntas?</h3>
      <p>
        Si tienes alguna pregunta sobre tu solicitud o necesitas asistencia, no dudes en contactarnos:
      </p>
      <ul>
        <li>📧 Email: <a href="mailto:info@viventa.com">info@viventa.com</a></li>
        <li>📱 WhatsApp: +1 (978) 390-5523</li>
        <li>🌐 Web: <a href="https://viventa-rd.com">viventa-rd.com</a></li>
      </ul>

      <p style="margin-top: 30px;">
        Gracias por elegir VIVENTA. ¡Esperamos trabajar contigo pronto!
      </p>

      <p>
        Saludos cordiales,<br/>
        <strong>El Equipo de VIVENTA</strong><br/>
        <em>Tu Espacio, Tu Futuro 🏡</em>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 10px 0;">
        <strong>VIVENTA</strong> - Plataforma Inmobiliaria #1 en República Dominicana
      </p>
      <p style="margin: 0 0 10px 0;">
        Santo Domingo, República Dominicana
      </p>
      <p style="margin: 0; font-size: 12px; color: #999;">
        Este es un correo automático, por favor no respondas a esta dirección. 
        Para cualquier consulta, escríbenos a info@viventa.com
      </p>
    </div>
  </div>
</body>
</html>
    `

    // Use our new Caribbean-styled template instead
    await sendApplicationConfirmation(email, name, isAgent ? 'agent' : 'broker')
    
    logger.info('Application confirmation email sent', { email, name, type })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Application email error', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
