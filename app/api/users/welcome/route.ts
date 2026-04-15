/**
 * API: Send Welcome Email to New Users
 * Professional welcome email with Caribbean imagery
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/emailService'

export async function POST(req: NextRequest) {
  try {
    const { email, name, userType = 'user' } = await req.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const subject = '¡Bienvenido a VIVENTA! 🏡'

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #0B2545 0%, #00A676 100%); padding: 40px 20px; text-align: center; }
    .header img { max-width: 180px; height: auto; margin-bottom: 15px; }
    .header h1 { color: white; margin: 0; font-size: 32px; font-weight: bold; }
    .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }
    .content { padding: 40px 30px; color: #333; line-height: 1.7; }
    .welcome-banner { width: 100%; height: 250px; object-fit: cover; border-radius: 0; }
    .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 30px 0; }
    .feature-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef; }
    .feature-icon { font-size: 32px; margin-bottom: 10px; }
    .feature-title { font-weight: bold; color: #0B2545; margin-bottom: 5px; }
    .feature-desc { font-size: 13px; color: #666; }
    .cta-button { display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #00A676, #00A6A6); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 25px 0; font-size: 16px; }
    .highlight-box { background: linear-gradient(135deg, #fff7ed, #fef3c7); border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px; }
    .footer { background: #0B2545; padding: 30px; text-align: center; color: white; }
    .footer-links { margin: 20px 0; }
    .footer-links a { color: #00A676; text-decoration: none; margin: 0 10px; }
    .social-icons { margin: 20px 0; }
    .social-icons a { display: inline-block; margin: 0 8px; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="https://viventa-rd.com/logo.png" alt="VIVENTA" />
      <h1>¡Bienvenido a VIVENTA!</h1>
      <p>Tu Espacio, Tu Futuro 🏡</p>
    </div>

    <!-- Welcome Banner -->
    <img src="https://images.unsplash.com/photo-1499916078039-922301b0eb9b?w=600&h=250&fit=crop" alt="Caribbean Beach Villa" class="welcome-banner" />

    <!-- Content -->
    <div class="content">
      <h2 style="color: #0B2545; margin-top: 0;">Hola ${name}, 👋</h2>
      
      <p style="font-size: 16px;">
        ¡Gracias por unirte a <strong>VIVENTA</strong>, la plataforma inmobiliaria #1 en República Dominicana! 
        Estamos emocionados de tenerte con nosotros.
      </p>

      <p>
        Ya puedes explorar miles de propiedades en Santo Domingo, Punta Cana, Santiago, y más. 
        Desde apartamentos modernos hasta villas frente al mar, encuentra tu espacio ideal con nosotros.
      </p>

      <div class="highlight-box">
        <p style="margin: 0; font-size: 15px;">
          <strong>🎉 ¡Tu cuenta está lista!</strong><br/>
          Ahora puedes guardar tus propiedades favoritas, crear alertas de búsqueda personalizadas, 
          y conectar directamente con agentes verificados.
        </p>
      </div>

      <h3 style="color: #0B2545;">✨ ¿Qué puedes hacer en VIVENTA?</h3>

      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">🔍</div>
          <div class="feature-title">Búsqueda Avanzada</div>
          <div class="feature-desc">Filtra por ubicación, precio, tipo de propiedad y más</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">❤️</div>
          <div class="feature-title">Favoritos</div>
          <div class="feature-desc">Guarda propiedades y accede desde cualquier dispositivo</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🗺️</div>
          <div class="feature-title">Mapa Interactivo</div>
          <div class="feature-desc">Visualiza propiedades en tiempo real</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💬</div>
          <div class="feature-title">Contacto Directo</div>
          <div class="feature-desc">WhatsApp y email con agentes verificados</div>
        </div>
      </div>

      <center>
        <a href="https://viventa-rd.com/search" class="cta-button" style="color: white;">
          🏠 Empezar a Buscar
        </a>
      </center>

      <h3 style="color: #0B2545;">🎯 Próximos Pasos:</h3>
      <ul style="line-height: 2;">
        <li>🔍 <strong>Explora propiedades</strong> en tu zona favorita</li>
        <li>❤️ <strong>Guarda favoritos</strong> para revisarlos más tarde</li>
        <li>🔔 <strong>Activa notificaciones</strong> para nuevas propiedades</li>
        <li>📱 <strong>Descarga nuestra PWA</strong> para acceso rápido</li>
        <li>👤 <strong>Completa tu perfil</strong> para una mejor experiencia</li>
      </ul>

      <div class="highlight-box">
        <p style="margin: 0;">
          <strong>💡 ¿Sabías que...?</strong><br/>
          República Dominicana es uno de los destinos de inversión inmobiliaria más atractivos del Caribe, 
          con crecimiento constante y oportunidades únicas para compradores locales e internacionales.
        </p>
      </div>

      <h3 style="color: #0B2545;">🏝️ Destinos Populares:</h3>
      <p>
        ✨ <strong>Santo Domingo</strong> - Capital cosmopolita<br/>
        🏖️ <strong>Punta Cana</strong> - Playas paradisíacas<br/>
        🏔️ <strong>Santiago</strong> - Corazón del Cibao<br/>
        ⛵ <strong>La Romana</strong> - Lujo y exclusividad<br/>
        🌴 <strong>Samaná</strong> - Naturaleza virgen
      </p>

      <h3 style="color: #0B2545;">¿Necesitas Ayuda?</h3>
      <p>
        Nuestro equipo está aquí para ayudarte en cada paso del camino:
      </p>
      <ul>
        <li>📧 Email: <a href="mailto:info@viventa.com" style="color: #00A676;">info@viventa.com</a></li>
        <li>📱 WhatsApp: +1 (978) 390-5523</li>
        <li>💬 Chat en vivo (próximamente)</li>
        <li>📚 <a href="https://viventa-rd.com/help" style="color: #00A676;">Centro de Ayuda</a></li>
      </ul>

      <p style="margin-top: 30px; font-size: 16px;">
        ¡Gracias por confiar en VIVENTA para encontrar tu próximo hogar o inversión!
      </p>

      <p>
        Con cariño,<br/>
        <strong>El Equipo de VIVENTA</strong><br/>
        <em>Tu Espacio, Tu Futuro 🏡🌴</em>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <img src="https://viventa-rd.com/logo.png" alt="VIVENTA" style="max-width: 120px; margin-bottom: 15px;" />
      
      <p style="margin: 10px 0; font-size: 15px;">
        <strong>VIVENTA</strong> - Plataforma Inmobiliaria #1 en República Dominicana
      </p>
      
      <div class="footer-links">
        <a href="https://viventa-rd.com">Inicio</a> |
        <a href="https://viventa-rd.com/search">Buscar</a> |
        <a href="https://viventa-rd.com/agents">Agentes</a> |
        <a href="https://viventa-rd.com/contact">Contacto</a>
      </div>

      <div class="social-icons">
        <a href="#"><img src="https://img.icons8.com/color/32/facebook-new.png" alt="Facebook" /></a>
        <a href="#"><img src="https://img.icons8.com/color/32/instagram-new.png" alt="Instagram" /></a>
        <a href="#"><img src="https://img.icons8.com/color/32/linkedin.png" alt="LinkedIn" /></a>
        <a href="#"><img src="https://img.icons8.com/color/32/whatsapp.png" alt="WhatsApp" /></a>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.7);">
        Santo Domingo, República Dominicana<br/>
        © 2025 VIVENTA. Todos los derechos reservados.
      </p>
      
      <p style="margin: 15px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.6);">
        Este es un correo automático enviado desde noreply@viventa-rd.com<br/>
        Para consultas, escríbenos a info@viventa.com
      </p>
    </div>
  </div>
</body>
</html>
    `

    await sendEmail({
      to: email,
      from: 'noreply@viventa-rd.com',
      replyTo: process.env.MASTER_ADMIN_EMAIL || 'viventa.rd@gmail.com',
      subject,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Welcome email error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
