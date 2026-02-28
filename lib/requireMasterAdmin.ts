import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { normalizeLifecycleStatus } from '@/lib/userLifecycle'

/**
 * Comprehensive master admin guard
 * 
 * Validates:
 * - Role is master_admin
 * - 2FA is complete
 * - Session is valid (httpOnly)
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
  const session = await getSessionFromRequest(request)
  if (!session) {
    throw new AdminAuthError('UNAUTHORIZED', 401, 'Session token missing. Re-authenticate.')
  }

  if (session.role !== 'master_admin') {
    throw new AdminAuthError('FORBIDDEN', 403, 'Master admin role required')
  }

  if (!session.twoFactorVerified) {
    throw new AdminAuthError('UNAUTHORIZED', 401, '2FA verification required')
  }

  const email = session.email
  if (!email) {
    throw new AdminAuthError('UNAUTHORIZED', 401, 'Admin email missing from session')
  }

  const adminDb = getAdminDb()
  if (adminDb) {
    try {
      const userSnap = await adminDb.collection('users').doc(session.uid).get()
      if (userSnap.exists) {
        const status = normalizeLifecycleStatus(userSnap.data()?.status)
        if (status === 'suspended' || status === 'archived') {
          throw new AdminAuthError('UNAUTHORIZED', 401, `Account is ${status}. Access denied.`)
        }
      }
    } catch (error) {
      if (error instanceof AdminAuthError) throw error
      console.warn('[requireMasterAdmin] lifecycle status check skipped:', (error as any)?.message)
    }
  }

  // In production, verify email is in allowlist
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

  const sessionToken = request.cookies.get('__session')?.value || ''

  return {
    uid: session.uid,
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
