import { NextRequest, NextResponse } from "next/server";
import { initAuth } from "./lib/middlewareAuth";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;
  const path = pathname as string;
  const role = req.cookies.get("viventa_role")?.value;
  const adminGate = req.cookies.get('admin_gate_ok')?.value === '1';
  let admin2FA = req.cookies.get('admin_2fa_ok')?.value === '1';
  const trustedAdmin = req.cookies.get('trusted_admin')?.value;

  // ===== Legacy and removed routes =====
  // Legacy property route
  if (path.startsWith('/properties/')) {
    const id = path.replace('/properties/', '').split('/')[0];
    if (id) {
      return NextResponse.redirect(new URL(`/listing/${id}`, req.url), 308);
    }
  }

  // Public pages removed in Step 1A
  const publicRemoved = [
    '/properties',
    '/social',
    '/favorites',
    '/messages',
    '/notifications',
    '/dashboard',
    '/onboarding',
    '/profesionales',
    '/agent',
    '/broker'
  ];
  if (publicRemoved.some((p) => path === p || path.startsWith(`${p}/`))) {
    return NextResponse.redirect(new URL('/search', req.url), 308);
  }

  // Redirect old admin routes to new master namespace
  // Keep /admin/gate and /admin/login for auth flow
  const adminToMaster: Record<string, string> = {
    '/admin/dashboard': '/master',
    '/admin/people': '/master/users',
    '/admin/properties': '/master/listings',
    '/admin/leads': '/master/leads',
    '/admin/applications': '/master/verification',
    '/admin/analytics': '/master/analytics',
  }
  
  // Exact matches
  if (adminToMaster[path]) {
    return NextResponse.redirect(new URL(adminToMaster[path], req.url), 308);
  }
  
  // Redirect /admin root to /master (after auth)
  if (path === '/admin' && role === 'master_admin') {
    return NextResponse.redirect(new URL('/master', req.url), 308);
  }

  // Removed admin surfaces (dead routes)
  const adminRemoved = [
    '/admin/inbox',
    '/admin/chat',
    '/admin/notifications',
    '/admin/billing',
    '/admin/email',
    '/admin/push',
    '/admin/activity',
    '/admin/master',
    '/admin/agents',
    '/admin/brokers',
    '/admin/users',
    '/admin/roles',
    '/admin/people/leads',
    '/admin/people/applications'
  ];
  if (adminRemoved.some((p) => path === p || path.startsWith(`${p}/`))) {
    return NextResponse.redirect(new URL('/master', req.url), 308);
  }

  if (path === '/admin/verify' || path.startsWith('/admin/verify/')) {
    return NextResponse.redirect(new URL('/admin/login', req.url), 308);
  }

  // Public directories that should never trigger auth redirects
  if (path.startsWith('/agents') || path.startsWith('/brokers') || path.startsWith('/contact') || path === '/' ) {
    return NextResponse.next()
  }

  // ============ ADMIN PORTAL AUTHENTICATION ============
  // Admin routes have their own auth system (gate + password + 2FA)
  // Handle these BEFORE the general Firebase auth check
  
  // Admin pre-gate: require gate code before accessing admin login
  if (path.startsWith('/admin') && (path === '/admin' || path === '/admin/login')) {
    if (!adminGate) {
      return NextResponse.redirect(new URL('/admin/gate', req.url));
    }
  }

  // Protect admin routes (all other admin pages require role and 2FA)
  if (path.startsWith('/admin') && !['/admin/login','/admin/gate'].includes(path)) {
    // Must have passed gate
    if (!adminGate) {
      return NextResponse.redirect(new URL('/admin/gate', req.url));
    }
    // Must be master admin
    if (role !== 'master_admin') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    // Must have completed 2FA
    if (!admin2FA) {
      // Try trusted device cookie if present
      if (trustedAdmin) {
        const secret = process.env.TRUSTED_DEVICE_SECRET;
        if (!secret && process.env.NODE_ENV === 'production') {
          console.error('CRITICAL: TRUSTED_DEVICE_SECRET not set in production');
          // Don't trust the device cookie if secret is missing in production
          return NextResponse.redirect(new URL('/admin', req.url));
        }
        const ok = secret ? await verifyTrustedToken(trustedAdmin, secret) : false;
        if (ok) {
          const res = NextResponse.next();
          // Refresh short-lived 2FA cookie to avoid repeated checks within session
          res.cookies.set('admin_2fa_ok', '1', { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 30 });
          return res;
        }
      }
      // Otherwise, redirect to inline 2FA on admin login
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ============ MASTER CONTROL AUTHENTICATION ============
  // /master namespace uses the same auth as /admin during migration
  // Both paths coexist until migration is complete
  if (path.startsWith('/master')) {
    // Must have passed gate
    if (!adminGate) {
      return NextResponse.redirect(new URL('/admin/gate', req.url));
    }
    // Must be master admin
    if (role !== 'master_admin') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    // Must have completed 2FA
    if (!admin2FA) {
      // Try trusted device cookie if present
      if (trustedAdmin) {
        const secret = process.env.TRUSTED_DEVICE_SECRET;
        if (!secret && process.env.NODE_ENV === 'production') {
          console.error('CRITICAL: TRUSTED_DEVICE_SECRET not set in production');
          return NextResponse.redirect(new URL('/admin', req.url));
        }
        const ok = secret ? await verifyTrustedToken(trustedAdmin, secret) : false;
        if (ok) {
          const res = NextResponse.next();
          res.cookies.set('admin_2fa_ok', '1', { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 30 });
          return res;
        }
      }
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // ============ GENERAL USER/PRO AUTHENTICATION ============
  // For most user routes, rely on client-side session checks and cookie-based role
  // Only use strict Firebase auth for critical pro routes (broker/agent dashboards)
  const needsStrictAuth = (p: string) => {
    // Admin routes already handled above
    if (p.startsWith('/admin')) return false;
    return false;
  }
  if (needsStrictAuth(path)) {
    const verified = await initAuth(req);
    if (!verified.ok) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  // User app experience: if a logged-in user hits auth routes, send to search
  const isLoggedInUser = role && role !== 'master_admin';
  const redirectToDashboard = ['/login', '/signup'].includes(pathname); // REMOVED '/' from this list
  if (isLoggedInUser && redirectToDashboard) {
    return NextResponse.redirect(new URL('/search', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (manifest.json, icons, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/.*|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico).*)",
    "/dashboard/:path*"
  ],
};

// ---- helpers: verify HMAC-SHA256 signed token (header.payload.signature) ----
function b64urlToUint8(b64url: string): Uint8Array {
  // pad base64 string
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  if (pad) b64 += '='.repeat(4 - pad);
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function verifyTrustedToken(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [h, p, s] = parts;
    const data = `${h}.${p}`;
    const sig = b64urlToUint8(s);
    const secretBuf = new TextEncoder().encode(secret).buffer as ArrayBuffer;
    const key = await crypto.subtle.importKey(
      'raw',
      secretBuf,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBuf = sig.buffer as ArrayBuffer;
    const dataBuf = new TextEncoder().encode(data).buffer as ArrayBuffer;
    const verified = await crypto.subtle.verify('HMAC', key, sigBuf, dataBuf);
    if (!verified) return false;
    // Check exp
    const payloadJson = new TextDecoder().decode(b64urlToUint8(p));
    const payload = JSON.parse(payloadJson);
    if (!payload || typeof payload !== 'object') return false;
    if (typeof payload.exp !== 'number') return false;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return false;
    return true;
  } catch {
    return false;
  }
}
