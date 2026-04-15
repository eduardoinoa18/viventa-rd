/**
 * API: Approve Application and Create User Account
 * Creates Firebase Auth user, sends credentials email
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin'
import { sendEmail } from '@/lib/emailService'
import { FieldValue } from 'firebase-admin/firestore'
import { getOfficeSeatQuotaStatus, resolveOfficeId, safeText, syncOfficeSeatUsage } from '@/lib/officeSubscriptionQuota'
import { buildQuotaErrorResponse } from '@/lib/quotaResponses'
import { findExistingBrokerAdminForOffice, resolveBrokerOfficeReference } from '@/lib/brokerAdminMvp'

function generateRandomPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

function generateAgentCode(role: string): string {
  const prefix = role === 'agent' ? 'AG' : 'BR'
  const random = Math.floor(100000 + Math.random() * 900000)
  return `${prefix}-${random}`
}

export async function POST(req: NextRequest) {
  try {
    const { applicationId, email, name, role, phone, company, brokerageId } = await req.json()

    if (!applicationId || !email || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate credentials
    const tempPassword = generateRandomPassword()
    const agentCode = generateAgentCode(role)

    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Admin SDK not configured' },
        { status: 500 }
      )
    }

    const normalizedRole = safeText(role).toLowerCase()
    const officeLookupRef = safeText(brokerageId) || safeText(company)
    const officeId = normalizedRole === 'agent' ? await resolveOfficeId(adminDb, officeLookupRef) : ''

    if (normalizedRole === 'broker') {
      const brokerOfficeRef = resolveBrokerOfficeReference({ company, brokerage: brokerageId })
      if (!brokerOfficeRef) {
        return NextResponse.json(
          {
            ok: false,
            error: 'company is required when approving a broker admin',
            code: 'BROKER_OFFICE_REFERENCE_REQUIRED',
          },
          { status: 400 }
        )
      }

      const existingBrokerAdmin = await findExistingBrokerAdminForOffice(adminDb, brokerOfficeRef)
      if (existingBrokerAdmin) {
        return NextResponse.json(
          {
            ok: false,
            error: 'This office/company already has a broker admin in MVP mode.',
            code: 'BROKER_ADMIN_ALREADY_EXISTS',
            officeReference: brokerOfficeRef,
            brokerAdmin: {
              id: existingBrokerAdmin.id,
              name: existingBrokerAdmin.name,
              email: existingBrokerAdmin.email,
            },
          },
          { status: 409 }
        )
      }
    }

    if (normalizedRole === 'agent') {
      const quotaStatus = await getOfficeSeatQuotaStatus(adminDb, officeId, {
        requireOffice: true,
        missingOfficeCode: 'OFFICE_ASSIGNMENT_REQUIRED',
        missingOfficeMessage: 'Broker office assignment is required to approve an agent.',
        notFoundCode: 'OFFICE_NOT_FOUND',
        notFoundMessage: 'The selected office was not found.',
      })
      if (!quotaStatus.ok) {
        return buildQuotaErrorResponse({
          status: quotaStatus,
          fallbackError: 'Office seat quota exceeded',
          fallbackCode: 'OFFICE_AGENT_LIMIT_REACHED',
          officeId: officeId || null,
        })
      }
    }

    // Create Firebase Auth user
    let authUser
    try {
      authUser = await adminAuth.createUser({
        email,
        password: tempPassword,
        displayName: name,
        emailVerified: false
      })
    } catch (authError: any) {
      console.error('Firebase Auth error:', authError)
      return NextResponse.json(
        { error: 'Failed to create auth user', details: authError.message },
        { status: 500 }
      )
    }

    // Create Firestore user profile in users collection
    try {
      const userData = {
        uid: authUser.uid,
        email,
        name,
        phone: phone || '',
        company: company || '',
        role,
        status: 'active',
        agentCode,
        professionalCode: agentCode, // Also save as professionalCode
        profileComplete: true,
        emailVerified: false,
        createdAt: FieldValue.serverTimestamp(),
        approvedAt: FieldValue.serverTimestamp(),
        applicationId,
        // Additional professional fields
        activeListings: 0,
        totalSales: 0,
        rating: 0,
        verified: true,
        ...(normalizedRole === 'agent' && officeId
          ? {
              brokerId: officeId,
              brokerageId: officeId,
              brokerage_id: officeId,
              officeId,
            }
          : {})
      }
      
      await adminDb.collection('users').doc(authUser.uid).set(userData)

      if (normalizedRole === 'agent' && officeId) {
        await syncOfficeSeatUsage(adminDb, officeId)
      }
      
      // ALSO create duplicate in agents or brokers collection for easier querying
      const targetCollection = role === 'agent' ? 'agents' : 'brokers'
      await adminDb.collection(targetCollection).doc(authUser.uid).set(userData)
    } catch (dbError: any) {
      // Rollback: delete auth user if Firestore fails
      await adminAuth.deleteUser(authUser.uid)
      console.error('Firestore error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create user profile', details: dbError.message },
        { status: 500 }
      )
    }

    // Update application status
    try {
      await adminDb.collection('applications').doc(applicationId).update({
        status: 'approved',
        approvedAt: FieldValue.serverTimestamp(),
        userId: authUser.uid,
        agentCode
      })
    } catch (appError) {
      console.error('Failed to update application:', appError)
      // Don't fail the request, user is already created
    }

    // Generate password reset link
    const resetLink = await adminAuth.generatePasswordResetLink(email)

  // Send approval email with credentials
    const subject = `¡Aprobado! Bienvenido a VIVENTA ${role === 'agent' ? 'Agente' : 'Bróker'}`
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #00A676 0%, #00A6A6 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 32px; }
    .content { padding: 40px 30px; color: #333; line-height: 1.7; }
    .credentials-box { background: #f0f9ff; border: 2px solid #00A676; padding: 25px; margin: 25px 0; border-radius: 8px; }
    .credential-item { margin: 15px 0; padding: 12px; background: white; border-radius: 4px; }
    .credential-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
    .credential-value { font-size: 18px; font-weight: bold; color: #0B2545; font-family: monospace; }
    .cta-button { display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #00A676, #00A6A6); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .warning-box { background: #fff7ed; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .footer { background: #0B2545; padding: 30px; text-align: center; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Felicidades! 🎉</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">
        Tu solicitud ha sido aprobada
      </p>
    </div>

    <div class="content">
      <h2 style="color: #0B2545;">Hola ${name}, 👋</h2>
      
      <p style="font-size: 16px;">
        ¡Excelentes noticias! Tu solicitud para unirte a VIVENTA como <strong>${role === 'agent' ? 'Agente Inmobiliario' : 'Bróker'}</strong> 
        ha sido <strong style="color: #00A676;">APROBADA</strong> ✅
      </p>

      <p>
        Ya puedes acceder a tu cuenta y empezar a publicar propiedades, conectar con clientes, 
        y crecer tu negocio inmobiliario con nuestra plataforma.
      </p>

      <div class="credentials-box">
        <h3 style="margin-top: 0; color: #0B2545;">🔐 Tus Credenciales de Acceso</h3>
        
        <div class="credential-item">
          <div class="credential-label">📧 Email</div>
          <div class="credential-value">${email}</div>
        </div>

        <div class="credential-item">
          <div class="credential-label">🔑 Contraseña Temporal</div>
          <div class="credential-value">${tempPassword}</div>
        </div>

        <div class="credential-item">
          <div class="credential-label">🏷️ Código ${role === 'agent' ? 'Agente' : 'Bróker'}</div>
          <div class="credential-value">${agentCode}</div>
        </div>
      </div>

      <div class="warning-box">
        <p style="margin: 0; font-size: 14px;">
          <strong>⚠️ IMPORTANTE - Seguridad:</strong><br/>
          1. Usa el link de abajo para crear tu contraseña personalizada<br/>
          2. La contraseña temporal expira en 24 horas<br/>
          3. Nunca compartas tus credenciales con nadie<br/>
          4. Activa la autenticación de dos factores (2FA)
        </p>
      </div>

      <center>
        <a href="${resetLink}" class="cta-button" style="color: white;">
          🔒 Crear Mi Contraseña
        </a>
      </center>

      <h3 style="color: #0B2545;">📋 Próximos Pasos:</h3>
      <ol style="line-height: 2;">
        <li>Haz clic en el botón de arriba para crear tu contraseña</li>
        <li>Inicia sesión en <a href="https://viventa-rd.com/login" style="color: #00A676;">viventa-rd.com/login</a></li>
        <li>Completa tu perfil profesional</li>
        <li>Configura la autenticación 2FA (nuevo dispositivo cada vez)</li>
        <li>Empieza a publicar propiedades</li>
      </ol>

      <div class="warning-box">
        <p style="margin: 0;">
          <strong>🔐 Autenticación de Dos Factores (2FA):</strong><br/>
          Por tu seguridad, recibirás un código por email cada vez que inicies sesión desde un nuevo dispositivo. 
          Puedes marcar dispositivos como "confiables" por 30 días para evitar verificación constante.
        </p>
      </div>

      <h3 style="color: #0B2545;">🎯 Recursos Disponibles:</h3>
      <ul>
        <li>📊 <strong>Panel de Agente/Bróker</strong> - Gestiona tus listados</li>
        <li>📈 <strong>Analíticas</strong> - Rastrea rendimiento</li>
        <li>💬 <strong>Chat</strong> - Comunica con clientes</li>
        <li>📱 <strong>App Móvil (PWA)</strong> - Trabaja desde cualquier lugar</li>
        <li>📚 <strong>Centro de Ayuda</strong> - Guías y tutoriales</li>
      </ul>

      <p style="margin-top: 30px; font-size: 16px;">
        ¡Bienvenido al equipo VIVENTA! Estamos emocionados de trabajar contigo.
      </p>

      <p>
        Saludos cordiales,<br/>
        <strong>El Equipo de VIVENTA</strong><br/>
        <em>Tu Espacio, Tu Futuro 🏡</em>
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 10px 0;">
        <strong>VIVENTA</strong> - Plataforma Inmobiliaria #1 en República Dominicana
      </p>
      <p style="margin: 0 0 10px 0;">
        📧 info@viventa.com | 📱 +1 (978) 390-5523
      </p>
      <p style="margin: 15px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.6);">
        Este correo fue enviado desde noreply@viventa-rd.com<br/>
        Para consultas, escríbenos a info@viventa.com
      </p>
    </div>
  </div>
</body>
</html>
    `

    try {
      await sendEmail({
        to: email,
        from: 'noreply@viventa-rd.com',
        replyTo: process.env.MASTER_ADMIN_EMAIL || 'viventa.rd@gmail.com',
        subject,
        html
      })
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError)
      // Don't fail the request, user is created successfully
    }

    // Create in-app notification for the approved user
    try {
      await adminDb.collection('notifications').add({
        userId: authUser.uid,
        type: 'application_approved',
        title: '¡Tu solicitud fue aprobada! ✅',
        body: 'Ya puedes acceder y completar tu perfil profesional.',
        icon: '/icons/icon-192x192.png',
        url: '/search',
        read: false,
        createdAt: FieldValue.serverTimestamp()
      })
    } catch (e) {
      // Non-critical
      console.warn('Failed to create approval notification:', e)
    }

    return NextResponse.json({ 
      success: true, 
      userId: authUser.uid,
      agentCode,
      message: 'User created and approval email sent'
    })

  } catch (error: any) {
    console.error('Application approval error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
