/**
 * Logout API
 * Clears session cookie and legacy cookies
 */

import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth/session'

function applyNoStoreHeaders(response: NextResponse) {
  response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

function noStoreJson(body: any, init?: ResponseInit) {
  return applyNoStoreHeaders(NextResponse.json(body, init))
}

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
    response.cookies.delete('viventa_uid')
    response.cookies.delete('viventa_2fa')
    response.cookies.delete('viventa_name')

    return applyNoStoreHeaders(response)
  } catch (error) {
    console.error('Logout error:', error)
    return noStoreJson(
      { ok: false, error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}
