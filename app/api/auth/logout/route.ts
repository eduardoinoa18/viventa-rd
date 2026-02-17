/**
 * Logout API
 * Clears session cookie and legacy cookies
 */

import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth/session'

export async function POST() {
  try {
    // Clear new session cookie
    clearSessionCookie()

    // Create response
    const response = NextResponse.json({
      ok: true,
      redirect: '/login',
    })

    // Clear new auth cookie
    response.cookies.delete('__session')

    // Clear legacy admin cookies (cleanup during transition)
    response.cookies.delete('admin_gate_ok')
    response.cookies.delete('admin_pw_ok')
    response.cookies.delete('admin_2fa_ok')
    response.cookies.delete('trusted_admin')
    response.cookies.delete('viventa_role')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { ok: false, error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}
