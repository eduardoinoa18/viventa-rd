/**
 * Middleware (Phase 2 - Master Only)
 * Secure session cookie validation for /master
 * All admin access redirects to /master
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMiddlewareSession } from './lib/auth/middleware-session'

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

  // ========== PUBLIC ROUTES (NEVER BLOCK) ==========
  const publicRoutes = [
    '/', '/search', '/ciudad', '/listing', '/agents', '/brokers',
    '/contact', '/apply', '/signup', '/forgot-password', '/disclosures',
    '/login', '/verify-2fa'  // Auth routes must be public
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
      return NextResponse.redirect(new URL('/login?redirect=' + pathname, req.url))
    }

    if (session.role !== 'master_admin') {
      console.log('  ❌ Not master_admin - redirecting to /login')
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (!session.twoFactorVerified) {
      console.log('  ❌ 2FA not verified - redirecting to /verify-2fa')
      return NextResponse.redirect(new URL('/verify-2fa', req.url))
    }

    console.log('  ✅ Access granted to /master')
    return NextResponse.next()
  }

  // ========== GENERAL USER ROUTES ==========
  const role = req.cookies.get('viventa_role')?.value
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
