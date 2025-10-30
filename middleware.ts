import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;
  const path = pathname as string;
  const role = req.cookies.get("viventa_role")?.value;
  const adminGate = req.cookies.get('admin_gate_ok')?.value === '1';
  const admin2FA = req.cookies.get('admin_2fa_ok')?.value === '1';

  // Admin pre-gate: require gate code before accessing admin login
  if (path.startsWith('/admin') && (path === '/admin' || path === '/admin/login')) {
    if (!adminGate) {
      return NextResponse.redirect(new URL('/admin/gate', req.url));
    }
  }

  // Protect admin routes (all other admin pages require role and 2FA)
  if (path.startsWith('/admin') && !['/admin/login','/admin/gate','/admin/verify'].includes(path)) {
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
      // Preserve email param if present
      const verifyUrl = new URL('/admin/verify', req.url);
      return NextResponse.redirect(verifyUrl);
    }
  }

  // Protect broker routes
  if (pathname.startsWith("/broker")) {
    if (role !== "broker" && role !== "master_admin" && role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Protect agent routes (excluding /agent/assistant which is open to all pros)
  if (pathname.startsWith("/agent") && pathname !== "/agent/assistant") {
    if (role !== "agent" && role !== "broker" && role !== "master_admin" && role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // User app experience: if a logged-in non-admin user hits auth routes (NOT homepage), send to appropriate dashboard
  const isLoggedInUser = role && role !== 'master_admin' && role !== 'admin';
  const redirectToDashboard = ['/login', '/signup'].includes(pathname); // REMOVED '/' from this list
  if (isLoggedInUser && redirectToDashboard) {
    // Route to appropriate dashboard based on role
    let dest;
    if (role === 'broker') {
      dest = new URL('/broker', req.url);
    } else if (role === 'agent') {
      dest = new URL('/agent', req.url);
    } else {
      dest = new URL('/dashboard', req.url);
    }
    return NextResponse.redirect(dest);
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
