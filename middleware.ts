/**
 * Middleware (Phase 2 - Master Only)
 * Secure session cookie validation for /master
 * All admin access redirects to /master
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMiddlewareSession } from './lib/auth/middleware-session'

const ADMIN_ROLES = new Set(['master_admin', 'admin'])
const PROFESSIONAL_ROLES = new Set(['agent', 'broker', 'constructora'])
const BUYER_ROLES = new Set(['buyer', 'user'])

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ========== AUTH ROUTES (SESSION-AWARE) ==========
  if (pathname === '/login' || pathname === '/verify-2fa') {
    const session = await getMiddlewareSession(req)

    if (!session) {
      return NextResponse.next()
    }

    if (pathname === '/verify-2fa' && session.role === 'master_admin' && !session.twoFactorVerified) {
      return NextResponse.next()
    }

    if (session.role === 'master_admin') {
      return NextResponse.redirect(new URL(session.twoFactorVerified ? '/master' : '/verify-2fa', req.url))
    }

    if (PROFESSIONAL_ROLES.has(session.role)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (ADMIN_ROLES.has(session.role)) {
      return NextResponse.redirect(new URL('/master', req.url))
    }

    if (BUYER_ROLES.has(session.role)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.redirect(new URL('/search', req.url))
  }
  
  // ========== LEGACY ROUTE REDIRECTS ==========
  if (pathname.startsWith('/properties/')) {
    const id = pathname.replace('/properties/', '').split('/')[0]
    if (id) {
      return NextResponse.redirect(new URL(`/listing/${id}`, req.url), 308)
    }
  }

  const publicRemoved = [
    '/properties', '/social', '/favorites', '/messages',
    '/notifications', '/onboarding', '/profesionales'
  ]
  if (publicRemoved.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.redirect(new URL('/search', req.url), 308)
  }

  // ========== PUBLIC ROUTES (NEVER BLOCK) ==========
  const publicRoutes = [
    '/', '/search', '/ciudad', '/listing', '/agents', '/brokers', '/broker',
    '/contact', '/apply', '/signup', '/forgot-password', '/disclosures'
  ]
  
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next()
  }

  // ========== MASTER NAMESPACE (SECURE SESSION COOKIES) ==========
  if (pathname.startsWith('/master')) {
    const session = await getMiddlewareSession(req)

    console.log('🔐 [MIDDLEWARE] Checking /master access')
    console.log('  Session exists:', !!session)
    if (session) {
      console.log('  UID:', session.uid)
      console.log('  Email:', session.email)
      console.log('  Role:', session.role)
      console.log('  2FA Verified:', session.twoFactorVerified)
    }

    if (!session) {
      console.log('  ❌ No session - redirecting to /login')
      return NextResponse.redirect(new URL('/login?next=' + encodeURIComponent(pathname), req.url))
    }

    if (!ADMIN_ROLES.has(session.role)) {
      console.log('  ❌ Not an admin role - redirecting to /dashboard')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (session.role === 'master_admin' && !session.twoFactorVerified) {
      console.log('  ❌ 2FA not verified - redirecting to /verify-2fa')
      return NextResponse.redirect(new URL('/verify-2fa', req.url))
    }

    console.log('  ✅ Access granted to /master')
    return NextResponse.next()
  }

  if (pathname.startsWith('/dashboard')) {
    const session = await getMiddlewareSession(req)
    if (!session) {
      return NextResponse.redirect(new URL('/login?next=' + encodeURIComponent(pathname), req.url))
    }

    if (!BUYER_ROLES.has(session.role) && !PROFESSIONAL_ROLES.has(session.role)) {
      return NextResponse.redirect(new URL('/search', req.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/.*|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico).*)",
    "/dashboard/:path*"
  ],
}
