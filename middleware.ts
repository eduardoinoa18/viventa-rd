import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;

  // Protect agent dashboard
  if (pathname.startsWith("/dashboard/agent")) {
    const role = req.cookies.get("viventa_role")?.value;
    if (role !== "agent") {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
