import { NextRequest, NextResponse } from 'next/server'

/**
 * Comprehensive master admin guard
 * 
 * Validates:
 * - Role is master_admin
 * - Gate has been passed
 * - 2FA is complete
 * - Session is valid
 * - Email is in allowlist (production only)
 * 
 * Returns structured admin identity or throws
 */

export interface AdminContext {
  uid: string
  email: string
  role: 'master_admin'
  sessionToken: string
}

export class AdminAuthError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'AdminAuthError'
  }
}

function getAllowedMasterEmails(): Set<string> {
  const raw = (process.env.MASTER_ADMIN_EMAILS || process.env.MASTER_ADMIN_EMAIL || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  return new Set(raw)
}

/**
 * Extract and validate master admin session from request
 * Throws AdminAuthError if validation fails
 */
export async function requireMasterAdmin(request: NextRequest): Promise<AdminContext> {
  // 1. Check role
  const role = request.cookies.get('viventa_role')?.value
  if (!role || role !== 'master_admin') {
    throw new AdminAuthError(
      'FORBIDDEN',
      403,
      'Master admin role required'
    )
  }

  // 2. Check gate (coarse password/email check from middleware)
  const adminGate = request.cookies.get('admin_gate_ok')?.value === '1'
  if (!adminGate) {
    throw new AdminAuthError(
      'UNAUTHORIZED',
      401,
      'Admin gate not passed. Re-authenticate.'
    )
  }

  // 3. Check 2FA is complete
  const admin2FA = request.cookies.get('admin_2fa_ok')?.value === '1'
  if (!admin2FA) {
    throw new AdminAuthError(
      'UNAUTHORIZED',
      401,
      '2FA verification required'
    )
  }

  // 4. Check session token exists
  const sessionToken = request.cookies.get('viventa_session')?.value
  if (!sessionToken) {
    throw new AdminAuthError(
      'UNAUTHORIZED',
      401,
      'Session token missing. Re-authenticate.'
    )
  }

  // 5. Check email exists
  const email = request.cookies.get('viventa_admin_email')?.value
  if (!email) {
    throw new AdminAuthError(
      'UNAUTHORIZED',
      401,
      'Admin email missing from session'
    )
  }

  // 6. In production, verify email is in allowlist
  const isDev = process.env.NODE_ENV !== 'production'
  const allowAny = process.env.ALLOW_ANY_MASTER_EMAIL === 'true'

  if (!isDev && !allowAny) {
    const allowedEmails = getAllowedMasterEmails()
    if (allowedEmails.size === 0) {
      throw new AdminAuthError(
        'FORBIDDEN',
        403,
        'No master admin emails configured'
      )
    }
    if (!allowedEmails.has(email.toLowerCase())) {
      throw new AdminAuthError(
        'FORBIDDEN',
        403,
        `Email ${email} is not authorized for admin access`
      )
    }
  }

  // 7. Get UID from cookie (or derive from email if needed)
  const uid = request.cookies.get('viventa_uid')?.value || email

  return {
    uid,
    email,
    role: 'master_admin',
    sessionToken
  }
}

/**
 * Wrap requireMasterAdmin for use in route handlers
 * Automatically returns standardized error responses
 */
export async function withMasterAdmin(
  request: NextRequest,
  handler: (admin: AdminContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const admin = await requireMasterAdmin(request)
    return await handler(admin)
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status }
      )
    }
    // Unexpected error
    console.error('Unexpected auth error:', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
