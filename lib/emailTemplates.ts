/**
 * Professional email templates for VIVENTA
 * All templates in Spanish with Caribbean styling
 */

import { sendEmail } from './emailService'

const VIVENTA_COLORS = {
  primary: '#0B2545',
  secondary: '#00A676',
  accent: '#00A6A6',
  warm: '#FF6B35'
}

const emailStyles = `
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, ${VIVENTA_COLORS.primary} 0%, ${VIVENTA_COLORS.secondary} 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 32px; }
    .header p { color: #E8F4F8; margin: 10px 0 0 0; }
    .content { padding: 40px 30px; }
    .highlight-box { background: #F0F9FF; border-left: 4px solid ${VIVENTA_COLORS.secondary}; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .credential-box { background: linear-gradient(135deg, ${VIVENTA_COLORS.secondary} 0%, ${VIVENTA_COLORS.accent} 100%); color: white; padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0; }
    .credential-id { font-size: 36px; font-weight: bold; letter-spacing: 3px; margin: 10px 0; }
    .button { display: inline-block; background: ${VIVENTA_COLORS.secondary}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #F8F9FA; padding: 30px; text-align: center; color: #6B7280; font-size: 14px; }
    .timeline { background: #FFF4ED; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .caribbean-wave { height: 8px; background: linear-gradient(90deg, ${VIVENTA_COLORS.secondary}, ${VIVENTA_COLORS.accent}, ${VIVENTA_COLORS.warm}); }
  </style>
`

/**
 * Send application received confirmation
 */
export async function sendApplicationConfirmation(
  email: string,
  name: string,
  type: 'agent' | 'broker'
) {
  const typeEs = type === 'agent' ? 'Agente' : 'Bróker'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="caribbean-wave"></div>
        <div class="header">
          <h1>🎉 ¡Solicitud Recibida!</h1>
          <p>Tu Espacio, Tu Futuro</p>
        </div>
        
        <div class="content">
          <h2 style="color: ${VIVENTA_COLORS.primary};">¡Hola ${name}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Hemos recibido exitosamente tu solicitud para unirte a VIVENTA como <strong>${typeEs} Inmobiliario</strong>. 
            ¡Estamos emocionados de que quieras formar parte de nuestra familia profesional!
          </p>

          <div class="highlight-box">
            <h3 style="color: ${VIVENTA_COLORS.primary}; margin-top: 0;">📋 ¿Qué sigue?</h3>
            <p style="margin: 10px 0;">
              Nuestro equipo está revisando tu solicitud cuidadosamente. Te enviaremos una respuesta en un plazo de <strong>24 a 48 horas</strong>.
            </p>
          </div>

          <div class="timeline">
            <h4 style="color: ${VIVENTA_COLORS.primary}; margin-top: 0;">⏱️ Proceso de Aprobación:</h4>
            <ol style="padding-left: 20px; line-height: 1.8;">
              <li>✅ Solicitud recibida (completado)</li>
              <li>🔍 Revisión de documentos (en progreso)</li>
              <li>📧 Aprobación y envío de credenciales (24-48 hrs)</li>
              <li>🎯 ¡Comienza a publicar propiedades!</li>
            </ol>
          </div>

          <p style="color: #6B7280; font-style: italic; margin-top: 30px;">
            💡 Mientras tanto, puedes explorar nuestra plataforma y familiarizarte con las propiedades disponibles en República Dominicana.
          </p>
        </div>

        <div class="footer">
          <p><strong>VIVENTA</strong> - Plataforma Inmobiliaria Líder</p>
          <p>República Dominicana</p>
          <p style="margin-top: 15px;">
            ¿Tienes preguntas? Contáctanos en <a href="mailto:viventa.rd@gmail.com">viventa.rd@gmail.com</a>
          </p>
        </div>
        <div class="caribbean-wave"></div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `✅ Solicitud Recibida - VIVENTA ${typeEs}`,
    html
  })
}

