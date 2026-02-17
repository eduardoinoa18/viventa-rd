import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

/**
 * Unified Master Admin Guard
 * Single source of truth for master admin authentication
 * Used in layout.tsx for route protection
 */
export async function requireMasterAdmin() {
  const cookieStore = cookies()
  const role = cookieStore.get('viventa_role')?.value
  const adminGate = cookieStore.get('admin_gate_ok')?.value === '1'
  const admin2FA = cookieStore.get('admin_2fa_ok')?.value === '1'

  // Must have passed gate
  if (!adminGate) {
    redirect('/admin/gate')
  }

  // Must be master_admin
  if (!role || role !== 'master_admin') {
    redirect('/admin/login')
  }

  // Must have completed 2FA
  if (!admin2FA) {
    // Check for trusted device
    const trustedAdmin = cookieStore.get('trusted_admin')?.value
    const secret = process.env.TRUSTED_DEVICE_SECRET

    if (!trustedAdmin || !secret) {
      redirect('/admin')
    }
  }

  return {
    role: 'master_admin' as const,
    authenticated: true,
  }
}

/**
 * Server action guard for API routes
 * Re-export from requireMasterAdmin.ts for backward compatibility
 */
export { requireMasterAdmin as requireMasterAdminAPI } from '../requireMasterAdmin'
