// app/api/auth/gate/route.ts
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const code = String(body?.code || '').trim()
    const expected = String(process.env.ADMIN_GATE_CODE || process.env.MASTER_ADMIN_GATE_CODE || '')

    if (!expected) {
      return NextResponse.json({ ok: false, error: 'ADMIN_GATE_CODE_NOT_SET' }, { status: 500 })
    }

    if (!code) {
      return NextResponse.json({ ok: false, error: 'CODE_REQUIRED' }, { status: 400 })
    }

    if (code !== expected) {
      return NextResponse.json({ ok: false, error: 'INVALID_CODE' }, { status: 401 })
    }

    const res = NextResponse.json({ ok: true, message: 'Gate passed' })
    // Short-lived cookie (30 minutes)
    res.cookies.set('admin_gate_ok', '1', { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 30 })
    return res
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 })
  }
}