/**
 * Send professional credentials after approval
 */
export async function sendProfessionalCredentials(
  email: string,
  name: string,
  type: 'agent' | 'broker',
  credentialId: string,
  setupLink: string
) {
  const typeEs = type === 'agent' ? 'Agente' : 'Bróker'
  const typeDescription = type === 'agent' 
    ? 'Ahora puedes crear y gestionar tus listados de propiedades.' 
    : 'Ahora puedes gestionar tu equipo de agentes y publicar propiedades.'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="caribbean-wave"></div>
        <div class="header">
          <h1>🎊 ¡Bienvenido a VIVENTA!</h1>
          <p>Tu cuenta profesional está lista</p>
        </div>
        
        <div class="content">
          <h2 style="color: ${VIVENTA_COLORS.primary};">¡Felicidades ${name}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Tu solicitud ha sido <strong>aprobada</strong>. Nos complace darte la bienvenida como <strong>${typeEs} Inmobiliario</strong> en la plataforma VIVENTA.
          </p>

          <div class="credential-box">
            <p style="margin: 0; font-size: 18px; opacity: 0.9;">Tu ID Profesional:</p>
            <div class="credential-id">${credentialId}</div>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.8;">Guarda este ID para referencia futura</p>
          </div>

          <div class="highlight-box">
            <h3 style="color: ${VIVENTA_COLORS.primary}; margin-top: 0;">🔑 Configura tu Contraseña</h3>
            <p>Para acceder a tu cuenta, primero debes crear tu contraseña segura:</p>
            <center>
              <a href="${setupLink}" class="button">Crear Mi Contraseña</a>
            </center>
            <p style="font-size: 13px; color: #6B7280; margin-top: 15px;">
              Este enlace es válido por 24 horas. Si expira, contáctanos para recibir uno nuevo.
            </p>
          </div>

          <h3 style="color: ${VIVENTA_COLORS.primary};">🚀 Próximos Pasos:</h3>
          <ol style="padding-left: 20px; line-height: 1.8;">
            <li>Haz clic en el botón de arriba para crear tu contraseña</li>
            <li>Inicia sesión en <a href="${process.env.NEXT_PUBLIC_SITE_URL}/profesionales">${process.env.NEXT_PUBLIC_SITE_URL}/profesionales</a></li>
            <li>Completa tu perfil profesional</li>
            <li>¡Comienza a publicar propiedades!</li>
          </ol>

          <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin-top: 30px;">
            <h4 style="color: ${VIVENTA_COLORS.secondary}; margin-top: 0;">✨ ¿Qué incluye tu cuenta?</h4>
            <ul style="padding-left: 20px; line-height: 1.8;">
              <li>Panel de control profesional</li>
              <li>Publicación ilimitada de propiedades</li>
              <li>Gestión de leads e inquiries</li>
              <li>Estadísticas y analytics</li>
              <li>Perfil verificado en la plataforma</li>
              ${type === 'broker' ? '<li>Gestión de equipo de agentes</li>' : ''}
            </ul>
          </div>

          <p style="color: ${VIVENTA_COLORS.primary}; margin-top: 30px;">
            ${typeDescription}
          </p>
        </div>

        <div class="footer">
          <p><strong>VIVENTA</strong> - Plataforma Inmobiliaria Líder</p>
          <p>República Dominicana</p>
          <p style="margin-top: 15px;">
            ¿Necesitas ayuda? Contáctanos en <a href="mailto:viventa.rd@gmail.com">viventa.rd@gmail.com</a>
          </p>
        </div>
        <div class="caribbean-wave"></div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `🎊 ¡Bienvenido a VIVENTA! - Tus Credenciales de ${typeEs}`,
    html
  })
}

/**
 * Send contact form confirmation
 */
