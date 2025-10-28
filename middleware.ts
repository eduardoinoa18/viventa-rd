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

  // User app experience: if a logged-in non-admin user hits marketing/auth routes, send to dashboard
  const isLoggedInUser = role && role !== 'master_admin' && role !== 'admin';
  const redirectToDashboard = ['/', '/login', '/signup'].includes(pathname);
  if (isLoggedInUser && redirectToDashboard) {
    const dest = new URL('/dashboard', req.url);
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
