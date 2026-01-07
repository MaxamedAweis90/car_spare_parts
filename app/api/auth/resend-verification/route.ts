import { NextRequest, NextResponse } from "next/server";
import {
  createAppwriteEmailSession,
  triggerAppwriteVerification,
} from "@/lib/server/appwrite-auth-actions";
import { getSessionFromRequest } from "@/lib/server/getSession";

export async function POST(req: NextRequest) {
  try {
    let { email, password } = await req.json().catch(() => ({}));

    if (!email) {
      const session = await getSessionFromRequest(req);
      if (session?.account?.email) {
        email = session.account.email;
      }
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required to resend verification." },
        { status: 400 }
      );
    }

    // 1. Get session or create one
    let cookieHeader = req.headers.get("cookie") || "";

    if (password) {
      // If password provided, ensure we have a fresh session
      const sessionData = await createAppwriteEmailSession(email, password);
      cookieHeader = sessionData.cookieHeader;
    }

    if (!cookieHeader) {
      return NextResponse.json(
        { error: "Active session or password required." },
        { status: 401 }
      );
    }

    // 2. Trigger verification
    const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const success = await triggerAppwriteVerification(cookieHeader, origin);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verification email sent successfully.",
    });
  } catch (error: any) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
