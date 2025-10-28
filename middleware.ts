import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;
  const role = req.cookies.get("viventa_role")?.value;

  // Protect admin routes
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (role !== "master_admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
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

  // User app experience: if a logged-in non-admin user hits marketing/auth routes, send to appropriate dashboard
  const isLoggedInUser = role && role !== 'master_admin' && role !== 'admin';
  const redirectToDashboard = ['/', '/login', '/signup'].includes(pathname);
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
