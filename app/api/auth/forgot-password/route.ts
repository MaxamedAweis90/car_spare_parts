import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/server/appwrite-admin";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { account } = createAdminClient();

    // In Appwrite, we use createRecovery to send the email.
    // The link should point to our frontend reset-password page.
    const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const url = `${origin}/auth/reset-password`;

    await account.createRecovery(email, url);

    return NextResponse.json({ message: "Recovery email sent" });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    // Even if user doesn't exist, we usually return success for security (preventing email enumeration)
    // But Appwrite might throw 404. Let's return success regardless if it's a "user not found"
    if (error?.code === 404) {
      return NextResponse.json({ message: "Recovery email sent" });
    }
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

