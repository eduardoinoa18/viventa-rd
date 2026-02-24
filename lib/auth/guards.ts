/**
 * Unified Master Admin Guard (Secure Version)
 * Uses session cookie validation (httpOnly)
 * Single source of truth for master admin authentication
 */

import { redirect } from 'next/navigation'
import { getServerSession } from './session'

/**
 * Require master admin authentication with 2FA
 * Used in layout.tsx for route protection
 */
export async function requireMasterAdmin() {
  const session = await getServerSession()

  // No session
  if (!session) {
    redirect('/login')
  }

  // Must be master_admin
  if (session.role !== 'master_admin') {
    redirect('/login')
  }

  // Must have verified 2FA
  if (!session.twoFactorVerified) {
    redirect('/verify-2fa')
  }

  return {
    uid: session.uid,
    email: session.email,
    role: 'master_admin' as const,
    authenticated: true,
  }
}

/**
 * Server action guard for API routes
 * Re-export from requireMasterAdmin.ts for backward compatibility
 */
export { requireMasterAdmin as requireMasterAdminAPI } from '../requireMasterAdmin'
