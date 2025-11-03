import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { sendEmail } from '@/lib/emailService'

function randomToken(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no confusing 0/O/I/1
  let out = ''
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const role = cookieStore.get('viventa_role')?.value || ''
    const uid = cookieStore.get('viventa_uid')?.value || ''
    if (!uid || !role) return NextResponse.json({ ok: false, error: 'not-authenticated' }, { status: 401 })
    if (!['broker', 'broker_admin', 'master_admin'].includes(role)) {
      return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
    }

    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'admin-not-configured' }, { status: 500 })

    const body = await req.json().catch(() => ({})) as { email?: string; name?: string }
    const email = (body.email || '').trim().toLowerCase()
    const name = (body.name || '').trim()
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'invalid-email' }, { status: 400 })
    }

    // Fetch broker user to attach brokerage_id if present
    const brokerSnap = await db.collection('users').doc(uid).get()
    const broker = brokerSnap.exists ? brokerSnap.data() as any : null
    const brokerage_id = broker?.brokerage_id || null

    const token = randomToken(8)
    const now = new Date()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await db.collection('invites').add({
      email,
      name: name || null,
      role: 'agent',
      brokerage_id,
      token,
      used: false,
      createdAt: now,
      expiresAt,
      invitedBy: uid,
    })

    // Send email
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
    const origin = baseUrl && /^https?:\/\//.test(baseUrl) ? baseUrl : 'https://viventa.do'
    const inviteUrl = `${origin}/auth/invite?code=${encodeURIComponent(token)}`

    const subject = `Invitación para unirte como Agente`
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111">
        <h2 style="color:#0B2545;margin:0 0 12px;">¡Te invitaron a Viventa RD!</h2>
        <p>Has sido invitado a unirte como <strong>Agente</strong>${brokerage_id ? ' en un brokerage' : ''}.</p>
        ${name ? `<p>Hola ${name},</p>` : ''}
        <p>Para aceptar la invitación puedes usar el siguiente código o hacer clic en el botón:</p>
        <p style="font-size:18px;font-weight:bold;letter-spacing:2px;background:#f4f6f8;display:inline-block;padding:8px 12px;border-radius:6px;">${token}</p>
        <p><a href="${inviteUrl}" style="display:inline-block;background:#00A676;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;margin-top:8px">Aceptar invitación</a></p>
        <p style="font-size:12px;color:#555;margin-top:16px">El código vence el ${expiresAt.toLocaleDateString()}.</p>
      </div>
    `

    try {
      await sendEmail({ to: email, subject, html })
    } catch (e) {
      // Email errors shouldn't fully block invite creation; report but continue
      return NextResponse.json({ ok: true, token, emailed: false })
    }

    return NextResponse.json({ ok: true, token, emailed: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'server-error' }, { status: 500 })
  }
}
