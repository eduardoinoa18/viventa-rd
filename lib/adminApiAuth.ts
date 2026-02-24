import { NextRequest, NextResponse } from 'next/server'

const MASTER_ROLE = 'master_admin'

type GuardResult = NextResponse | null

/**
 * DEPRECATED: Use requireMasterAdmin() instead.
 * Tiered admin roles (admin, master_admin) were consolidated to master_admin only
 * during Q1 2024 security overhaul. Keeping this for backward compatibility during migration.
 */
export function requireAdmin(req: NextRequest): GuardResult {
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

export function requireMasterAdmin(req: NextRequest): GuardResult {
  const role = req.cookies.get('viventa_role')?.value
  const adminGate = req.cookies.get('admin_gate_ok')?.value === '1'
  const admin2FA = req.cookies.get('admin_2fa_ok')?.value === '1'
  const session = req.cookies.get('viventa_session')?.value
  const adminEmail = req.cookies.get('viventa_admin_email')?.value

  if (!role || role !== MASTER_ROLE) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }
  if (!adminGate || !admin2FA || !session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
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
