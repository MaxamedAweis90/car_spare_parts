import { NextRequest, NextResponse } from "next/server";

// Redirect authenticated users away from auth pages before any HTML is rendered.
export async function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // Only run on /auth routes.
  if (!pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  // Call existing session endpoint using incoming cookies to resolve role.
  const cookieHeader = request.headers.get("cookie") || "";
  let profile: any | null = null;
  let authenticated = false;

  try {
    const meRes = await fetch(`${origin}/api/auth/me`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });

    if (meRes.ok) {
      const body = await meRes.json();
      authenticated = !!body?.authenticated;
      profile = body?.profile || null;
    }
  } catch {
    // Ignore errors and continue to page.
  }

  if (!authenticated || !profile) {
    return NextResponse.next();
  }

  let destination: string | null = null;

  if (profile.role === "seller") {
    destination = profile.sellerApproved === false ? "/auth/seller/pending" : "/seller";
  } else if (profile.role === "admin" || profile.role === "main_admin") {
    destination = "/admin";
  } else {
    destination = "/"; // customers and any other roles
  }

  // Avoid redirect loop if already at destination.
  if (destination && pathname !== destination) {
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*"],
};
