/**
 * Middleware (Phase 1+2 - Transition)
 * Secure session cookie validation for /master
 * Keeps old /admin system as fallback
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMiddlewareSession } from './lib/auth/middleware-session'
import { verifyTrustedToken } from './lib/auth/trustedDevice'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // ========== LEGACY ROUTE REDIRECTS ==========
  if (pathname.startsWith('/properties/')) {
    const id = pathname.replace('/properties/', '').split('/')[0]
    if (id) {
      return NextResponse.redirect(new URL(`/listing/${id}`, req.url), 308)
    }
  }

  const publicRemoved = [
    '/properties', '/social', '/favorites', '/messages',
    '/notifications', '/dashboard', '/onboarding', '/profesionales',
    '/agent', '/broker'
  ]
  if (publicRemoved.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.redirect(new URL('/search', req.url), 308)
  }

  const adminRemoved = [
    '/admin/inbox', '/admin/chat', '/admin/notifications', '/admin/billing',
    '/admin/email', '/admin/push', '/admin/activity', '/admin/master',
    '/admin/agents', '/admin/brokers', '/admin/users', '/admin/roles',
    '/admin/people/leads', '/admin/people/applications'
  ]
  if (adminRemoved.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.redirect(new URL('/admin', req.url), 308)
  }

  if (pathname === '/admin/verify' || pathname.startsWith('/admin/verify/')) {
    return NextResponse.redirect(new URL('/admin/login', req.url), 308)
  }

  // ========== PUBLIC ROUTES (NEVER BLOCK) ==========
  const publicRoutes = [
    '/', '/search', '/ciudad', '/listing', '/agents', '/brokers',
    '/contact', '/apply', '/signup', '/forgot-password', '/disclosures',
    '/login', '/verify-2fa'  // Auth routes must be public
  ]
  
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next()
  }

  // ========== NEW MASTER NAMESPACE (SECURE SESSION COOKIES) ==========
  if (pathname.startsWith('/master')) {
    const session = await getMiddlewareSession(req)

    if (!session) {
      return NextResponse.redirect(new URL('/login?redirect=' + pathname, req.url))
    }

    if (session.role !== 'master_admin') {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (!session.twoFactorVerified) {
      return NextResponse.redirect(new URL('/verify-2fa', req.url))
    }

    return NextResponse.next()
  }

  // ========== OLD ADMIN NAMESPACE (LEGACY COOKIES - KEEP DURING TRANSITION) ==========
  const role = req.cookies.get('viventa_role')?.value
  const adminGate = req.cookies.get('admin_gate_ok')?.value === '1'
  let admin2FA = req.cookies.get('admin_2fa_ok')?.value === '1'
  const trustedAdmin = req.cookies.get('trusted_admin')?.value

  if (pathname.startsWith('/admin') && (pathname === '/admin' || pathname === '/admin/login')) {
    if (!adminGate) {
      return NextResponse.redirect(new URL('/admin/gate', req.url))
    }
  }

  if (pathname.startsWith('/admin') && !['/admin/login','/admin/gate'].includes(pathname)) {
    if (!adminGate) {
      return NextResponse.redirect(new URL('/admin/gate', req.url))
    }
    if (role !== 'master_admin') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    if (!admin2FA) {
      if (trustedAdmin) {
        const secret = process.env.TRUSTED_DEVICE_SECRET
        if (!secret && process.env.NODE_ENV === 'production') {
          console.error('CRITICAL: TRUSTED_DEVICE_SECRET not set in production')
          return NextResponse.redirect(new URL('/admin', req.url))
        }
        const ok = secret ? await verifyTrustedToken(trustedAdmin, secret) : false
        if (ok) {
          const res = NextResponse.next()
          res.cookies.set('admin_2fa_ok', '1', { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 30 })
          return res
        }
      }
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  // ========== GENERAL USER ROUTES ==========
  const isLoggedInUser = role && role !== 'master_admin'
  if (isLoggedInUser && pathname === '/login') {
    return NextResponse.redirect(new URL('/search', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/.*|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico).*)",
    "/dashboard/:path*"
  ],
}
