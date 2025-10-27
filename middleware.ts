import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;

  // Protect admin routes
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const role = req.cookies.get("viventa_role")?.value;
    if (role !== "master_admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
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
