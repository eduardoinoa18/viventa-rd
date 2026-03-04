// app/api/invitations/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { sendEmail } from '@/lib/emailService'
import { getPublicAppUrl } from '@/lib/publicAppUrl'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Generate a secure random token
function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// POST - Send invitation
export async function POST(request: NextRequest) {
  try {
    const { email, name, message, inviteType } = await request.json()

    if (!email || !name || !inviteType) {
      return NextResponse.json(
        { ok: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Validate invite type
    if (!['agent', 'broker', 'user'].includes(inviteType)) {
      return NextResponse.json(
        { ok: false, error: 'Tipo de invitación inválido' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Base de datos no configurada' },
        { status: 500 }
      )
    }

    // Check if email already exists in users
    const existingUserSnap = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (!existingUserSnap.empty) {
      return NextResponse.json(
        { ok: false, error: 'Este correo ya está registrado en el sistema' },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation for this email
    const existingInviteSnap = await adminDb
      .collection('invitations')
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .limit(1)
      .get()

    if (!existingInviteSnap.empty) {
      return NextResponse.json(
        { ok: false, error: 'Ya existe una invitación pendiente para este correo' },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = generateInviteToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiration

    // Create invitation record
    const invitationData = {
      email,
      name,
      message: message || '',
      inviteType,
      token,
      status: 'pending',
      createdAt: new Date(),
      expiresAt,
      acceptedAt: null,
    }

    const inviteRef = await adminDb.collection('invitations').add(invitationData)

    // Generate invitation link
    const baseUrl = getPublicAppUrl()
    const inviteLink = `${baseUrl}/auth/invite/${token}`

    // Prepare email content based on invite type
    const roleLabel =
      inviteType === 'agent'
        ? 'Agente Inmobiliario'
        : inviteType === 'broker'
        ? 'Broker'
        : 'Usuario'

    const emailSubject = `Invitación para unirte a VIVENTA como ${roleLabel}`
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0B2545 0%, #134074 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #00A676 0%, #00C896 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .message-box { background: white; border-left: 4px solid #00A676; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .role-badge { display: inline-block; background: #00A676; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 VIVENTA</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">La plataforma inmobiliaria de República Dominicana</p>
            </div>
            
            <div class="content">
              <h2>¡Hola ${name}! 👋</h2>
              
              <p>Has sido invitado(a) a unirte a <strong>VIVENTA</strong> como <span class="role-badge">${roleLabel}</span></p>
              
              ${
                message
                  ? `
              <div class="message-box">
                <strong>Mensaje personal:</strong>
                <p style="margin: 10px 0 0 0;">${message}</p>
              </div>
              `
                  : ''
              }
              
              <p><strong>¿Qué sigue?</strong></p>
              <ul>
                <li>Haz clic en el botón para aceptar tu invitación</li>
                <li>Completa tu ${inviteType === 'user' ? 'perfil' : 'registro profesional'}</li>
                <li>Empieza a ${
                  inviteType === 'user'
                    ? 'explorar propiedades'
                    : 'impulsar tu negocio inmobiliario'
                }</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">Aceptar invitación y comenzar</a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                <strong>⏰ Esta invitación vence en 7 días</strong><br/>
                Si no puedes hacer clic en el botón, copia y pega este enlace:<br/>
                <code style="background: #e0e0e0; padding: 5px 10px; border-radius: 5px; font-size: 12px;">${inviteLink}</code>
              </p>
              
              ${
                inviteType !== 'user'
                  ? `
              <div style="background: #e8f5f1; border: 1px solid #00A676; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <strong>¿Por qué unirte a VIVENTA?</strong>
                <ul style="margin: 10px 0 0 0;">
                  <li>Acceso a herramientas y recursos premium</li>
                  <li>Conexión con compradores y vendedores calificados</li>
                  <li>Gestión de perfil profesional y listados</li>
                  <li>Analítica y seguimiento de rendimiento</li>
                  <li>Red en crecimiento de profesionales inmobiliarios</li>
                </ul>
              </div>
              `
                  : ''
              }
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} VIVENTA - República Dominicana</p>
              <p>Este es un correo automático de invitación. No respondas directamente a este mensaje.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send invitation email
    try {
      await sendEmail({
        to: email,
        subject: emailSubject,
        html: emailHtml,
      })
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError)
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({
      ok: true,
      inviteLink,
      invitationId: inviteRef.id,
      message: 'Invitación enviada correctamente',
    })
  } catch (error: any) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'No se pudo enviar la invitación' },
      { status: 500 }
    )
  }
}
