// app/api/auth/verify/route.ts
// Node runtime route that verifies Firebase ID tokens and returns role info for middleware.
import { NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

function getTokenFromHeaders(headers: Headers): string | null {
  const authHeader = headers.get('authorization') || ''
  if (authHeader.startsWith('Bearer ')) return authHeader.split(' ')[1]
  const cookie = headers.get('cookie') || ''
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/)
  if (match) return decodeURIComponent(match[1])
  return null
}

export async function GET(req: Request) {
  try {
    const auth = getAdminAuth()
    if (!auth) {
      return NextResponse.json({ ok: false, error: 'admin-not-configured' }, { status: 500 })
    }
    const token = getTokenFromHeaders(req.headers)
    if (!token) {
      return NextResponse.json({ ok: false, error: 'no-token' }, { status: 401 })
    }
    const decoded = await auth.verifyIdToken(token, true)
    const role = (decoded as any).role || (decoded as any).admin || 'client'
    const user = { uid: decoded.uid, role, email: decoded.email ?? null }
    // Only allow admin/pro roles into admin sections
    if (!['master_admin', 'admin', 'broker', 'agent'].includes(role)) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 })
    }
    return NextResponse.json({ ok: true, user })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'verify-error' }, { status: 401 })
  }
}
