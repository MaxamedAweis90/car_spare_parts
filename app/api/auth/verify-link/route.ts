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

  try {
    // 1. Verify the token
    const appwriteUser = await usersServer.get(userId);
    const prefs = await usersServer.getPrefs(userId);

    if (prefs.emailVerificationToken !== token) {
      return NextResponse.redirect(
        new URL("/auth/login?error=invalid_token", req.url),
      );
    }

    // 2. Mark user as verified
    await usersServer.updateEmailVerification(userId, true);

    // 3. Clear the verification token
    await usersServer.updatePrefs(userId, {
      ...prefs,
      emailVerificationToken: null,
    });

    // 4. Update database status to active
    const dbUsers = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("email", appwriteUser.email)],
    );
    const userDoc = dbUsers.documents[0];

    if (userDoc && userDoc.status === "deactivated") {
      await databasesServer.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        userDoc.$id,
        { status: "active", isActive: true },
      );
    }

    const role = userDoc?.role || "customer";

    // 5. For customers only: Create session and auto-login
    if (role === "customer") {
      // Create a magic URL token for auto-login
      const { createAdminClient } = await import("@/lib/server/appwrite-admin");
      const { users } = createAdminClient();

      // Create a magic URL token
      const magicToken = await users.createToken(userId);

      // Set the session cookie with the token secret
      const cookieStore = await cookies();
      cookieStore.set(
        `a_session_${appwriteConfig.projectId}`,
        magicToken.secret,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 365, // 1 year
        },
      );

      // Redirect to home page
      return NextResponse.redirect(new URL("/", req.url));
    }

    // 6. For sellers and admins: redirect to their respective login pages
    let loginPath = "/auth/login";
    if (role === "seller") {
      loginPath = "/auth/seller/login";
    } else if (role === "admin" || role === "main_admin") {
      loginPath = "/auth/admin/login";
    }

    return NextResponse.redirect(
      new URL(`${loginPath}?verified=true`, req.url),
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=verification_failed", req.url),
    );
  }
}
