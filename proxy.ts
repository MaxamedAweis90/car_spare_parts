import { NextRequest, NextResponse } from "next/server";

// Redirect authenticated users away from auth pages before any HTML is rendered.
export async function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;
  const cookieHeader = request.headers.get("cookie") || "";
  const sessionCookie = request.cookies.get("session_id"); // Fast check for existence
  const isAuthenticated = !!sessionCookie;

  // 1. Friendly Redirects (Fixing broken links customer might type)
  if (pathname === "/seller/login") {
    return NextResponse.redirect(new URL("/auth/seller/login", request.url));
  }
  if (pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/auth/admin/login", request.url));
  }
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  if (pathname === "/register") {
    return NextResponse.redirect(new URL("/auth/register", request.url));
  }

  // NOTE: Auth protection is handled by server layouts (app/admin/layout.tsx, app/seller/layout.tsx).
  // This proxy only handles URL normalization.

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Friendly redirects
    "/login",
    "/register",
    "/seller/login",
    "/admin/login",
  ],
};
