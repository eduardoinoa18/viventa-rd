export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'
import { sendEmail } from '@/lib/emailService'
import { sendInquiryConfirmation } from '@/lib/emailTemplates'
import { logger } from '@/lib/logger'
import { rateLimit, keyFromRequest } from '@/lib/rateLimiter'
import { ingestLead } from '@/lib/leadIngestion'

export async function POST(request: Request) {
  try {
    // limit to 15 inquiries per hour per IP
    const rl = await rateLimit(keyFromRequest(request), 15, 60 * 60 * 1000)
    if (!rl.allowed) return NextResponse.json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 })
    const data = await request.json()
    const {
      name,
      email,
      phone,
      message,
      visitDate,
      preferredContact,
      communicationType,
      propertyId,
      propertyTitle,
      unitNumber,
      unitModelType,
      unitPrice,
      unitSizeMt2,
      source
    } = data

    // Validation
    if (!name || !email || !phone || !message || !propertyId) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Save to Firestore property_inquiries collection via Admin SDK
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Firebase Admin not configured' }, { status: 500 })
    }

    const propertySnap = await adminDb.collection('properties').doc(propertyId).get()
    if (!propertySnap.exists) {
      return NextResponse.json({ ok: false, error: 'Property not found' }, { status: 404 })
    }
    const propertyData = propertySnap.data() as any
    const resolvedTitle = propertyData?.title || propertyTitle || 'Propiedad'
    const resolvedAgentId = propertyData?.agentId || null
    const resolvedAgentName = propertyData?.agentName || 'Agente VIVENTA'
    const resolvedAgentEmail = propertyData?.agentEmail || ''
    const normalizedCommunicationType = ['more_info', 'request_showing', 'request_call'].includes(String(communicationType || '').trim())
      ? String(communicationType).trim()
      : 'more_info'

    const inquiryRef = await adminDb.collection('property_inquiries').add({
      name,
      email,
      phone,
      message,
      visitDate: visitDate || null,
      preferredContact: preferredContact || 'email',
      propertyId,
      propertyTitle: resolvedTitle,
      unitNumber: unitNumber || '',
      unitModelType: unitModelType || '',
      unitPrice: unitPrice ?? null,
      unitSizeMt2: unitSizeMt2 ?? null,
      communicationType: normalizedCommunicationType,
      agentId: resolvedAgentId,
      agentName: resolvedAgentName,
      agentEmail: resolvedAgentEmail,
      source: source || 'property-page',
      status: 'new',
      createdAt: FieldValue.serverTimestamp(),
      readBy: [],
    })

    // Also push into centralized lead queue
    try {
      await ingestLead({
        type:
          normalizedCommunicationType === 'request_showing'
            ? 'showing'
            : normalizedCommunicationType === 'request_call'
              ? 'request-info'
              : preferredContact === 'whatsapp'
                ? 'whatsapp'
                : 'request-info',
        source: 'property',
        sourceId: propertyId,
        buyerName: name,
        buyerEmail: email,
        buyerPhone: phone,
        message,
        payload: {
          communicationType: normalizedCommunicationType,
          preferredContact: preferredContact || 'email',
          visitDate: visitDate || null,
          unitNumber: unitNumber || '',
          unitModelType: unitModelType || '',
          unitPrice: unitPrice ?? null,
          unitSizeMt2: unitSizeMt2 ?? null,
          legacyInquiryId: inquiryRef.id,
        },
      })
    } catch (leadQueueError) {
      logger.error('Failed to sync property inquiry to centralized leads queue', leadQueueError)
    }

    // Email notifications
    // VIVENTA captures all leads first — agents are notified only AFTER
    // VIVENTA assigns the lead as a referral from the master dashboard.
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
              <h1 style="color: white; margin: 0;">🏠 VIVENTA</h1>
              <p style="color: white; margin: 10px 0 0 0;">Nueva Consulta de Propiedad</p>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <div style="background: white; border-left: 4px solid #00A676; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #0B2545; margin-top: 0;">Propiedad Consultada</h2>
                <p style="font-size: 16px; color: #333; font-weight: 600;">${resolvedTitle}</p>
                <p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">ID: ${propertyId}</p>
              </div>
              <div style="background: white; border-left: 4px solid #004AAD; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #0B2545; margin-top: 0;">Datos del Cliente</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #666;">Nombre:</td>
                    <td style="padding: 10px 0; color: #333;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #666;">Email:</td>
                    <td style="padding: 10px 0; color: #333;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #666;">Teléfono:</td>
                    <td style="padding: 10px 0; color: #333;">${phone}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #666;">Tipo de solicitud:</td>
                    <td style="padding: 10px 0; color: #333;">${normalizedCommunicationType === 'request_showing' ? 'Solicitar showing / visita' : normalizedCommunicationType === 'request_call' ? 'Solicitar llamada' : 'Más información'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #666;">Contacto preferido:</td>
                    <td style="padding: 10px 0; color: #333;">${preferredContact === 'email' ? 'Email' : preferredContact === 'phone' ? 'Teléfono' : 'WhatsApp'}</td>
                  </tr>
                  ${unitNumber ? `
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #666;">Unidad:</td>
                    <td style="padding: 10px 0; color: #333;">${unitNumber}${unitModelType ? ` · ${unitModelType}` : ''}</td>
                  </tr>
                  ` : ''}
                  ${unitPrice ? `
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #666;">Precio unidad:</td>
                    <td style="padding: 10px 0; color: #333;">${unitPrice}</td>
                  </tr>
                  ` : ''}
                  ${unitSizeMt2 ? `
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #666;">Metraje unidad:</td>
                    <td style="padding: 10px 0; color: #333;">${unitSizeMt2} m²</td>
                  </tr>
                  ` : ''}
                  ${visitDate ? `
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #666;">Fecha visita:</td>
                    <td style="padding: 10px 0; color: #333;">${new Date(visitDate).toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              <div style="background: white; padding: 20px; border-radius: 8px;">
                <h3 style="color: #0B2545; margin-top: 0;">Mensaje:</h3>
                <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              </div>
              <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #0B2545; font-size: 14px;">
                  📋 ID de Consulta: <strong>${inquiryRef.id}</strong>
                </p>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
                  Ver en Admin Dashboard → Property Inquiries
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
          subject: `🏠 Nueva Consulta: ${resolvedTitle}`,
          html,
          from: 'noreply@viventa.com',
          replyTo: masterEmail
        })
      }

      // Auto-reply to the client with Caribbean-styled template
      await sendInquiryConfirmation(email, name, resolvedTitle)
      
      logger.info('Property inquiry submitted', { email, name, propertyId, propertyTitle: resolvedTitle })
    } catch (emailError) {
      logger.error('Failed to send notification email', emailError)
      // Don't fail the request if email fails
    }

    // In-app notification for admins and agent (broadcast role-based)
    try {
      await adminDb.collection('notifications').add({
        type: 'property_inquiry',
        title: 'Nueva consulta de propiedad',
        body: `${name} consultó: ${resolvedTitle}`,
        icon: '/icons/icon-192x192.png',
        url: `/admin/leads?source=property_inquiry&id=${encodeURIComponent(inquiryRef.id)}`,
        refId: inquiryRef.id,
        propertyId,
        createdAt: FieldValue.serverTimestamp(),
        // Only notify admins; agents receive notification only after referral assignment
        audience: ['admin'],
        readBy: [],
      })
    } catch (e) {
      console.warn('Failed to save admin notification:', e)
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Consulta enviada exitosamente',
      id: inquiryRef.id 
    })

  } catch (error) {
    console.error('Property inquiry error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Error al procesar solicitud' 
    }, { status: 500 })
  }
}
