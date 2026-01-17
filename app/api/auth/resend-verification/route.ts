import { NextRequest, NextResponse } from "next/server";
import { ID, Client, Account } from "node-appwrite";
import {
  usersServer,
  messagingServer,
  databasesServer,
  appwriteConfig,
} from "@/lib/appwrite-server";
import { cookies } from "next/headers";
import { Query } from "node-appwrite";
import { getVerificationEmailTemplate } from "@/lib/emails/templates";

export async function POST(req: NextRequest) {
  // Parse body for email
  let email = "";
  try {
    const body = await req.json();
    email = body.email;
  } catch {
    /* ignore */
  }

  // Use Admin Client (usersServer) to find user by email or session
  // This avoids "JWT Expired" issues since we are Admin
  let user;

  try {
    if (email) {
      // Strategy 1: Look up by email (Robust)
      const list = await usersServer.list([Query.equal("email", email)]);
      user = list.users[0];
    }

    if (!user) {
      // Strategy 2: Look up by Session (Fallback)
      // Get all cookies
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      const jwtCookie = cookieStore.get("appwrite_jwt");
      const sessionCookie = allCookies.find((c) =>
        c.name.startsWith("a_session_")
      );

      if (!sessionCookie && !jwtCookie) {
        return NextResponse.json(
          { error: "No email provided and not authenticated" },
          { status: 401 }
        );
      }

      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

      if (jwtCookie) client.setJWT(jwtCookie.value);
      else if (sessionCookie) client.setSession(sessionCookie.value);

      const account = new Account(client);
      user = await account.get();
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email is already verified
    if (user.emailVerification) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    console.log(`[ResendVerification] Sending to ${user.email} (${user.$id})`);

    // Generate new verification token (Admin Privilege)
    const verificationToken = ID.unique();
    const prefs = await usersServer.getPrefs(user.$id);
    await usersServer.updatePrefs(user.$id, {
      ...prefs,
      emailVerificationToken: verificationToken,
    });

    // Use Bouncer API for intelligent redirection
    const origin = req.nextUrl.origin;
    const verifyLink = `${origin}/api/auth/verify-link?userId=${user.$id}&token=${verificationToken}`;

    const subject = "Verify your email address";
    const content = getVerificationEmailTemplate(
      user.name,
      user.email,
      verifyLink
    );

    console.log("📧 Resending verification email:", {
      userId: user.$id,
      email: user.email,
      verifyLink,
    });

    const emailMessage = await messagingServer.createEmail(
      ID.unique(),
      subject,
      content,
      [],
      [user.$id],
      [],
      [],
      [],
      [],
      false,
      true
    );

    console.log("✅ Verification email resent successfully:", {
      messageId: emailMessage.$id,
      to: user.email,
    });

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("❌ Resend verification error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to send verification email";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
