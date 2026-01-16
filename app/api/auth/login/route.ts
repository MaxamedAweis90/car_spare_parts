import { NextRequest, NextResponse } from "next/server";
import setCookieParser from "set-cookie-parser";
import {
  ensureAppwriteUser,
  findUserByEmail,
  sanitizeUser,
  verifyPassword,
} from "@/lib/auth-utils";
import {
  createAppwriteEmailSession,
  triggerAppwriteVerification,
} from "@/lib/server/appwrite-auth-actions";
import { createAdminClient } from "@/lib/server/appwrite-admin";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";
import { logActivity } from "@/lib/server/auditService";

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
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
        { status: 400 }
      );
    }

    const passwordOk = await verifyPassword(password, user.passwordHash);
    if (!passwordOk) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

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
      password
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
        { status: "active", isActive: true }
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
          { status: 403 }
        );
      }
      // For 'deactivated', we proceed to set cookies but will return mustVerify = true below.
    }

    const res = NextResponse.json(
      !appwriteUser.emailVerification && user.role === "customer"
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
        status:
          !appwriteUser.emailVerification && user.role === "customer"
            ? 403
            : 200,
      }
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

    // Log admin login activity
    if (user.role && (user.role === "admin" || user.role === "main_admin")) {
      // Don't await log to avoid slowing down login response
      logActivity({
        adminId: user.$id,
        adminName: user.name || "Admin",
        action: "LOGIN_ADMIN",
        details: "Admin logged in",
      }).catch((err) =>
        console.warn("Failed to log admin login activity", err)
      );
    }

    return res;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
