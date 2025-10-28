// app/api/auth/master-password/route.ts
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = (body?.email || '').toString().trim().toLowerCase()
    const password = (body?.password || '').toString()

    const adminEmail = (process.env.MASTER_ADMIN_EMAIL || process.env.MASTER_ADMIN_EMAILS || '').toString().toLowerCase()
    const adminPass = (process.env.MASTER_ADMIN_PASSWORD || '').toString()

    if (!adminEmail || !adminPass) {
      return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD_NOT_CONFIGURED' }, { status: 500 })
    }

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'INVALID_REQUEST' }, { status: 400 })
    }

    // Support multiple allowed admin emails via comma separation
    const allowedEmails = adminEmail.split(',').map(e => e.trim()).filter(Boolean)
    const isAllowed = allowedEmails.includes(email)

    if (!isAllowed || password !== adminPass) {
      return NextResponse.json({ ok: false, error: 'INVALID_CREDENTIALS' }, { status: 401 })
    }

    const res = NextResponse.json({ ok: true, user: { email } })

    // Set session cookies for middleware and client
    const sessionToken = `ma_${Math.random().toString(36).slice(2)}`
    res.cookies.set('viventa_role', 'master_admin', { path: '/', httpOnly: true, sameSite: 'lax' })
    res.cookies.set('viventa_uid', 'master_admin', { path: '/', httpOnly: true, sameSite: 'lax' })
    res.cookies.set('viventa_session', sessionToken, { path: '/', httpOnly: true, sameSite: 'lax' })

    return res
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 })
  }
}
