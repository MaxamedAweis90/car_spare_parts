import { NextRequest, NextResponse } from "next/server";
import setCookieParser from "set-cookie-parser";
import {
  ensureAppwriteUser,
  findUserByEmail,
  sanitizeUser,
  verifyPassword,
} from "@/lib/auth/auth-utils";
import {
  createAppwriteEmailSession,
  triggerAppwriteVerification,
} from "@/lib/server/appwrite-auth-actions";
import { createAdminClient } from "@/lib/server/appwrite-admin";
import { appwriteConfig, databasesServer } from "@/lib/api/appwrite-server";
import { logActivity } from "@/lib/server/auditService";

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;

export async function POST(req: NextRequest) {
  try {
    const { email, password, requiredRole } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 },
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Allow pending sellers to login (they'll be redirected to pending page by client)
    // But block truly inactive users (admin-deactivated)
    if (user.isActive === false && user.sellerApproved !== false) {
      return NextResponse.json({ error: "User is inactive" }, { status: 403 });
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Password not set for this user" },
        { status: 400 },
      );
    }

    const passwordOk = await verifyPassword(password, user.passwordHash);
    if (!passwordOk) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // --- Strict Portal Guard ---
    // --- Strict Portal Guard ---
    if (requiredRole) {
      // Logic:
      // 1. If required is "admin", user must be "admin" or "main_admin"
      // 2. If required is "seller", user must be "seller"
      // 3. If required is "customer", user must be "customer"

      const role = user.role || "customer";
      let isAuthorized = false;

      if (requiredRole === "admin") {
        isAuthorized = role === "admin" || role === "main_admin";
      } else {
        isAuthorized = role === requiredRole;
      }

      if (!isAuthorized) {
        let redirectUrl = "/";
        if (role === "admin" || role === "main_admin")
          redirectUrl = "/auth/admin/login";
        else if (role === "seller") redirectUrl = "/auth/seller/login";
        else redirectUrl = "/auth/login";

        return NextResponse.json(
          {
            error: `Access Denied: You account belongs to the ${role} portal.`,
            redirectUrl,
            redirectLabel: `Go to ${role === "main_admin" ? "Admin" : role.charAt(0).toUpperCase() + role.slice(1)} Portal`,
          },
          { status: 403 },
        );
      }
    }
    // ---------------------------
    // ---------------------------

    // Ensure an Appwrite auth user exists for this email (helps legacy profiles).
    if (!user.appwriteUserId) {
      try {
        await ensureAppwriteUser({
          name: user.name,
          email: user.email,
          password,
        });
      } catch (err) {
        // If the auth user already exists, continue; otherwise surface error.
        const message = (err as any)?.message || "";
        const conflict =
          typeof message === "string" &&
          message.toLowerCase().includes("exists");
        if (!conflict) throw err;
      }
    }

    const { session, cookies, jwt } = await createAppwriteEmailSession(
      email,
      password,
    );

    // Check mandatory email verification
    const { users: serverUsers } = createAdminClient();
    const appwriteUser = await serverUsers.get(session.userId);

    // Dynamic Sync: If verified by Appwrite but still deactivated in our DB, activate them now.
    if (appwriteUser.emailVerification && user.status === "deactivated") {
      await databasesServer.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        user.$id,
        { status: "active", isActive: true },
      );
      // Update local user object for the rest of the function
      user.status = "active";
      user.isActive = true;
    }

    if (user.status && user.status !== "active") {
      // If status is 'deactivated', we might still want to allow them to "login"
      // partially so they can verify their email (lazy sync).
      // But we should ONLY allow this if it's strictly an email-verification issue.
      // If the admin manually deactivated them, user.status is 'deactivated'.
      // For now, prompt verification if deactivated.

      if (user.status === "terminated") {
        return NextResponse.json(
          { error: "Account terminated" },
          { status: 403 },
        );
      }
      // For 'deactivated', we proceed to set cookies but will return mustVerify = true below.
    }

    const res = NextResponse.json(
      !appwriteUser.emailVerification
        ? {
            error: "Email not verified",
            userId: session.userId,
            mustVerify: true,
            email: user.email,
          }
        : {
            user: sanitizeUser(user),
            session,
            jwt,
          },
      {
        status: 200,
      },
    );

    cookies.forEach((cookie: any) => {
      res.cookies.set({
        name: cookie.name,
        value: cookie.value,
        path: cookie.path || "/",
        // Do not forward the domain from Appwrite; set host-only for this app.
        domain: undefined,
        httpOnly: cookie.httpOnly,
        // Allow cookies over HTTP in dev; enforce secure in production.
        secure: process.env.NODE_ENV === "production",
        sameSite: (cookie.sameSite as "lax" | "strict" | "none") || "lax",
        expires: cookie.expires ? new Date(cookie.expires) : undefined,
        maxAge: cookie.maxAge,
      });
    });

    if (jwt) {
      res.cookies.set({
        name: "appwrite_jwt",
        value: jwt,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    // --- Session Limiting Logic ---
    try {
      const { users: serverUsers } = createAdminClient();
      const { sessions: activeSessions } = await serverUsers.listSessions(
        session.userId,
      );

      // Determine limit based on role
      // Admin/Main Admin -> 1
      // Seller/Customer -> 3
      const limit = user.role === "admin" || user.role === "main_admin" ? 1 : 3;

      if (activeSessions.length > limit) {
        // Sort by creation time (oldest first)
        const sortedSessions = activeSessions.sort(
          (a: any, b: any) =>
            new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime(),
        );

        // Calculate how many to remove
        const toRemoveCount = activeSessions.length - limit;

        // Take the oldest 'toRemoveCount' sessions
        const sessionsToRemove = sortedSessions.slice(0, toRemoveCount);

        for (const s of sessionsToRemove) {
          // Avoid deleting the session we just created, although it should be the newest.
          if (s.$id === session.$id) continue;

          await serverUsers.deleteSession(session.userId, s.$id);
          console.log(`Pruned old session ${s.$id} for user ${user.email}`);
        }
      }
    } catch (limitErr) {
      console.error("Error enforcing session limits:", limitErr);
      // Non-blocking: don't fail the login if pruning fails
    }
    // ------------------------------

    // Log admin login activity
    if (user.role && (user.role === "admin" || user.role === "main_admin")) {
      // Don't await log to avoid slowing down login response
      logActivity({
        adminId: user.$id,
        adminName: user.name || "Admin",
        action: "LOGIN_ADMIN",
        details: "Admin logged in",
      }).catch((err) =>
        console.warn("Failed to log admin login activity", err),
      );
    }

    return res;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 },
    );
  }
}
