import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminAuth } from '@/lib/firebaseAdmin'
import { requireMasterSession } from '@/lib/auth/requireMasterSession'

export async function POST(req: NextRequest) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN','ADMIN'] })
  if (authResult instanceof Response) return authResult

  try {
    const { uid, email } = await req.json()
    if (!uid && !email) {
      return NextResponse.json({ ok: false, error: 'uid or email required' }, { status: 400 })
    }

    const adminAuth = getAdminAuth()
    if (!adminAuth) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
    }

    let targetEmail = email as string | undefined
    if (!targetEmail && uid) {
      const user = await adminAuth.getUser(uid)
      targetEmail = user.email || undefined
    }

    if (!targetEmail) {
      return NextResponse.json({ ok: false, error: 'Email not found for user' }, { status: 404 })
    }

    const link = await adminAuth.generatePasswordResetLink(targetEmail)
    return NextResponse.json({ ok: true, resetLink: link })
  } catch (e: any) {
    console.error('reset-password error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to generate reset link' }, { status: 500 })
  }
}
