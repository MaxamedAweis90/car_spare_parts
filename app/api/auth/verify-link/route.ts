import { NextRequest, NextResponse } from "next/server";
import {
  usersServer,
  databasesServer,
  appwriteConfig,
} from "@/lib/api/appwrite-server";
import { cookies } from "next/headers";
import { Query } from "node-appwrite";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  if (!userId || !token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // 1. Determine User Role
  // We need to fetch the local user doc to know where to send them
  let role = "customer";
  try {
    const list = await usersServer.list([Query.equal("$id", userId)]);
    const appwriteUser = list.users[0];

    if (appwriteUser) {
      // Try to find local user doc by email
      const dbUsers = await databasesServer.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal("email", appwriteUser.email)]
      );
      const userDoc = dbUsers.documents[0];
      if (userDoc) {
        role = userDoc.role;
      }
    }
  } catch (error) {
    console.error("Failed to fetch user role for redirect", error);
  }

  // 2. Determine Routes
  let dashboardPath = "/account"; // Default customer
  let loginPath = "/auth/login";

  if (role === "seller") {
    dashboardPath = "/seller";
    loginPath = "/auth/seller/login";
  } else if (role === "admin" || role === "main_admin") {
    dashboardPath = "/admin";
    loginPath = "/auth/admin/login";
  }

  const finalDestination = `${dashboardPath}?userId=${userId}&token=${token}`;

  // 3. Check Session
  const cookieStore = await cookies();
  const jwtCookie = cookieStore.get("appwrite_jwt");
  const sessionCookie = cookieStore
    .getAll()
    .find((c) => c.name.startsWith("a_session_"));

  if (jwtCookie || sessionCookie) {
    // Optimistic: Assume logged in, redirect to dashboard
    // If session is invalid, the Dashboard Guard (Layout or Middleware) will kick them to login
    // BUT we must ensure the guard PRESERVES the params.
    // Since we know our guards are simple, sending them to dashboard might loop if expired.
    // Ideally we check session validity here, but that's expensive/complex.

    return NextResponse.redirect(new URL(finalDestination, req.url));
  } else {
    // Definite: Not logged in
    const callbackUrl = encodeURIComponent(finalDestination);
    return NextResponse.redirect(
      new URL(`${loginPath}?callbackUrl=${callbackUrl}`, req.url)
    );
  }
}

