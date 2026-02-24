import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from './auth/session'

const MASTER_ROLE = 'master_admin'

type GuardResult = NextResponse | null

/**
 * DEPRECATED: Use requireMasterAdmin() instead.
 * Tiered admin roles (admin, master_admin) were consolidated to master_admin only
 * during Q1 2024 security overhaul. Keeping this for backward compatibility during migration.
 */
export async function requireAdmin(req: NextRequest): Promise<GuardResult> {
  // All admin API routes now require master_admin role
  return requireMasterAdmin(req)
}

function getAllowedMasterEmails(): Set<string> {
  const raw = (process.env.MASTER_ADMIN_EMAILS || process.env.MASTER_ADMIN_EMAIL || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  return new Set(raw)
}

export async function requireMasterAdmin(req: NextRequest): Promise<GuardResult> {
  const session = await getSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (session.role !== MASTER_ROLE) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }

  if (!session.twoFactorVerified) {
    return NextResponse.json({ ok: false, error: '2FA verification required' }, { status: 401 })
  }

  const adminEmail = session.email
  if (!adminEmail) {
    return NextResponse.json({ ok: false, error: 'Admin email missing' }, { status: 401 })
  }

  const allowAny = process.env.ALLOW_ANY_MASTER_EMAIL === 'true'
  const allowed = getAllowedMasterEmails()
  const isDev = process.env.NODE_ENV !== 'production'
  if (!allowAny && !isDev) {
    if (allowed.size === 0) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
    if (!allowed.has(adminEmail.toLowerCase())) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
  }

  return null
}
