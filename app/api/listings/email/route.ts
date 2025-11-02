import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/emailService'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, listingId, listingTitle, agentEmail, agentName } = body || {}

    if (!event || !agentEmail || !listingTitle) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    const from = process.env.NEXT_PUBLIC_EMAIL_FROM || 'no-reply@viventa-rd.com'
    const brandColor = '#00A676'

    if (event === 'received') {
      const subject = `Hemos recibido tu listado: ${listingTitle}`
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0B2545">
          <div style="padding:24px;border-radius:12px;background:linear-gradient(135deg,#00A676,#00A6A6);color:#fff">
            <h1 style="margin:0;font-size:22px">¡Gracias por enviar tu propiedad!</h1>
            <p style="margin:6px 0 0;opacity:.9">Estamos revisando tu listado y te responderemos en 24–48 horas.</p>
          </div>
          <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;margin-top:-12px;position:relative">
            <h2 style="margin:0 0 12px">${listingTitle}</h2>
            <p>Hola ${agentName || ''},</p>
            <p>Tu propiedad fue recibida correctamente y está en cola de revisión por nuestro equipo.</p>
            <ul>
              <li>Estado: <strong>Pendiente de aprobación</strong></li>
              <li>Tiempo estimado: <strong>24–48 horas</strong></li>
            </ul>
            <p style="margin-top:16px;color:#6b7280;font-size:14px">Recibirás un correo cuando tu propiedad esté publicada.</p>
          </div>
          <div style="text-align:center;color:#6b7280;font-size:12px;margin-top:16px">VIVENTA RD • Impulsando el mercado inmobiliario del Caribe</div>
        </div>
      `
      await sendEmail({ to: agentEmail, from, subject, html, replyTo: from })
      return NextResponse.json({ ok: true })
    }

    if (event === 'approved') {
      const subject = `Tu listado ya está publicado: ${listingTitle}`
      const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://viventa-rd.com'}/listing/${listingId}`
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0B2545">
          <div style="padding:24px;border-radius:12px;background:linear-gradient(135deg,${brandColor},#00A6A6);color:#fff">
            <h1 style="margin:0;font-size:22px">¡Tu propiedad está en vivo!</h1>
            <p style="margin:6px 0 0;opacity:.9">Ya es visible en VIVENTA para todos los usuarios.</p>
          </div>
          <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;margin-top:-12px;position:relative">
            <h2 style="margin:0 0 12px">${listingTitle}</h2>
            <p>Hola ${agentName || ''},</p>
            <p>Acabamos de publicar tu propiedad. Puedes verla aquí:</p>
            <p><a href="${url}" style="display:inline-block;padding:10px 16px;background:${brandColor};color:#fff;border-radius:8px;text-decoration:none">Ver listado</a></p>
            <p style="margin-top:16px;color:#6b7280;font-size:14px">Gracias por usar VIVENTA RD.</p>
          </div>
          <div style="text-align:center;color:#6b7280;font-size:12px;margin-top:16px">VIVENTA RD • Impulsando el mercado inmobiliario del Caribe</div>
        </div>
      `
      await sendEmail({ to: agentEmail, from, subject, html, replyTo: from })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'Unsupported event' }, { status: 400 })
  } catch (e: any) {
    console.error('listings email POST error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to send email' }, { status: 500 })
  }
}
