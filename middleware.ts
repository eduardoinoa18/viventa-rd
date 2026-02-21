import { NextRequest, NextResponse } from "next/server";
import { initAuth } from "./lib/middlewareAuth";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;
  const path = pathname as string;
  const role = req.cookies.get("viventa_role")?.value;

  // Public directories that should never trigger auth redirects
  if (path.startsWith('/agents') || path.startsWith('/brokers') || path.startsWith('/contact') || path.startsWith('/profesionales') || path.startsWith('/constructoras') || path === '/' ) {
    return NextResponse.next()
  }

  // Admin legacy namespace is permanently deprecated
  if (path.startsWith('/admin')) {
    return new NextResponse('Gone', { status: 410 });
  }

  // ============ GENERAL USER/PRO AUTHENTICATION ============
  const needsStrictAuth = (p: string) => {
    return p.startsWith('/broker') || (p.startsWith('/agent') && p !== '/agent/assistant');
  }
  if (needsStrictAuth(path)) {
    const verified = await initAuth(req);
    if (!verified.ok) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/broker")) {
    if (role !== "broker" && role !== "master_admin" && role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (pathname.startsWith("/agent") && pathname !== "/agent/assistant") {
    if (role !== "agent" && role !== "broker" && role !== "master_admin" && role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  const isLoggedInUser = role && role !== 'master_admin' && role !== 'admin';
  const redirectToDashboard = ['/login', '/signup'].includes(pathname);
  if (isLoggedInUser && redirectToDashboard) {
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
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/.*|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico).*)",
    "/dashboard/:path*"
  ],
};
