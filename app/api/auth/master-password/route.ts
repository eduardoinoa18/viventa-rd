// app/api/auth/master-password/route.ts
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'

function applyNoStoreHeaders(response: NextResponse) {
  response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

function noStoreJson(body: any, init?: ResponseInit) {
  return applyNoStoreHeaders(NextResponse.json(body, init))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = (body?.email || '').toString().trim().toLowerCase()
    const password = (body?.password || '').toString()

    const adminEmail = (process.env.MASTER_ADMIN_EMAIL || process.env.MASTER_ADMIN_EMAILS || '').toString().toLowerCase()
    const adminPass = (process.env.MASTER_ADMIN_PASSWORD || '').toString()

    if (!adminEmail || !adminPass) {
      return noStoreJson({ ok: false, error: 'ADMIN_PASSWORD_NOT_CONFIGURED' }, { status: 500 })
    }

    if (!email || !password) {
      return noStoreJson({ ok: false, error: 'INVALID_REQUEST' }, { status: 400 })
    }

    // Support multiple allowed admin emails via comma separation
    const allowedEmails = adminEmail.split(',').map(e => e.trim()).filter(Boolean)
    const isAllowed = allowedEmails.includes(email)

    if (!isAllowed || password !== adminPass) {
      return noStoreJson({ ok: false, error: 'INVALID_CREDENTIALS' }, { status: 401 })
    }

    const res = NextResponse.json({ ok: true, user: { email } })

    // Short-lived password verification cookie (2FA pending)
    res.cookies.set('admin_pw_ok', '1', { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 10 })
    res.cookies.set('admin_pw_email', email, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 10 })

    return applyNoStoreHeaders(res)
  } catch (e) {
    return noStoreJson({ ok: false, error: 'SERVER_ERROR' }, { status: 500 })
  }
}