export async function sendContactConfirmation(
  email: string,
  name: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="caribbean-wave"></div>
        <div class="header">
          <h1>✅ Mensaje Recibido</h1>
          <p>Gracias por contactarnos</p>
        </div>
        
        <div class="content">
          <h2 style="color: ${VIVENTA_COLORS.primary};">¡Hola ${name}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Hemos recibido tu mensaje y queremos agradecerte por contactar a VIVENTA.
          </p>

          <div class="highlight-box">
            <p style="margin: 0;">
              <strong>⏱️ Tiempo de respuesta:</strong> Te responderemos en un plazo de <strong>24 a 48 horas</strong>
            </p>
          </div>

          <p>
            Nuestro equipo revisará tu consulta cuidadosamente y te responderá lo antes posible. 
            Apreciamos tu paciencia y estamos aquí para ayudarte con cualquier consulta sobre propiedades, 
            servicios profesionales, o cualquier otra pregunta que tengas.
          </p>

          <p style="color: #6B7280; margin-top: 30px;">
            Mientras tanto, puedes explorar nuestras propiedades disponibles en 
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com'}" style="color: ${VIVENTA_COLORS.secondary};">www.viventa-rd.com</a>
          </p>

          <div style="background: #FFF4ED; padding: 15px; border-radius: 8px; margin-top: 25px; text-align: center;">
            <p style="margin: 0; color: #6B7280; font-size: 14px;">
              <strong>Nota:</strong> Este correo es enviado automáticamente desde una cuenta no monitoreada. 
              Por favor no respondas a este email. Te contactaremos desde nuestro correo oficial de soporte.
            </p>
          </div>
        </div>

        <div class="footer">
          <p><strong>VIVENTA</strong> - Tu Espacio, Tu Futuro</p>
          <p>República Dominicana</p>
          <p style="margin-top: 10px; font-size: 12px;">
            📧 Correo de confirmación automática - No responder
          </p>
        </div>
        <div class="caribbean-wave"></div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: '✅ Hemos Recibido tu Mensaje - VIVENTA',
    html,
    from: process.env.SMTP_FROM || 'noreply@viventa.com',
    replyTo: process.env.MASTER_ADMIN_EMAIL || 'viventa.rd@gmail.com'
  })
}

/**
 * Send property inquiry confirmation
 */
export async function sendInquiryConfirmation(
  email: string,
  name: string,
  propertyTitle: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="caribbean-wave"></div>
        <div class="header">
          <h1>🏠 Consulta Enviada</h1>
          <p>Estamos procesando tu interés</p>
        </div>
        
        <div class="content">
          <h2 style="color: ${VIVENTA_COLORS.primary};">¡Hola ${name}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Hemos recibido tu consulta sobre la siguiente propiedad:
          </p>

          <div class="highlight-box">
            <h3 style="color: ${VIVENTA_COLORS.primary}; margin-top: 0;">🏡 ${propertyTitle}</h3>
            <p style="margin: 0;">Un agente especializado se comunicará contigo pronto.</p>
          </div>

          <div class="timeline">
            <h4 style="color: ${VIVENTA_COLORS.primary}; margin-top: 0;">⏱️ Próximos Pasos:</h4>
            <ul style="padding-left: 20px; line-height: 1.8;">
              <li>✅ Tu consulta ha sido enviada al agente</li>
              <li>📞 El agente te contactará en 24-48 horas</li>
              <li>🏠 Podrás agendar una visita o videollamada</li>
              <li>💼 Recibirás toda la información que necesitas</li>
            </ul>
          </div>

          <p style="color: #6B7280; font-style: italic;">
            💡 <strong>Tip:</strong> Ten lista tu disponibilidad para visitar la propiedad cuando el agente te contacte.
          </p>
        </div>

        <div class="footer">
          <p><strong>VIVENTA</strong> - Tu Espacio, Tu Futuro</p>
          <p>República Dominicana</p>
        </div>
        <div class="caribbean-wave"></div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: '🏠 Consulta Recibida - VIVENTA',
    html
  })
}
