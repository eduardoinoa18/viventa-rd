/**
 * Unified Master Admin Guard (Secure Version)
 * Uses session cookie validation (httpOnly)
 * Single source of truth for master admin authentication
 */

import { redirect } from 'next/navigation'
import { getServerSession } from './session'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { normalizeLifecycleStatus } from '@/lib/userLifecycle'

const PORTAL_ROLES = new Set(['master_admin', 'admin', 'agent', 'broker', 'constructora'])

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

  const adminDb = getAdminDb()
  if (adminDb) {
    const userSnap = await adminDb.collection('users').doc(session.uid).get()
    if (userSnap.exists) {
      const status = normalizeLifecycleStatus(userSnap.data()?.status)
      if (status === 'suspended' || status === 'archived') {
        redirect('/login')
      }
    }
  }

  return {
    uid: session.uid,
    email: session.email,
    role: 'master_admin' as const,
    authenticated: true,
  }
}

export async function requirePortalAccess() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  if (!PORTAL_ROLES.has(session.role)) {
    redirect('/search')
  }

  if (session.role === 'master_admin' && !session.twoFactorVerified) {
    redirect('/verify-2fa')
  }

  const adminDb = getAdminDb()
  if (adminDb) {
    const userSnap = await adminDb.collection('users').doc(session.uid).get()
    if (userSnap.exists) {
      const status = normalizeLifecycleStatus(userSnap.data()?.status)
      if (status === 'suspended' || status === 'archived') {
        redirect('/login')
      }
    }
  }

  return {
    uid: session.uid,
    email: session.email,
    role: session.role,
    authenticated: true,
  }
}

/**
 * Server action guard for API routes
 * Re-export from requireMasterAdmin.ts for backward compatibility
 */
export { requireMasterAdmin as requireMasterAdminAPI } from '../requireMasterAdmin'
