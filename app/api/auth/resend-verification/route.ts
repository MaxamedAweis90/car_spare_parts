import { NextRequest, NextResponse } from "next/server";
import { ID, Client, Account } from "node-appwrite";
import { usersServer, messagingServer } from "@/lib/appwrite-server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    // Get all cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Find the Appwrite session cookie (it starts with a_session_)
    const sessionCookie = allCookies.find((c) =>
      c.name.startsWith("a_session_")
    );
    const jwtCookie = cookieStore.get("appwrite_jwt");

    if (!sessionCookie && !jwtCookie) {
      console.log("❌ No session or JWT cookie found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Create client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    if (jwtCookie) {
      client.setJWT(jwtCookie.value);
    } else if (sessionCookie) {
      client.setSession(sessionCookie.value);
    }

    const account = new Account(client);
    const user = await account.get();

    // Check if email is already verified
    if (user.emailVerification) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = ID.unique();
    const prefs = await usersServer.getPrefs(user.$id);
    await usersServer.updatePrefs(user.$id, {
      ...prefs,
      emailVerificationToken: verificationToken,
    });

    // Send verification email
    const verifyLink = `${req.nextUrl.origin}/auth/verify?userId=${user.$id}&token=${verificationToken}`;
    const subject = "Verify your email address";
    const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Verify your email</h2>
        <p>Hello ${user.name},</p>
        <p>Please verify your email address <strong>${user.email}</strong> by clicking the button below.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${verifyLink}" class="button">Verify Email Address</a>
        </p>
        <p>If you didn't request this, please contact support immediately.</p>
      </div>
    </body>
    </html>
    `;

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
  } catch (error: any) {
    console.error("❌ Resend verification error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send verification email" },
      { status: 500 }
    );
  }
}
